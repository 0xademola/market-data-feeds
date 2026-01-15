import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface PushConfig {
    provider: 'pyth' | 'chainlink' | 'binance_ws' | 'custom';
    endpoint: string;
}

export class PushService extends EventEmitter {
    private ws?: WebSocket;
    private subscriptions: Set<string> = new Set();

    private pingInterval?: NodeJS.Timeout;

    constructor(private config: PushConfig) {
        super();
    }

    connect() {
        console.log(`[Push] Connecting to ${this.config.provider} at ${this.config.endpoint}...`);
        this.ws = new WebSocket(this.config.endpoint);

        this.ws.on('open', () => {
            console.log('[Push] Connected');
            this.emit('connected');
            // Resubscribe if reconnecting
            this.subscriptions.forEach(t => this.subscribe(t));

            // v1.3.1: Heartbeat (every 30s)
            this.startHeartbeat();
        });

        this.ws.on('message', (data: any) => {
            // Simple pass-through for v1.3
            this.emit('data', data.toString());
        });

        this.ws.on('error', (err) => {
            console.error('[Push] Error:', err);
            this.stopHeartbeat();
        });

        this.ws.on('close', () => {
            console.log('[Push] Disconnected');
            this.stopHeartbeat();
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.ping(); // Standard WS ping
            }
        }, 30000);
    }

    private stopHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
    }

    subscribe(topic: string) {
        this.subscriptions.add(topic);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: [topic], id: 1 }));
            console.log(`[Push] Subscribed to ${topic}`);
        }
    }
}
