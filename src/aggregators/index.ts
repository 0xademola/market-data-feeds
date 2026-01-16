import { BigNumber } from 'bignumber.js';

export class Aggregator {
    static mean(values: number[]): number {
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }

    static median(values: number[]): number {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    static weightedMean(items: { value: number; weight: number }[]): number {
        if (items.length === 0) return 0;
        let totalWeight = 0;
        let sum = 0;

        for (const item of items) {
            sum += item.value * item.weight;
            totalWeight += item.weight;
        }

        return totalWeight === 0 ? 0 : sum / totalWeight;
    }

    /**
     * Returns a confidence score (0-1) based on the agreement of sources.
     * Higher score = lower standard deviation relative to mean.
     */
    static confidence(values: number[]): number {
        if (values.length <= 1) return 1; // 1 source = absolute trust (naivety) or 0? Usually 1 for single source unless verified.

        const mean = this.mean(values);
        if (mean === 0) return 0;

        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);
        const cv = stdDev / Math.abs(mean); // Coefficient of Variation

        // Heuristic: CV of 0.0 = 1.0 confidence. CV of 0.1 (10% spread) = ~0.9 confidence.
        // Formula: 1 / (1 + CV * 10)
        return 1 / (1 + (cv * 10));
    }
}

export * from './MultiSourceAggregator';
