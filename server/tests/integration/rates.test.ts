import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { applyTestEnv, clearAllCaches } from '../helpers/testEnv';
import { defaultFetchHandler, makeFetchMock, MOCK_LATEST } from '../helpers/mockOxr';
import { createApp } from '@/app';

describe('GET /api/rates', () => {
  beforeEach(() => {
    applyTestEnv();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns base, timestamp, and rates from cached payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(defaultFetchHandler));
    const app = createApp();
    const res = await request(app).get('/api/rates');

    expect(res.status).toBe(200);
    expect(res.body.base).toBe(MOCK_LATEST.base);
    expect(res.body.timestamp).toBe(MOCK_LATEST.timestamp);
    expect(res.body.rates).toEqual(MOCK_LATEST.rates);
  });
});
