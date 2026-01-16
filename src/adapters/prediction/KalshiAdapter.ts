import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { MarketOdds, MarketOddsSchema } from '../../normalizers/MarketOdds';

/**
 * Kalshi Adapter - Real-time prediction market odds
 * 
 * Kalshi is a CFTC-regulated prediction market platform.
 * API Docs: https://docs.kalshi.com/
 * 
 * NOTE: Kalshi uses cents (0-100) instead of probabilities (0-1)
 */
export class KalshiAdapter extends BaseAdapter<MarketOdds> {
    constructor(config: AdapterConfig = { name: 'Kalshi' }) {
        super({ ...config, name: 'Kalshi', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { marketId: string }): Promise<MarketOdds> {
        // Kalshi API v2 endpoint
        const url = `https://api.kalshi.com/trade-api/v2/markets/${params.marketId}`;

        const res = await this.client.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const market = res.data.market;

        // Kalshi returns last_price in cents (0-100)
        const yesPrice = market.last_price || market.yes_bid || 50;

        return MarketOddsSchema.parse({
            marketId: market.ticker,
            platform: 'KALSHI',
            question: market.title,
            yesPrice: yesPrice,  // Keep as 0-100 for Kalshi
            noPrice: 100 - yesPrice,
            volume24h: market.volume_24h,
            lastUpdated: Math.floor(Date.now() / 1000),
            url: `https://kalshi.com/markets/${market.ticker}`
        });
    }

    protected async getMockData(params: { marketId: string }): Promise<MarketOdds> {
        return {
            marketId: params.marketId,
            platform: 'KALSHI',
            question: 'Will event X happen?',
            yesPrice: 52.5,  // 52.5 cents = 52.5% probability
            noPrice: 47.5,
            volume24h: 125000,
            lastUpdated: Math.floor(Date.now() / 1000),
            url: `https://kalshi.com/markets/${params.marketId}`
        };
    }
}
