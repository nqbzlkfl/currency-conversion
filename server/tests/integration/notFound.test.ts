import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { applyTestEnv, clearAllCaches } from '../helpers/testEnv';
import { defaultFetchHandler, makeFetchMock } from '../helpers/mockOxr';
import { createApp } from '@/app';

describe('404 fallback', () => {
  beforeEach(() => {
    applyTestEnv();
    clearAllCaches();
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(defaultFetchHandler));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 404 NOT_FOUND for unknown routes', async () => {
    const app = createApp();
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
