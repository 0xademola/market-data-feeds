import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { MarketOdds, MarketOddsSchema } from '../../normalizers/MarketOdds';

/**
 * Manifold Markets Adapter - Real-time prediction market odds
 * 
 * Manifold is a play-money prediction market platform.
 * API Docs: https://docs.manifold.markets/api
 */
export class ManifoldAdapter extends BaseAdapter<MarketOdds> {
    constructor(config: AdapterConfig = { name: 'Manifold' }) {
        super({ ...config, name: 'Manifold', rateLimitRequestPerMinute: 100 });
    }

    protected async fetchData(params: { marketId: string }): Promise<MarketOdds> {
        // Manifold API v0
        const url = `https://api.manifold.markets/v0/market/${params.marketId}`;

        const res = await this.client.get(url);
        const market = res.data;

        // Manifold returns probability as 0-1
        const yesPrice = market.probability || 0.5;

        return MarketOddsSchema.parse({
            marketId: market.id,
            platform: 'MANIFOLD',
            question: market.question,
            yesPrice: yesPrice * 100,  // Convert to 0-100
            noPrice: (1 - yesPrice) * 100,
            volume24h: market.volume24Hours,
            lastUpdated: Math.floor(Date.now() / 1000),
            url: market.url
        });
    }

    protected async getMockData(params: { marketId: string }): Promise<MarketOdds> {
        return {
            marketId: params.marketId,
            platform: 'MANIFOLD',
            question: 'Will event Z happen?',
            yesPrice: 48.5,  // 48.5%
            noPrice: 51.5,
            volume24h: 15000,
            lastUpdated: Math.floor(Date.now() / 1000),
            url: `https://manifold.markets/${params.marketId}`
        };
    }
}
