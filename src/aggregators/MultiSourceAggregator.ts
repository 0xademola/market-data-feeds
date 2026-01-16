import { BaseAdapter } from '../adapters/BaseAdapter';

export enum AggregationStrategy {
    MEAN = 'MEAN',
    MEDIAN = 'MEDIAN',
    VWAP = 'VWAP',
    CONSENSUS = 'CONSENSUS'
}

export class MultiSourceAggregator {
    private adapters: BaseAdapter<any>[] = [];

    constructor(adapters: BaseAdapter<any>[]) {
        this.adapters = adapters;
    }

    async aggregate(params: any, strategy: AggregationStrategy = AggregationStrategy.MEDIAN) {
        // Parallel Fetch
        const results = await Promise.allSettled(
            this.adapters.map(a => a.getData(params))
        );

        const successes = results
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<any>).value);

        if (successes.length === 0) throw new Error("All sources failed");

        // Strategy Logic
        switch (strategy) {
            case AggregationStrategy.MEDIAN:
                return this.calculateMedian(successes);
            case AggregationStrategy.MEAN:
                return this.calculateMean(successes);
            case AggregationStrategy.CONSENSUS:
                return this.calculateConsensus(successes);
            default:
                return successes[0];
        }
    }

    private calculateMedian(results: any[]): any {
        if (typeof results[0] === 'number') {
            const sorted = [...results].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        if (results[0].price !== undefined) {
            const sorted = [...results].sort((a, b) => a.price - b.price);
            return sorted[Math.floor(sorted.length / 2)];
        }

        // Default: Return first for complex types if Median requested
        return results[0];
    }

    private calculateMean(results: any[]): any {
        if (results.length === 0) return null;

        // Numeric Array
        if (typeof results[0] === 'number') {
            const filtered = this.filterOutliers(results as number[]);
            const sum = filtered.reduce((a, b) => a + b, 0);
            return sum / filtered.length;
        }

        // Object with price
        if (results[0].price !== undefined) {
            const prices = results.map(r => r.price);
            const filteredPrices = this.filterOutliers(prices);
            // If we filtered data, we calculate the new mean price
            const sum = filteredPrices.reduce((a, b) => a + b, 0);
            const mean = sum / filteredPrices.length;
            return { ...results[0], price: mean, source: 'AGGREGATED_SMART_MEAN' };
        }
        return results[0];
    }

    private calculateConsensus(results: any[]): any {
        if (results.length === 0) return null;
        if (results.length === 1) return results[0];

        const counts = new Map<string, number>();
        const objMap = new Map<string, any>();

        for (const res of results) {
            // Normalize: ignore minor timestamp diffs 
            // We strip 'timestamp' or 'startTime' if they differ slightly? 
            // For now, strict stable stringify
            const key = this.stableStringify(res);
            counts.set(key, (counts.get(key) || 0) + 1);
            objMap.set(key, res);
        }

        let maxCount = 0;
        let bestKey = '';

        for (const [key, count] of counts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                bestKey = key;
            }
        }

        // If even the best match has no majority (e.g. 1, 1, 1), fallback to first? 
        // Or strictly strictly 2+? Let's assume plurallity wins.
        return objMap.get(bestKey);
    }

    private filterOutliers(values: number[]): number[] {
        if (values.length < 3) return values; // Not enough data to determine outliers

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);

        // 2 Sigma Rule (95%)
        return values.filter(x => Math.abs(x - mean) <= 2 * stdDev);
    }

    private stableStringify(obj: any): string {
        if (typeof obj !== 'object' || obj === null) return String(obj);
        if (Array.isArray(obj)) return '[' + obj.map(x => this.stableStringify(x)).join(',') + ']';
        // Exclude specific volatile fields effectively? 
        // For SportsMatch, 'startTime' might drift slightly between providers.
        // For now, sorting keys is a good baseline.
        return '{' + Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${this.stableStringify(obj[k])}`).join(',') + '}';
    }
}
