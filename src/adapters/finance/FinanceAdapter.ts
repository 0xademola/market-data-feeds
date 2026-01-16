import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { FinanceData, FinanceDataSchema } from '../../normalizers';

export class FinanceAdapter extends BaseAdapter<FinanceData> {
    constructor(config: AdapterConfig = { name: 'Finance' }) {
        super({ ...config, name: 'Finance', rateLimitRequestPerMinute: 60 });
    }

    protected async fetchData(params: { symbol: string }): Promise<FinanceData> {
        if (!this.config.apiKey) throw new Error("Finance API Key required (AlphaVantage/Yahoo)");

        // AlphaVantage Example
        const url = `https://www.alphavantage.co/query`;
        const res = await this.client.get(url, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: params.symbol,
                apikey: this.config.apiKey
            }
        });

        const quote = res.data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
            throw new Error(`FinanceAdapter: Symbol ${params.symbol} not found`);
        }

        return FinanceDataSchema.parse({
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            timestamp: Math.floor(Date.now() / 1000) // AlphaVantage doesn't give precise quote time easily in this endpoint
        });
    }

    protected async getMockData(params: { symbol: string }): Promise<FinanceData> {
        const mockPrices: Record<string, number> = {
            'AAPL': 150.00,
            'GOOGL': 2800.00,
            'TSLA': 700.00,
            'XAU': 1900.00, // Gold
            'OIL': 80.00
        };

        const price = mockPrices[params.symbol] || 100.00;

        return {
            symbol: params.symbol,
            price: price,
            changePercent: 0.5,
            volume: 1000000,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
