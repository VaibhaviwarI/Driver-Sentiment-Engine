class SimpleTTLCache {
    constructor(ttlSeconds = 60) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }

    set(key, value) { //this will store data in cache
        // Eviction policy: Remove oldest if cache is too large to prevent memory leaks
        if (this.cache.size >= 1000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl
        });
    }

    get(key) { //this will get data from cache
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null; // Expired
        }
        return item.value;
    }

    invalidate(key) { //  this will remove data from cache
        this.cache.delete(key);
    }

    clear() { //this will clear the cache   
        this.cache.clear();
    }
}

module.exports = new SimpleTTLCache(30); // 30 seconds default TTL
