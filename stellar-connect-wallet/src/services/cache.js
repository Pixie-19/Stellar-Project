/**
 * Simple in-memory cache service with TTL support
 * Provides caching for blockchain data, account info, and UI state
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.remove(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlMs - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttlMs = 5 * 60 * 1000) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiresAt });

    // Set auto-clear timer
    if (ttlMs) {
      const timer = setTimeout(() => this.remove(key), ttlMs);
      this.timers.set(key, timer);
    }
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if valid cache exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key from cache
   * @param {string} key - Cache key
   */
  remove(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache and timers
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get all keys currently in cache
   * @returns {string[]} Array of cache keys
   */
  keys() {
    const validKeys = [];
    this.cache.forEach((entry, key) => {
      if (!entry.expiresAt || Date.now() <= entry.expiresAt) {
        validKeys.push(key);
      }
    });
    return validKeys;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      keys: this.keys().length,
    };
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Cache key generator utilities for consistent key naming
 */
export const cacheKeys = {
  // Account data
  balance: (address) => `balance:${address}`,
  accountInfo: (address) => `account:${address}`,

  // Campaign data
  campaign: (id) => `campaign:${id}`,
  campaigns: () => 'campaigns:all',
  campaignsList: () => 'campaigns:list',

  // Transaction data
  transaction: (hash) => `tx:${hash}`,
  userTransactions: (address) => `txs:${address}`,

  // Wallet data
  walletConnected: () => 'wallet:connected',
  walletAddress: () => 'wallet:address',
};

export default cache;
