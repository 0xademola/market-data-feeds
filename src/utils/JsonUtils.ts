/**
 * Recursively sorts object keys to ensure deterministic serialization.
 * Critical for cryptographic operations (Hashing, Signing).
 */
export function deepSort(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepSort);
    }
    return Object.keys(obj).sort().reduce((sorted: any, key: string) => {
        sorted[key] = deepSort(obj[key]);
        return sorted;
    }, {});
}
