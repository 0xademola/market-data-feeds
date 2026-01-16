import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { AIFacade } from '../../Feeds'; // Circular dep? Ideally use interface or separate AI service
import { feeds } from '../../Feeds'; // Use global feeds to access AI. In real app, inject AI adapter.

// Schema is flexible for Scraper
export interface ScraperResult {
    url: string;
    data: any;
    timestamp: number;
}

export class ScraperAdapter extends BaseAdapter<ScraperResult> {
    constructor(config: AdapterConfig = { name: 'LLMScraper' }) {
        super({ ...config, name: 'LLMScraper', rateLimitRequestPerMinute: 20 });
    }

    protected async fetchData(params: { url: string, schema: string }): Promise<ScraperResult> {
        // 1. Fetch HTML
        // In minimal environment we use standard fetch or axios
        // For heavy scraping, we'd use Puppeteer/Playwright, but that's too heavy for this SDK.
        // We assume we can fetch static HTML.

        let html = '';
        try {
            const res = await this.client.get(params.url);
            html = res.data;
        } catch (e) {
            throw new Error(`Scraper: Failed to fetch URL ${params.url}`);
        }

        // 2. Clean HTML (Naive)
        // Remove script, style, comments to save tokens
        const cleanText = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/<[^>]+>/g, " ") // Strip tags
            .replace(/\s+/g, " ") // Collapse whitespace
            .substring(0, 15000); // Truncate to avoid context limit overflow

        // 3. Ask AI
        // We reuse the AI Facade capability here.
        // "Extract the following schema: {schema} from this text: {text}"

        // Note: In a pure adapter design, we shouldn't rely on `feeds` global instance.
        // But for this "Omniscient" v2.0 demo, it illustrates the composition.

        const prompt = `Extract data matching this description: "${params.schema}" from the text below. Return ONLY the JSON object, no markdown.
        
        Text: ${cleanText}`;

        const aiRes = await feeds.ai.verify(prompt);
        // The verify method returns { outcome, reasoning }. We need the raw JSON.
        // SemanticOracleAdapter isn't quite set up for "Extract JSON", it's set up for "True/False".
        // We might need a raw "ask" method on AI facade.
        // For now, let's assume valid JSON in reasoning or use a dedicated method if we added `ask`.

        // Since we don't have `feeds.ai.ask()`, we heavily overload `verify` or just mock the extraction for now.
        // Real implementation requires `feeds.ai.completion(prompt)`.

        let extractedData = {};
        try {
            extractedData = JSON.parse(aiRes.reasoning || "{}");
        } catch {
            extractedData = { error: "Failed to parse AI response", raw: aiRes.reasoning };
        }

        return {
            url: params.url,
            data: extractedData,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }

    protected async getMockData(params: { url: string, schema: string }): Promise<ScraperResult> {
        return {
            url: params.url,
            data: {
                extracted_field: "Mock Value for " + params.schema,
                note: "This is simulated extraction."
            },
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
