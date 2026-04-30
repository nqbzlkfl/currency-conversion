import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { applyTestEnv, clearAllCaches } from '../helpers/testEnv';
import { defaultFetchHandler, makeFetchMock, MOCK_LATEST } from '../helpers/mockOxr';
import { createApp } from '@/app';

describe('GET /api/currencies', () => {
  beforeEach(() => {
    applyTestEnv();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns intersection of currencies.json and latest.json sorted by code', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(defaultFetchHandler));
    const app = createApp();
    const res = await request(app).get('/api/currencies');

    expect(res.status).toBe(200);
    const codes = res.body.currencies.map((c: { code: string }) => c.code);
    // ANG has a name but no rate — must be excluded
    expect(codes).not.toContain('ANG');
    // All returned codes must exist in both maps
    for (const code of codes) {
      expect(MOCK_LATEST.rates).toHaveProperty(code);
    }
    // Sorted alphabetically
    expect(codes).toEqual([...codes].sort());
  });

  it('returns 502 UPSTREAM_FAILURE when OXR is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('network error');
    });
    const app = createApp();
    const res = await request(app).get('/api/currencies');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe('UPSTREAM_FAILURE');
  });

  it('returns 502 UPSTREAM_RATE_LIMIT when OXR returns 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      makeFetchMock(() => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        body: { error: true },
      })),
    );
    const app = createApp();
    const res = await request(app).get('/api/currencies');
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('UPSTREAM_RATE_LIMIT');
  });
});
