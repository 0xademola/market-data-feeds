export * from './OracleSigner';
export * from './schemas';
export class Validator {
    /**
     * Checks if the number of successful sources meets the minimum quorum.
     */
    static checkQuorum(sourcesCount: number, minSources: number): boolean {
        return sourcesCount >= minSources;
    }

    /**
     * Checks if data is too old.
     * @param timestampMs Data timestamp in milliseconds
     * @param maxAgeMs Maximum allowed age in milliseconds
     */
    static isStale(timestampMs: number, maxAgeMs: number = 300000): boolean { // Default 5 mins
        const now = Date.now();
        return (now - timestampMs) > maxAgeMs;
    }

    /**
     * Filters out outliers using Interquartile Range (IQR) or Standard Deviation.
     * Simple implementation: Filter values > 2 std devs from mean.
     */
    static filterOutliers(values: number[]): number[] {
        if (values.length < 3) return values;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length);

        // Allow 2 sigma
        return values.filter(v => Math.abs(v - mean) <= 2 * stdDev);
    }
}
