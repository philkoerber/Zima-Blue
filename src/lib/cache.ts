// Simple in-memory cache for NASA API responses
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<unknown>>();

    set<T>(key: string, data: T, ttlMinutes = 60): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
        };
        this.cache.set(key, entry);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export const nasaCache = new MemoryCache();

// Clean up expired entries every 30 minutes
if (typeof window === 'undefined') { // Only run on server
    setInterval(() => {
        nasaCache.cleanup();
    }, 30 * 60 * 1000);
}
