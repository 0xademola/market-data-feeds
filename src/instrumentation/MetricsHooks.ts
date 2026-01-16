/**
 * Observability Hooks for Production Monitoring
 * Integrates with Datadog, Prometheus, CloudWatch, etc.
 */

export interface MetricsHooks {
    /**
     * Called when an adapter starts a request
     */
    onRequest?: (adapter: string, method: string, params?: any) => void;

    /**
     * Called when a request succeeds
     */
    onSuccess?: (adapter: string, duration: number, cached: boolean) => void;

    /**
     * Called when a request fails
     */
    onError?: (adapter: string, error: Error, duration: number) => void;

    /**
     * Called on cache hit
     */
    onCacheHit?: (adapter: string, key: string) => void;

    /**
     * Called on cache miss
     */
    onCacheMiss?: (adapter: string, key: string) => void;

    /**
     * Called when circuit breaker state changes
     */
    onCircuitStateChange?: (adapter: string, oldState: string, newState: string) => void;

    /**
     * Called when rate limit is hit
     */
    onRateLimitHit?: (adapter: string, waitTime: number) => void;
}

/**
 * Simple metrics aggregator
 */
export class MetricsAggregator {
    private metrics = {
        requests: new Map<string, number>(),
        successes: new Map<string, number>(),
        errors: new Map<string, number>(),
        cacheHits: new Map<string, number>(),
        cacheMisses: new Map<string, number>(),
        latencies: new Map<string, number[]>()
    };

    record(adapter: string, type: 'request' | 'success' | 'error' | 'cacheHit' | 'cacheMiss', value?: number): void {
        const key = (type + 's') as keyof typeof this.metrics;
        const map = this.metrics[key] as Map<string, number>;

        if (map instanceof Map) {
            map.set(adapter, (map.get(adapter) || 0) + 1);
        }

        if (type === 'success' && value !== undefined) {
            const latencies = this.metrics.latencies.get(adapter) || [];
            latencies.push(value);
            this.metrics.latencies.set(adapter, latencies);
        }
    }

    getStats(adapter?: string): any {
        if (adapter) {
            const latencies = this.metrics.latencies.get(adapter) || [];
            const sorted = latencies.sort((a, b) => a - b);

            return {
                requests: this.metrics.requests.get(adapter) || 0,
                successes: this.metrics.successes.get(adapter) || 0,
                errors: this.metrics.errors.get(adapter) || 0,
                cacheHits: this.metrics.cacheHits.get(adapter) || 0,
                cacheMisses: this.metrics.cacheMisses.get(adapter) || 0,
                errorRate: this.calculateErrorRate(adapter),
                cacheHitRate: this.calculateCacheHitRate(adapter),
                latency: {
                    p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
                    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
                    p99: sorted[Math.floor(sorted.length * 0.99)] || 0
                }
            };
        }

        // All adapters summary
        const adapters = Array.from(new Set([
            ...this.metrics.requests.keys(),
            ...this.metrics.successes.keys(),
            ...this.metrics.errors.keys()
        ]));

        return adapters.map(a => ({ adapter: a, ...this.getStats(a) }));
    }

    private calculateErrorRate(adapter: string): number {
        const total = this.metrics.requests.get(adapter) || 0;
        const errors = this.metrics.errors.get(adapter) || 0;
        return total > 0 ? (errors / total) * 100 : 0;
    }

    private calculateCacheHitRate(adapter: string): number {
        const hits = this.metrics.cacheHits.get(adapter) || 0;
        const misses = this.metrics.cacheMisses.get(adapter) || 0;
        const total = hits + misses;
        return total > 0 ? (hits / total) * 100 : 0;
    }

    reset() {
        this.metrics.requests.clear();
        this.metrics.successes.clear();
        this.metrics.errors.clear();
        this.metrics.cacheHits.clear();
        this.metrics.cacheMisses.clear();
        this.metrics.latencies.clear();
    }
}

/**
 * Example: Datadog integration
 */
export function createDatadogHooks(statsdClient: any): MetricsHooks {
    return {
        onRequest: (adapter, method) => {
            statsdClient.increment('feeds.request', { adapter, method });
        },
        onSuccess: (adapter, duration) => {
            statsdClient.increment('feeds.success', { adapter });
            statsdClient.timing('feeds.latency', duration, { adapter });
        },
        onError: (adapter, error) => {
            statsdClient.increment('feeds.error', { adapter, error: error.name });
        },
        onCacheHit: (adapter) => {
            statsdClient.increment('feeds.cache.hit', { adapter });
        },
        onCacheMiss: (adapter) => {
            statsdClient.increment('feeds.cache.miss', { adapter });
        }
    };
}
