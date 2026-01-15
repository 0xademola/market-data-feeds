import { EventEmitter } from 'events';

export interface PushConfig {
    provider: 'pyth' | 'chainlink' | 'binance_ws';
    endpoint?: string;
}

export class PushService extends EventEmitter {
    constructor(private config: PushConfig) {
        super();
    }

    connect() {
        // WebSocket connection logic generalized
        console.log(`Connecting to ${this.config.provider} Push Feed...`);
    }

    subscribe(topic: string) {
        // e.g. "BTC/USD"
        console.log(`Subscribed to ${topic}`);
    }

    // Emits 'data' events
}
