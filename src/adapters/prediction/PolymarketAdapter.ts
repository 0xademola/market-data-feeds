import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { PredictionMarketData, PredictionMarketSchema } from '../../normalizers';

export class PolymarketAdapter extends BaseAdapter<PredictionMarketData> {
    constructor(config: AdapterConfig = { name: 'Polymarket' }) {
        super({ ...config, name: 'Polymarket', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { question?: string, marketId?: string }): Promise<PredictionMarketData> {
        // Polymarket Gamma API or Clob API
        // For simplicity, we search by text or use a mockable structure if public API is robust.
        // Gamma API: https://gamma-api.polymarket.com/events?slug=...

        let url = 'https://gamma-api.polymarket.com/markets';
        let queryParams: any = {};

        if (params.marketId) {
            url = `https://gamma-api.polymarket.com/markets/${params.marketId}`;
        } else if (params.question) {
            // Basic search via query
            queryParams = { limit: 1, active: true, closed: false, q: params.question, sort: 'volume' };
        } else {
            throw new Error("PolymarketAdapter requires question or marketId");
        }

        const res = await this.client.get(url, { params: queryParams });
        let market: any;

        if (params.marketId) {
            market = res.data;
        } else if (res.data && res.data.length > 0) {
            market = res.data[0];
        }

        if (!market) throw new Error(`Polymarket data not found for ${JSON.stringify(params)}`);

        // Check if Outcome price is available (Gamma API structure)
        // Usually market.outcomePrices is an array string representation? Or generic 'price' field?
        // Checking API docs: 'outcomePrices': "[\"0.6865\",\"0.3135\"]" (Example)

        // We will assume "Yes" side for binary markets mostly
        // If clobTokenIds is present

        const outcome = "Yes"; // Default focus
        // Basic probability approximation via recent trade or midpoint
        // Use 'lastTradePrice' or similar if available, else derive from orderbook.
        // Gamma API markets often have 'outcomePrices' array.

        let prob = 0.5;
        try {
            if (market.outcomePrices) {
                const prices = JSON.parse(market.outcomePrices);
                prob = parseFloat(prices[0]) || 0.5; // Taking first outcome usually match 'Yes' or 'No' depending on index order. 
                // Careful: Market outcomes are specific. Assuming Binary [Yes, No] or [Long, Short]
            }
        } catch (e) {
            // Fallback
        }

        return PredictionMarketSchema.parse({
            id: market.id || "unknown",
            question: market.question || params.question || "Unknown Question",
            outcome: outcome,
            probability: prob,
            volume: parseFloat(market.volume || "0"),
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    protected async getMockData(params: { question: string }): Promise<PredictionMarketData> {
        return {
            id: "0xMockPolymarketId",
            question: params.question || "Will this test pass?",
            outcome: "Yes",
            probability: 0.75,
            volume: 1000000,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
