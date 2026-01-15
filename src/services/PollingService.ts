import { EventEmitter } from 'events';

export interface PollingConfig {
    interval: number; // ms
    retries?: number;
}

export class PollingService extends EventEmitter {
    private timers: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Start polling a specific async function.
     * Emits 'data' on success and 'error' on failure.
     */
    start(id: string, fetchFn: () => Promise<any>, config: PollingConfig) {
        if (this.timers.has(id)) {
            console.warn(`Polling for ${id} already active.`);
            return;
        }

        const run = async () => {
            try {
                const data = await fetchFn();
                this.emit('data', { id, data, timestamp: Date.now() });
            } catch (err) {
                this.emit('error', { id, error: err });
            }
        };

        // Initial run
        run();

        // Interval
        const timer = setInterval(run, config.interval);
        this.timers.set(id, timer);
    }

    /**
     * Stop a specific polling task.
     */
    stop(id: string) {
        const timer = this.timers.get(id);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(id);
        }
    }

    /**
     * Stop all polling.
     */
    stopAll() {
        for (const id of this.timers.keys()) {
            this.stop(id);
        }
    }
}
