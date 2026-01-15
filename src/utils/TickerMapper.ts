export const SYMBOL_MAP: Record<string, string> = {
    // Bitcoin
    'bitcoin': 'BTC',
    'xbt': 'BTC',
    'btcusd': 'BTC',
    'btc-usd': 'BTC',

    // Ethereum
    'ethereum': 'ETH',
    'ethusd': 'ETH',
    'eth-usd': 'ETH',

    // Solana
    'solana': 'SOL',
    'solusd': 'SOL',
};

export class TickerMapper {
    /**
     * Normalizes an input symbol to a standard ticker (e.g. 'bitcoin' -> 'BTC')
     * Returns the input uppercase if no map found.
     */
    static normalize(symbol: string): string {
        const lower = symbol.toLowerCase();
        return SYMBOL_MAP[lower] || symbol.toUpperCase();
    }

    /**
     * Returns the specific ID required by a platform given a standard ticker.
     * e.g. normalizeForPlatform('BTC', 'coingecko') -> 'bitcoin'
     */
    static normalizeForPlatform(ticker: string, platform: 'coingecko' | 'binance' | 'pyth'): string {
        const standard = this.normalize(ticker);

        const platformMaps: Record<string, Record<string, string>> = {
            'coingecko': {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'SOL': 'solana',
                'MATIC': 'matic-network'
            },
            'binance': {
                'BTC': 'BTCUSDT',
                'ETH': 'ETHUSDT',
                'SOL': 'SOLUSDT'
            },
            // Add Pyth IDs here
            'pyth': {
                'BTC': 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
            }
        };

        return platformMaps[platform]?.[standard] || standard;
    }
}
