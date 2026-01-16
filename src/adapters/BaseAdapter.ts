import axios, { AxiosInstance } from 'axios';

export interface AdapterConfig {
    apiKey?: string;
    rateLimitRequestPerMinute?: number;
    useMocks?: boolean;
    name: string;
}

export abstract class BaseAdapter<T> {
    protected config: AdapterConfig;
    protected client: any; // Relaxed for multiple client types (Axios, Viem, etc)
    private pendingRequests: Map<string, Promise<T>> = new Map();
    private requestQueue: Array<() => void> = [];
    private lastRequestTime: number = 0;

    constructor(config: AdapterConfig) {
        this.config = config;
        this.client = axios.create({ timeout: 10000 });
        this.processQueue();
    }

    // Cache Storage: Key -> { data, expiry }
    private cache: Map<string, { data: T; expiry: number }> = new Map();
    private readonly CACHE_TTL_MS = 30000; // 30 seconds default
    private readonly RETRY_ATTEMPTS = 3;

    /**
     * Primary public method to get data. 
     * Handles Cache, Deduplication, Retry, Rate Limiting, and Mock Mode.
     */
    public async getData(params: any): Promise<T> {
        // 0. Deterministic Key (Sort keys recursively)
        const key = this.stableStringify(params);

        // 1. Cache Check
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiry) {
            console.log(`[${this.config.name}] returning CACHED data`);
            return cached.data;
        }

        // 2. Mock Mode
        if (this.config.useMocks) {
            console.log(`[${this.config.name}] returning MOCK data`);
            return this.getMockData(params);
        }

        // 3. Deduplication
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)!;
        }

        // 4. Rate Limit Fail-Fast Check
        if (this.config.rateLimitRequestPerMinute) {
            const delay = 60000 / this.config.rateLimitRequestPerMinute;
            const timeSinceLast = Date.now() - this.lastRequestTime;
            const estimatedWait = Math.max(0, delay - timeSinceLast);

            // If queue + wait > 10s (axios timeout), fail immediately
            if (estimatedWait > 10000) {
                throw new Error(`[${this.config.name}] Rate limit backlog full. Try again later.`);
            }
        }

        const promise = this.retryWithBackoff(() =>
            this.executeWithRateLimit(() => this.fetchData(params))
        ).then(data => {
            this.cache.set(key, { data, expiry: Date.now() + this.CACHE_TTL_MS });
            return data;
        }).finally(() => {
            this.pendingRequests.delete(key);
        });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    private stableStringify(obj: any): string {
        if (typeof obj !== 'object' || obj === null) return String(obj);
        if (Array.isArray(obj)) return '[' + obj.map(x => this.stableStringify(x)).join(',') + ']';
        return '{' + Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${this.stableStringify(obj[k])}`).join(',') + '}';
    }

    private async retryWithBackoff<R>(fn: () => Promise<R>): Promise<R> {
        let attempt = 0;
        while (true) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                if (attempt > this.RETRY_ATTEMPTS) throw error;
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.warn(`[${this.config.name}] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    // Abstract methods to be implemented by detailed adapters
    protected abstract fetchData(params: any): Promise<T>;
    protected abstract getMockData(params: any): Promise<T>;

    // --- Rate Limiting Logic (Token Bucket / Leaky Bucket simpl.) ---
    private async executeWithRateLimit<R>(fn: () => Promise<R>): Promise<R> {
        if (!this.config.rateLimitRequestPerMinute) return fn();

        const delay = 60000 / this.config.rateLimitRequestPerMinute;
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;

        if (timeSinceLast < delay) {
            const waitTime = delay - timeSinceLast;
            this.lastRequestTime = now + waitTime;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
            this.lastRequestTime = now;
        }

        return fn();
    }

    private processQueue() {
        // Advanced queue logic can go here (e.g. strict token bucket)
        // For now, executeWithRateLimit handles simple spacing.
    }
}
