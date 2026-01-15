import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { CryptoData, CryptoDataSchema } from '../../normalizers';
import { TickerMapper } from '../../utils/TickerMapper';

export class CoingeckoAdapter extends BaseAdapter<CryptoData> {
    constructor(config: AdapterConfig = { name: 'Coingecko' }) {
        super({ ...config, name: 'Coingecko', rateLimitRequestPerMinute: 30 }); // Public API limit
    }

    protected async fetchData(params: { symbol: string, timestamp?: number }): Promise<CryptoData> {
        const id = TickerMapper.normalizeForPlatform(params.symbol, 'coingecko');

        let price = 0;
        let timestamp = params.timestamp || Math.floor(Date.now() / 1000);

        if (params.timestamp) {
            // Historical: /coins/{id}/history?date=dd-mm-yyyy
            const date = new Date(params.timestamp * 1000);
            const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

            const url = `https://api.coingecko.com/api/v3/coins/${id}/history`;
            const res = await this.client.get(url, { params: { date: dateStr } });

            if (!res.data.market_data?.current_price?.usd) throw new Error("No historical data found");
            price = res.data.market_data.current_price.usd;
        } else {
            // Live
            const url = `https://api.coingecko.com/api/v3/simple/price`;
            const res = await this.client.get(url, {
                params: { ids: id, vs_currencies: 'usd' }
            });
            if (!res.data[id]?.usd) throw new Error("Price not found");
            price = res.data[id].usd;
        }

        const data: CryptoData = {
            asset: TickerMapper.normalize(params.symbol),
            base: 'USD',
            price,
            timestamp,
            source: 'Coingecko'
        };

        return CryptoDataSchema.parse(data);
    }

    protected async getMockData(params: { symbol: string }): Promise<CryptoData> {
        return {
            asset: params.symbol,
            base: 'USD',
            price: 3000 + Math.random() * 100, // ETH-ish
            timestamp: Math.floor(Date.now() / 1000),
            source: 'Coingecko_MOCK'
        };
    }
}
