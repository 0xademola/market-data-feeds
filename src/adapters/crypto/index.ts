import { BinanceAdapter } from './BinanceAdapter';
import { CoingeckoAdapter } from './CoingeckoAdapter';
import { ChainlinkAdapter } from './ChainlinkAdapter'; // New import
import { CryptoData } from '../../normalizers';

export class CryptoFeeds {
    private binance = new BinanceAdapter();
    private coingecko = new CoingeckoAdapter();
    private chainlink: ChainlinkAdapter;

    constructor(rpcUrl?: string) {
        this.chainlink = new ChainlinkAdapter({ name: 'Chainlink', rpcUrl });
    }

    async getPrice(symbol: string, timestamp?: number): Promise<CryptoData> {
        // Strategy: 
        // 1. If timestamp provided, we need historical (CEX usually easier for simple history, Chainlink requires roundId lookup).
        // 2. If LIVE price, prefer On-Chain (Chainlink) for robustness, fallback to CEX.

        if (!timestamp) {
            try {
                // Try On-Chain First for Truth
                return await this.chainlink.getData({ symbol });
            } catch (e: any) {
                console.warn(`Chainlink failed/missing for ${symbol} (${e.message}). Falling back to CEX.`);
            }
        }

        // Fallback or Historical: Try Binance first, then Coingecko
        try {
            return await this.binance.getData({ symbol, timestamp });
        } catch (err: any) {
            console.warn(`Binance failed for ${symbol}: ${err.message}. Failing over to Coingecko...`);
            return await this.coingecko.getData({ symbol, timestamp });
        }
    }

    /**
     * Batch fetch prices (1 API call for N symbols)
     */
    async getPricesBatch(symbols: string[]): Promise<CryptoData[]> {
        const url = `https://api.binance.com/api/v3/ticker/24hr`;
        const response = await (this.binance as any).client.get(url);
        const tickers = response.data;

        return symbols.map(symbol => {
            const ticker = tickers.find((t: any) =>
                t.symbol === `${symbol}USDT` || t.symbol === `${symbol}USD`
            );

            if (!ticker) return null;

            return {
                asset: symbol,
                base: 'USD',
                price: parseFloat(ticker.lastPrice),
                timestamp: Math.floor(Date.now() / 1000),
                source: 'binance-batch',
                volume24h: parseFloat(ticker.volume)
            } as CryptoData;
        }).filter((d): d is CryptoData => d !== null);
    }
}
