import { BaseAdapter, AdapterConfig } from '../BaseAdapter';

export interface AIResolution {
    question: string;
    outcome: boolean; // True/False or Probability?
    confidence: number;
    sources: string[];
    reasoning: string;
}

export class SemanticOracleAdapter extends BaseAdapter<AIResolution> {
    constructor(config: AdapterConfig = { name: 'SemanticOracle' }) {
        super({ ...config, name: 'SemanticOracle' });
    }

    protected async fetchData(params: { question: string }): Promise<AIResolution> {
        const apiKey = this.config.apiKey;
        if (!apiKey) throw new Error("SemanticOracle requires API Key (OpenAI)");

        // 1. (Optional) Search Step - omitted for v1.1.0 MVP, relying on LLM internal knowledge or context
        // Ideally we would fetch search results here and append to prompt.

        // 2. LLM Call
        const prompt = `
        You are an impartial Judge for a prediction market.
        Question: "${params.question}"
        
        Determine the outcome based on your knowledge base.
        Return ONLY a JSON object: { "outcome": boolean, "confidence": number (0-1), "reasoning": "string" }
        `;

        const res = await this.client.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            json_schema: { type: "json_object" } // Enforce JSON
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const json = JSON.parse(res.data.choices[0].message.content);

        return {
            question: params.question,
            outcome: json.outcome,
            confidence: json.confidence,
            sources: ["LLM Knowledge Base"],
            reasoning: json.reasoning
        };
    }

    protected async getMockData(params: { question: string }): Promise<AIResolution> {
        return {
            question: params.question,
            outcome: true,
            confidence: 0.95,
            sources: ['https://wikipedia.org', 'https://bbc.com'],
            reasoning: "Multiple reliable sources confirm the event occurred."
        };
    }
}
