/**
 * LLM Provider Interface
 * Abstracts different LLM APIs (OpenAI, Anthropic, Gemini, Groq)
 */

export interface LLMCallOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface LLMResponse {
    content: string;
    provider: string;
    model: string;
    tokensUsed?: number;
}

export interface LLMProvider {
    name: string;
    call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse>;
    isAvailable(): Promise<boolean>;
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements LLMProvider {
    name = 'openai';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'gpt-4o-mini') {  // Updated: gpt-4o-mini is latest, cheapest
        this.apiKey = apiKey;
        this.model = model;
    }

    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            provider: 'openai',
            model: this.model,
            tokensUsed: data.usage?.total_tokens
        };
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

/**
 * Anthropic Claude Provider
 */
export class AnthropicProvider implements LLMProvider {
    name = 'anthropic';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'claude-3-haiku-20240307') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: options?.maxTokens ?? 1000,
                messages: [
                    { role: 'user', content: prompt }
                ],
                ...(options?.systemPrompt && { system: options.systemPrompt }),
                temperature: options?.temperature ?? 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            provider: 'anthropic',
            model: this.model,
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens
        };
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Anthropic doesn't have a models endpoint, so we'll just check if API key format is valid
            return this.apiKey.startsWith('sk-ant-');
        } catch {
            return false;
        }
    }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider implements LLMProvider {
    name = 'gemini';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'gemini-1.5-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
        const systemInstruction = options?.systemPrompt ?
            { parts: [{ text: options.systemPrompt }] } : undefined;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    ...(systemInstruction && { systemInstruction }),
                    generationConfig: {
                        temperature: options?.temperature ?? 0.7,
                        maxOutputTokens: options?.maxTokens ?? 1000
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            provider: 'gemini',
            model: this.model,
            tokensUsed: data.usageMetadata?.totalTokenCount
        };
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
            );
            return response.ok;
        } catch {
            return false;
        }
    }
}

/**
 * Groq Provider (Fast inference)
 */
export class GroqProvider implements LLMProvider {
    name = 'groq';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'llama-3.1-8b-instant') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse> {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 1000
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            provider: 'groq',
            model: this.model,
            tokensUsed: data.usage?.total_tokens
        };
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

/**
 * LLM Manager with Fallback Chain
 */
export class LLMManager {
    private providers: Map<string, LLMProvider> = new Map();
    private fallbackChain: string[] = [];

    addProvider(name: string, provider: LLMProvider): void {
        this.providers.set(name, provider);
    }

    setFallbackChain(chain: string[]): void {
        this.fallbackChain = chain;
    }

    async call(
        prompt: string,
        options?: LLMCallOptions & { provider?: string }
    ): Promise<LLMResponse> {
        const primaryProvider = options?.provider || this.fallbackChain[0];

        if (!primaryProvider) {
            throw new Error('No LLM provider configured');
        }

        // Try primary provider
        const provider = this.providers.get(primaryProvider);
        if (provider) {
            try {
                return await provider.call(prompt, options);
            } catch (error: any) {
                console.warn(`[LLM] ${primaryProvider} failed: ${error.message}`);
            }
        }

        // Try fallback chain
        for (const fallbackName of this.fallbackChain) {
            if (fallbackName === primaryProvider) continue; // Skip already tried

            const fallbackProvider = this.providers.get(fallbackName);
            if (fallbackProvider) {
                try {
                    console.log(`[LLM] Falling back to ${fallbackName}`);
                    const result = await fallbackProvider.call(prompt, options);
                    return { ...result, provider: `${result.provider} (fallback)` };
                } catch (error: any) {
                    console.warn(`[LLM] ${fallbackName} also failed: ${error.message}`);
                }
            }
        }

        throw new Error('All LLM providers failed');
    }
}
