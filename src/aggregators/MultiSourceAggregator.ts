import { BaseAdapter } from '../adapters/BaseAdapter';

export enum AggregationStrategy {
    MEAN = 'MEAN',
    MEDIAN = 'MEDIAN',
    VWAP = 'VWAP'
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
        if (strategy === AggregationStrategy.MEDIAN) {
            return this.calculateMedian(successes);
        } else if (strategy === AggregationStrategy.MEAN) {
            return this.calculateMean(successes);
        }

        return successes[0]; // Fallback
    }

    private calculateMedian(results: any[]): any {
        // Assuming homogeneous data types (e.g. all CryptoData)
        // Extract numeric value if possible, else pick middle object
        // For structure like { price: 100 }, using 'price' key

        if (typeof results[0] === 'number') {
            const sorted = [...results].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        if (results[0].price !== undefined) {
            const sorted = [...results].sort((a, b) => a.price - b.price);
            return sorted[Math.floor(sorted.length / 2)];
        }

        // Default: Return first for non-numeric/complex types
        return results[0];
    }

    private calculateMean(results: any[]): any {
        if (results.length === 0) return null;

        if (results[0].price !== undefined) {
            const sum = results.reduce((acc, curr) => acc + curr.price, 0);
            const mean = sum / results.length;
            // Return clone of first obj with new price
            return { ...results[0], price: mean, source: 'AGGREGATED' };
        }
        return results[0];
    }
}
