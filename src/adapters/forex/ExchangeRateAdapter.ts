import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { ForexData, ForexDataSchema } from '../../normalizers';

export class ExchangeRateAdapter extends BaseAdapter<ForexData> {
    constructor(config: AdapterConfig = { name: 'ExchangeRateAPI' }) {
        super({ ...config, name: 'ExchangeRateAPI', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { base: string, target: string }): Promise<ForexData> {
        // Free API: https://api.exchangerate-api.com/v4/latest/USD
        const base = params.base.toUpperCase();
        const target = params.target.toUpperCase();

        const url = `https://api.exchangerate-api.com/v4/latest/${base}`;
        const res = await this.client.get(url);

        if (!res.data || !res.data.rates) {
            throw new Error(`ExchangeRateAPI: No rates found for ${base}`);
        }

        const rate = res.data.rates[target];
        if (rate === undefined) {
            throw new Error(`ExchangeRateAPI: Rate not found for pair ${base}/${target}`);
        }

        return ForexDataSchema.parse({
            base,
            target,
            rate: Number(rate),
            timestamp: res.data.time_last_updated || Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { base: string, target: string }): Promise<ForexData> {
        return {
            base: params.base.toUpperCase(),
            target: params.target.toUpperCase(),
            rate: 1.05 + (Math.random() * 0.1),
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
