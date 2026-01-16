import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { LLMManager } from './LLMProvider';

export interface AIResolution {
    question: string;
    outcome: boolean;
    confidence: number;
    sources: string[];
    reasoning: string;
    provider?: string;
    model?: string;
}

interface SemanticOracleConfig extends AdapterConfig {
    llmManager?: LLMManager;
    provider?: string;
}

export class SemanticOracleAdapter extends BaseAdapter<AIResolution> {
    private llmManager: LLMManager;
    private preferredProvider?: string;

    constructor(config: SemanticOracleConfig = { name: 'SemanticOracle' }) {
        super({ ...config, name: 'SemanticOracle' });
        this.llmManager = config.llmManager || new LLMManager();
        this.preferredProvider = config.provider;
    }

    protected async fetchData(params: { question: string, context?: string }): Promise<AIResolution> {
        const context = params.context || "";

        const prompt = `
        You are an impartial Judge for a predict prediction market.
        Question: "${params.question}"
        Context: ${context ? `"${context}"` : "No external context provided. Rely on your training data."}
        
        Determine the outcome based on the context and your knowledge base.
        Return ONLY a JSON object: { "outcome": boolean, "confidence": number (0-1), "reasoning": "string" }
        `;

        const response = await this.llmManager.call(prompt, {
            provider: this.preferredProvider,
            systemPrompt: 'You are a factual oracle. Answer in valid JSON only.',
            temperature: 0,
            maxTokens: 500
        });

        const json = JSON.parse(response.content);

        return {
            question: params.question,
            outcome: json.outcome,
            confidence: json.confidence,
            sources: ["LLM Knowledge Base"],
            reasoning: json.reasoning,
            provider: response.provider,
            model: response.model
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
