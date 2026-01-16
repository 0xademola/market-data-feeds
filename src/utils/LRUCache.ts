/**
 * LRU (Least Recently Used) Cache Implementation
 * Memory-efficient caching with automatic eviction
 */

export interface CacheEntry<T> {
    value: T;
    expiry: number;
    accessCount: number;
    lastAccessed: number;
}

export class LRUCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private maxSize: number;
    private defaultTTL: number;

    constructor(maxSize: number = 1000, defaultTTL: number = 30000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }

    set(key: string, value: T, ttl?: number): void {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            value,
            expiry,
            accessCount: 0,
            lastAccessed: Date.now()
        });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        // Update access metadata
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        return entry.value;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    /**
     * Evict least recently used item
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        utilization: number;
        entries: Array<{ key: string; age: number; accessCount: number }>;
    } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - (entry.expiry - this.defaultTTL),
            accessCount: entry.accessCount
        }));

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: (this.cache.size / this.maxSize) * 100,
            entries: entries.slice(0, 10) // Top 10
        };
    }
}
