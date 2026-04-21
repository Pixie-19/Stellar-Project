import { cache, cacheKeys } from '../services/cache';

describe('Cache Service', () => {
  beforeEach(() => {
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should remove a key', () => {
      cache.set('key1', 'value1');
      cache.remove('key1');
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time-to-Live)', () => {
    jest.useFakeTimers();

    it('should expire values after TTL', () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(1100);
      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL if not specified', () => {
      cache.set('key1', 'value1');
      jest.advanceTimersByTime(4 * 60 * 1000); // 4 minutes
      expect(cache.get('key1')).toBe('value1');

      jest.advanceTimersByTime(2 * 60 * 1000); // 2 more minutes (total 6)
      expect(cache.get('key1')).toBeNull();
    });

    it('should allow infinite TTL when set to null', () => {
      cache.set('key1', 'value1', null);
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('Cache Utilities', () => {
    it('should generate balance cache keys correctly', () => {
      const key = cacheKeys.balance('GADDRESSABC');
      expect(key).toBe('balance:GADDRESSABC');
    });

    it('should generate campaign cache keys correctly', () => {
      expect(cacheKeys.campaign(1)).toBe('campaign:1');
      expect(cacheKeys.campaigns()).toBe('campaigns:all');
    });

    it('should generate transaction cache keys correctly', () => {
      const hash = 'abc123hash';
      expect(cacheKeys.transaction(hash)).toBe(`tx:${hash}`);
    });
  });

  describe('Batch Operations', () => {
    it('should handle multiple keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.keys().length).toBe(3);
      expect(cache.keys()).toContain('key1');
      expect(cache.keys()).toContain('key2');
      expect(cache.keys()).toContain('key3');
    });

    it('should return correct stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toBe(2);
    });
  });

  describe('Value Types', () => {
    it('should cache objects', () => {
      const obj = { id: 1, name: 'Test' };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arr = [1, 2, 3];
      cache.set('arr', arr);
      expect(cache.get('arr')).toEqual(arr);
    });

    it('should cache null values', () => {
      cache.set('null', null);
      expect(cache.has('null')).toBe(false); // null is treated as empty
    });

    it('should cache numbers and strings', () => {
      cache.set('num', 42);
      cache.set('str', 'hello');
      expect(cache.get('num')).toBe(42);
      expect(cache.get('str')).toBe('hello');
    });
  });
});
