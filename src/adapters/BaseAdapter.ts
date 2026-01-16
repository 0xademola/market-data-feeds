import axios, { AxiosInstance } from 'axios';
import { CircuitBreaker, FeedError } from '../utils/CircuitBreaker';
import { LRUCache } from '../utils/LRUCache';
import { MetricsHooks } from '../instrumentation/MetricsHooks';

export interface AdapterConfig {
    apiKey?: string;
    rateLimitRequestPerMinute?: number;
    useMocks?: boolean;
    name: string;
    cacheTTL?: number; // Custom TTL per adapter
    cacheMaxSize?: number; // Custom cache size
    metrics?: MetricsHooks; // Observability hooks
}

export abstract class BaseAdapter<T> {
    protected config: AdapterConfig;
    protected client: any; // Relaxed for multiple client types (Axios, Viem, etc)
    private pendingRequests: Map<string, Promise<T>> = new Map();
    private requestQueue: Array<() => void> = [];
    private lastRequestTime: number = 0;
    private circuitBreaker: CircuitBreaker = new CircuitBreaker(5, 60000, 3);

    constructor(config: AdapterConfig) {
        this.config = config;
        this.client = axios.create({ timeout: 10000 });

        // Initialize LRU cache with config
        this.CACHE_TTL_MS = config.cacheTTL || 30000;
        this.cache = new LRUCache<T>(
            config.cacheMaxSize || 1000,
            this.CACHE_TTL_MS
        );

        this.processQueue();
    }

    // Enhanced LRU Cache
    private cache: LRUCache<T>;
    private readonly CACHE_TTL_MS: number;
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
        if (cached) {
            console.log(`[${this.config.name}] Cache HIT`);
            return cached;
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

        // 5. Execute with Circuit Breaker + Retry
        const promise = this.circuitBreaker.execute(
            () => this.executeWithRetry(params),
            this.config.name
        );
        this.pendingRequests.set(key, promise);

        try {
            const data = await promise;
            // Cache Success
            this.cache.set(key, data, this.CACHE_TTL_MS);
            return data;
        } catch (err: any) {
            // Enhanced error handling
            if (err instanceof FeedError) {
                throw err; // Already enhanced
            }

            // Sanitize and wrap in FeedError
            const sanitizedError = this.sanitizeError(err);
            throw new FeedError(`[${this.config.name}] ${sanitizedError.message}`, {
                source: this.config.name,
                statusCode: err.response?.status,
                isRetryable: this.isRetryableError(err),
                originalError: err
            });
        } finally {
            this.pendingRequests.delete(key);
            this.lastRequestTime = Date.now(); // Update last request time after completion/failure
        }
    }

    private stableStringify(obj: any): string {
        if (typeof obj !== 'object' || obj === null) return String(obj);
        if (Array.isArray(obj)) return '[' + obj.map(x => this.stableStringify(x)).join(',') + ']';
        return '{' + Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${this.stableStringify(obj[k])}`).join(',') + '}';
    }

    private async executeWithRetry(params: any): Promise<T> {
        let attempt = 0;
        while (true) {
            try {
                return await this.executeWithRateLimit(() => this.fetchData(params));
            } catch (error: any) {
                attempt++;

                if (attempt > this.RETRY_ATTEMPTS) {
                    throw error;
                }

                // Don't retry non-retryable errors
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`[${this.config.name}] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    private isRetryableError(error: any): boolean {
        // Network errors are retryable
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return true;
        }

        // HTTP status codes that are retryable
        const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
        if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
            return true;
        }

        return false;
    }

    private sanitizeError(error: any): Error {
        if (!error) return new Error("Unknown Error");

        const msg = error.message || String(error);
        // Regex to scrub common secret patterns
        // Matches: key=..., token=..., Authorization: ...
        const scrubbedMsg = msg
            .replace(/(key|token|api_key|access_token)=([a-zA-Z0-9_\-]+)/gi, '$1=***')
            .replace(/(Authorization:\s*)(Bearer\s+)?([a-zA-Z0-9_\-\.]+)/gi, '$1$2***');

        // If it's an Axios error, scrub the config URL
        if (error.config && error.config.url) {
            error.config.url = error.config.url
                .replace(/(key|token|api_key|access_token)=([a-zA-Z0-9_\-]+)/gi, '$1=***');
        }

        if (msg !== scrubbedMsg) {
            error.message = scrubbedMsg;
        }
        return error;
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
