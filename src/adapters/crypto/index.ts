import { BinanceAdapter } from './BinanceAdapter';
import { CoingeckoAdapter } from './CoingeckoAdapter';
import { CryptoData } from '../../normalizers';

export class CryptoFeeds {
    private binance = new BinanceAdapter();
    private coingecko = new CoingeckoAdapter();

    async getPrice(symbol: string, timestamp?: number): Promise<CryptoData> {
        // Fallover Logic: Try Binance first, then Coingecko
        try {
            return await this.binance.getData({ symbol, timestamp });
        } catch (err: any) {
            console.warn(`Binance failed for ${symbol}: ${err.message}. Failing over to Coingecko...`);
            return await this.coingecko.getData({ symbol, timestamp });
        }
    }
}
