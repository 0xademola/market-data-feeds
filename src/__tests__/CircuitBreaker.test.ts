import { CircuitBreaker, CircuitState } from '../utils/CircuitBreaker';

describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
        breaker = new CircuitBreaker(3, 1000, 2); // 3 failures, 1s timeout, 2 successes
    });

    describe('CLOSED state (normal operation)', () => {
        it('should allow requests to pass through', async () => {
            const fn = jest.fn().mockResolvedValue('success');
            const result = await breaker.execute(fn, 'TestAdapter');

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should track successful calls', async () => {
            const fn = jest.fn().mockResolvedValue('success');
            await breaker.execute(fn, 'TestAdapter');

            const state = breaker.getState();
            expect(state.state).toBe(CircuitState.CLOSED);
            expect(state.failures).toBe(0);
        });
    });

    describe('Circuit opening (failure threshold)', () => {
        it('should open after threshold failures', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('API down'));

            // Trigger 3 failures
            for (let i = 0; i < 3; i++) {
                try {
                    await breaker.execute(fn, 'TestAdapter');
                } catch (e) {
                    // Expected
                }
            }

            const state = breaker.getState();
            expect(state.state).toBe(CircuitState.OPEN);
        });

        it('should block requests when OPEN', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('API down'));

            // Open the circuit
            for (let i = 0; i < 3; i++) {
                try { await breaker.execute(fn, 'TestAdapter'); } catch (e) { }
            }

            // Next request should be blocked
            await expect(breaker.execute(fn, 'TestAdapter')).rejects.toThrow('Circuit breaker OPEN');
            expect(fn).toHaveBeenCalledTimes(3); // Not called again
        });
    });

    describe('HALF_OPEN state (recovery testing)', () => {
        it('should transition to HALF_OPEN after timeout', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('API down'));

            // Open circuit
            for (let i = 0; i < 3; i++) {
                try { await breaker.execute(fn, 'TestAdapter'); } catch (e) { }
            }

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Next call should attempt (HALF_OPEN)
            const successFn = jest.fn().mockResolvedValue('recovered');
            await breaker.execute(successFn, 'TestAdapter');

            expect(successFn).toHaveBeenCalled();
        });

        it('should close after successful recovery', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('API down'));

            // Open circuit
            for (let i = 0; i < 3; i++) {
                try { await breaker.execute(fn, 'TestAdapter'); } catch (e) { }
            }

            await new Promise(resolve => setTimeout(resolve, 1100));

            // Two successful calls (threshold = 2)
            const successFn = jest.fn().mockResolvedValue('ok');
            await breaker.execute(successFn, 'TestAdapter');
            await breaker.execute(successFn, 'TestAdapter');

            const state = breaker.getState();
            expect(state.state).toBe(CircuitState.CLOSED);
        });

        it('should reopen if recovery fails', async () => {
            const failFn = jest.fn().mockRejectedValue(new Error('Still down'));

            // Open circuit
            for (let i = 0; i < 3; i++) {
                try { await breaker.execute(failFn, 'TestAdapter'); } catch (e) { }
            }

            await new Promise(resolve => setTimeout(resolve, 1100));

            // Fail during HALF_OPEN
            try {
                await breaker.execute(failFn, 'TestAdapter');
            } catch (e) { }

            const state = breaker.getState();
            expect(state.state).toBe(CircuitState.OPEN);
        });
    });

    describe('State reporting', () => {
        it('should report current state', () => {
            const state = breaker.getState();

            expect(state).toHaveProperty('state');
            expect(state).toHaveProperty('failures');
            expect(state).toHaveProperty('since');
        });
    });
});
