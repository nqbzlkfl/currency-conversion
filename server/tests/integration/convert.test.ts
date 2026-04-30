import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { applyTestEnv, clearAllCaches } from '../helpers/testEnv';
import { defaultFetchHandler, makeFetchMock } from '../helpers/mockOxr';
import { createApp } from '@/app';

describe('GET /api/convert', () => {
  beforeEach(() => {
    applyTestEnv();
    clearAllCaches();
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(defaultFetchHandler));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: USD to SGD with amount 1000', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: 'SGD', amount: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.from).toBe('USD');
    expect(res.body.to).toBe('SGD');
    expect(res.body.amount).toBe(1000);
    expect(res.body.result).toBeCloseTo(1360, 6);
    expect(res.body.rate).toBeCloseTo(1.36, 6);
    expect(typeof res.body.timestamp).toBe('number');
  });

  it('normalises lowercase currency codes', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'usd', to: 'sgd', amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.from).toBe('USD');
    expect(res.body.to).toBe('SGD');
  });

  it('returns 0 for amount=0', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: 'SGD', amount: 0 });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe(0);
  });

  it('400 MISSING_PARAM when from is missing', async () => {
    const app = createApp();
    const res = await request(app).get('/api/convert').query({ to: 'SGD', amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARAM');
    expect(res.body.message).toMatch(/from/);
  });

  it('400 MISSING_PARAM when amount is missing', async () => {
    const app = createApp();
    const res = await request(app).get('/api/convert').query({ from: 'USD', to: 'SGD' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MISSING_PARAM');
    expect(res.body.message).toMatch(/amount/);
  });

  it('400 INVALID_CURRENCY when from is not 3 letters', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'US', to: 'SGD', amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURRENCY');
  });

  it('400 INVALID_CURRENCY when to has non-letter chars', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: '1234', amount: 100 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURRENCY');
  });

  it('400 INVALID_AMOUNT when amount is not numeric', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: 'SGD', amount: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_AMOUNT');
    expect(res.body.message).toMatch(/finite/);
  });

  it('400 INVALID_AMOUNT when amount is negative', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: 'SGD', amount: -50 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_AMOUNT');
    expect(res.body.message).toMatch(/non-negative/);
  });

  it('404 UNKNOWN_CURRENCY for valid format but unsupported code', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/convert')
      .query({ from: 'USD', to: 'ZZZ', amount: 100 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('UNKNOWN_CURRENCY');
  });

  it('caches rates: only one upstream fetch for two sequential requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(makeFetchMock(defaultFetchHandler));
    const app = createApp();
    await request(app).get('/api/convert').query({ from: 'USD', to: 'SGD', amount: 100 });
    await request(app).get('/api/convert').query({ from: 'USD', to: 'EUR', amount: 200 });
    // /latest.json fetched once, second request hits cache
    const ratesCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('/latest.json'),
    );
    expect(ratesCalls).toHaveLength(1);
  });

  it('single-flight: 5 concurrent requests trigger only one upstream fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(makeFetchMock(defaultFetchHandler));
    const app = createApp();
    const requests = Array.from({ length: 5 }, () =>
      request(app).get('/api/convert').query({ from: 'USD', to: 'SGD', amount: 100 }),
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    const ratesCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('/latest.json'),
    );
    expect(ratesCalls).toHaveLength(1);
  });
});
