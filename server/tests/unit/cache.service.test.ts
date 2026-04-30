import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TtlCache } from '@/services/cache.service';

describe('TtlCache', () => {
  let cache: TtlCache;

  beforeEach(() => {
    cache = new TtlCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for missing keys', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('stores and retrieves values within TTL', () => {
    cache.set('key', { foo: 'bar' }, 1000);
    expect(cache.get('key')).toEqual({ foo: 'bar' });
  });

  it('returns null after TTL expires', () => {
    cache.set('key', 'value', 1000);
    vi.advanceTimersByTime(999);
    expect(cache.get('key')).toBe('value');
    vi.advanceTimersByTime(2);
    expect(cache.get('key')).toBeNull();
  });

  it('removes expired entries on access', () => {
    cache.set('key', 'value', 1000);
    expect(cache.size()).toBe(1);
    vi.advanceTimersByTime(2000);
    cache.get('key');
    expect(cache.size()).toBe(0);
  });

  it('delete removes a specific key', () => {
    cache.set('a', 1, 1000);
    cache.set('b', 2, 1000);
    cache.delete('a');
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe(2);
  });

  it('clear removes all keys', () => {
    cache.set('a', 1, 1000);
    cache.set('b', 2, 1000);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
