import { BaseAdapter, AdapterConfig } from '../BaseAdapter';
import { MarketStatus, MarketStatusSchema } from '../../normalizers';

export class MarketHoursAdapter extends BaseAdapter<MarketStatus> {
    constructor(config: AdapterConfig = { name: 'MarketHours' }) {
        super({ ...config, name: 'MarketHours' });
    }

    protected async fetchData(params: { market: string }): Promise<MarketStatus> {
        // Simple Heuristic Adapter (No external API needed for basic hours)
        // Can be upgraded to use Alpaca or similar later
        const market = params.market.toUpperCase();
        const now = new Date();
        const utcHour = now.getUTCHours();
        const utcDay = now.getUTCDay(); // 0=Sun, 6=Sat

        let status: 'OPEN' | 'CLOSED' | 'HALTED' = 'CLOSED';
        let nextOpen: number | undefined;

        if (market === 'NYSE' || market === 'NASDAQ') {
            // US Markets: 9:30 AM - 4:00 PM ET (UTC-5/UTC-4)
            // Simplifying to UTC-5 (Standard Time) for heuristic
            // Open: 14:30 UTC, Close: 21:00 UTC

            const isWeekend = utcDay === 0 || utcDay === 6;
            const isTradingHours = (utcHour >= 14 && utcHour < 21); // Rough approx

            if (!isWeekend && isTradingHours) {
                status = 'OPEN';
            }
        } else if (market === 'CRYPTO') {
            status = 'OPEN'; // 24/7
        } else if (market === 'FOREX') {
            // Closed weekends
            status = (utcDay === 0 || utcDay === 6) ? 'CLOSED' : 'OPEN';
        }

        return MarketStatusSchema.parse({
            market,
            status,
            timestamp: Math.floor(now.getTime() / 1000)
        });
    }

    protected async getMockData(params: { market: string }): Promise<MarketStatus> {
        return {
            market: params.market,
            status: 'OPEN',
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
