import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class WebSocketService extends EventEmitter {
    private ws: WebSocket | null = null;
    private subscriptions = new Set<string>();
    private keepAliveInterval: NodeJS.Timeout | null = null;

    /**
     * Connect to Binance WebSocket Stream
     * @param streams Array of streams (e.g. ['btcusdt@trade', 'ethusdt@trade'])
     */
    connect(streams: string[] = []) {
        if (this.ws) {
            console.warn("WebSocket already connected.");
            return;
        }

        // Binance combined stream url
        const streamNames = streams.join('/');
        const url = `wss://stream.binance.com:9443/stream?streams=${streamNames}`;

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
            console.log('WebSocket Connected');
            this.startKeepAlive();
            this.emit('connected');
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            try {
                const msg = JSON.parse(data.toString());
                // Binance format: { stream: 'btcusdt@trade', data: { ... } }
                if (msg.stream && msg.data) {
                    this.emit('message', msg);
                    this.emit(msg.stream, msg.data);
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        });

        this.ws.on('close', () => {
            console.log('WebSocket Closed. Reconnecting in 5s...');
            this.cleanup();
            setTimeout(() => this.connect(Array.from(this.subscriptions)), 5000);
        });

        this.ws.on('error', (err) => {
            console.error('WebSocket Error', err);
        });

        streams.forEach(s => this.subscriptions.add(s));
    }

    subscribe(stream: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.subscriptions.add(stream);
            // If not connected, connect with new list
            if (!this.ws) this.connect(Array.from(this.subscriptions));
            return;
        }

        // Dynamic subscribe
        const payload = {
            method: "SUBSCRIBE",
            params: [stream],
            id: Date.now()
        };
        this.ws.send(JSON.stringify(payload));
        this.subscriptions.add(stream);
    }

    unsubscribe(stream: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const payload = {
                method: "UNSUBSCRIBE",
                params: [stream],
                id: Date.now()
            };
            this.ws.send(JSON.stringify(payload));
        }
        this.subscriptions.delete(stream);
    }

    private startKeepAlive() {
        this.keepAliveInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }

    private cleanup() {
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.ws = null;
    }
}
