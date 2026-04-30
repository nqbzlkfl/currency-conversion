import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { applyTestEnv, clearAllCaches } from '../helpers/testEnv';
import { defaultFetchHandler, makeFetchMock } from '../helpers/mockOxr';
import { createApp } from '@/app';

describe('GET /api/health', () => {
  beforeEach(() => {
    applyTestEnv();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with status and uptime', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(defaultFetchHandler));
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});
