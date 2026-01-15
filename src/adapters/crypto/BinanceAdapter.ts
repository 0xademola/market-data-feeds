import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { CryptoData, CryptoDataSchema, encodeCryptoData } from '../../normalizers';
import { TickerMapper } from '../../utils/TickerMapper';

export class BinanceAdapter extends BaseAdapter<CryptoData> {
    constructor(config: AdapterConfig = { name: 'Binance' }) {
        super({ ...config, name: 'Binance', rateLimitRequestPerMinute: 1200 });
    }

    protected async fetchData(params: { symbol: string, timestamp?: number }): Promise<CryptoData> {
        const symbol = TickerMapper.normalizeForPlatform(params.symbol, 'binance');

        let price = 0;
        let timestamp = params.timestamp ? params.timestamp * 1000 : Date.now();

        if (params.timestamp) {
            // Historical: Use KLines
            const url = `https://api.binance.com/api/v3/klines`;
            const res = await this.client.get(url, {
                params: {
                    symbol,
                    interval: '1m',
                    startTime: timestamp - 60000, // 1 min buffer
                    endTime: timestamp + 60000,
                    limit: 1
                }
            });
            if (!res.data || res.data.length === 0) throw new Error(`No historical data for ${symbol} at ${timestamp}`);
            price = parseFloat(res.data[0][4]); // Close price
        } else {
            // Live
            const url = `https://api.binance.com/api/v3/ticker/price`;
            const res = await this.client.get(url, { params: { symbol } });
            price = parseFloat(res.data.price);
        }

        const data: CryptoData = {
            asset: TickerMapper.normalize(params.symbol),
            base: 'USD',
            price,
            timestamp: Math.floor(timestamp / 1000),
            source: 'Binance'
        };

        return CryptoDataSchema.parse(data);
    }

    protected async getMockData(params: { symbol: string }): Promise<CryptoData> {
        return {
            asset: params.symbol,
            base: 'USD',
            price: 50000 + Math.random() * 1000,
            timestamp: Math.floor(Date.now() / 1000),
            source: 'Binance_MOCK'
        };
    }
}
