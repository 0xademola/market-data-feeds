import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { PingData, PingDataSchema } from '../../normalizers';

export class PingAdapter extends BaseAdapter<PingData> {
    constructor(config: AdapterConfig = { name: 'PingAdapter' }) {
        super({ ...config, name: 'PingAdapter', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { url: string }): Promise<PingData> {
        let targetUrl = params.url;
        if (!targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        const start = Date.now();
        let status = 0;

        try {
            // Use axios from BaseAdapter client but specifically just for head/get check
            // We use standard fetch here for lower overhead or stick to axios
            const res = await this.client.get(targetUrl, { timeout: 5000, validateStatus: () => true });
            status = res.status;
        } catch (error: any) {
            // Network error
            status = error.response?.status || 0;
        }

        const latency = Date.now() - start;

        return PingDataSchema.parse({
            url: params.url,
            latency,
            status,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { url: string }): Promise<PingData> {
        return {
            url: params.url,
            latency: Math.floor(Math.random() * 200),
            status: 200,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
