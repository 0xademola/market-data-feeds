/**
 * Custom Error class with rich context for debugging and retry logic
 */
export class FeedError extends Error {
    constructor(
        message: string,
        public readonly context: {
            source: string;
            statusCode?: number;
            retryAfter?: number; // seconds until retry allowed
            quota?: { used: number; limit: number };
            isRetryable: boolean;
            originalError?: any;
        }
    ) {
        super(message);
        this.name = 'FeedError';
        Error.captureStackTrace(this, FeedError);
    }
}

/**
 * Circuit Breaker States
 */
enum CircuitState {
    CLOSED = 'CLOSED',     // Normal operation
    OPEN = 'OPEN',         // Failures exceeded threshold, blocking calls
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping calls to failing services
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private lastStateChange: number = Date.now();

    constructor(
        private readonly threshold: number = 5,        // failures before opening
        private readonly timeout: number = 60000,      // cooldown period (1 min)
        private readonly halfOpenAttempts: number = 3  // successes needed to close
    ) { }

    /**
     * Execute function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>, adapterName: string): Promise<T> {
        // Check if circuit is OPEN
        if (this.state === CircuitState.OPEN) {
            const timeSinceFailure = Date.now() - this.lastFailureTime;

            if (timeSinceFailure > this.timeout) {
                console.log(`[CircuitBreaker:${adapterName}] OPEN → HALF_OPEN (testing recovery)`);
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
            } else {
                const waitTime = Math.ceil((this.timeout - timeSinceFailure) / 1000);
                throw new FeedError(
                    `Circuit breaker OPEN for ${adapterName}. Service unavailable.`,
                    {
                        source: adapterName,
                        retryAfter: waitTime,
                        isRetryable: true,
                        statusCode: 503
                    }
                );
            }
        }

        try {
            const result = await fn();
            this.onSuccess(adapterName);
            return result;
        } catch (error) {
            this.onFailure(adapterName);
            throw error;
        }
    }

    private onSuccess(adapterName: string): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.halfOpenAttempts) {
                console.log(`[CircuitBreaker:${adapterName}] HALF_OPEN → CLOSED (recovery confirmed)`);
                this.state = CircuitState.CLOSED;
                this.lastStateChange = Date.now();
            }
        }
    }

    private onFailure(adapterName: string): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            console.log(`[CircuitBreaker:${adapterName}] HALF_OPEN → OPEN (recovery failed)`);
            this.state = CircuitState.OPEN;
            this.failureCount = 0;
            this.lastStateChange = Date.now();
        } else if (this.failureCount >= this.threshold) {
            console.log(`[CircuitBreaker:${adapterName}] CLOSED → OPEN (${this.failureCount} failures)`);
            this.state = CircuitState.OPEN;
            this.lastStateChange = Date.now();
        }
    }

    getState(): { state: CircuitState; failures: number; since: number } {
        return {
            state: this.state,
            failures: this.failureCount,
            since: this.lastStateChange
        };
    }
}
