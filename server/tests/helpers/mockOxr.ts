/**
 * Mock OXR upstream responses. Used by integration tests via
 * vi.spyOn(globalThis, 'fetch').
 */

import type { OxrCurrenciesResponse, OxrLatestResponse } from '@/types/oxr.types';

export const MOCK_LATEST: OxrLatestResponse = {
  disclaimer: 'https://openexchangerates.org/terms/',
  license: 'https://openexchangerates.org/license/',
  timestamp: 1714435200,
  base: 'USD',
  rates: {
    USD: 1.0,
    SGD: 1.36,
    EUR: 0.92,
    GBP: 0.785,
    MYR: 4.725,
    JPY: 152.34,
  },
};

export const MOCK_CURRENCIES: OxrCurrenciesResponse = {
  USD: 'United States Dollar',
  SGD: 'Singapore Dollar',
  EUR: 'Euro',
  GBP: 'British Pound Sterling',
  MYR: 'Malaysian Ringgit',
  JPY: 'Japanese Yen',
  // Has a name but no rate — should be excluded from /api/currencies
  ANG: 'Netherlands Antillean Guilder',
};

type FetchHandler = (url: string) => {
  ok: boolean;
  status: number;
  statusText: string;
  body: unknown;
};

/**
 * Creates a fetch mock that routes by URL substring.
 * Returns the mock function for spy assertions.
 */
export function makeFetchMock(handler: FetchHandler) {
  return async (input: string | URL | Request): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const result = handler(url);
    return {
      ok: result.ok,
      status: result.status,
      statusText: result.statusText,
      json: async () => result.body,
    } as Response;
  };
}

/** Default handler: returns happy-path mock data for both endpoints. */
export const defaultFetchHandler: FetchHandler = (url) => {
  if (url.includes('/latest.json')) {
    return { ok: true, status: 200, statusText: 'OK', body: MOCK_LATEST };
  }
  if (url.includes('/currencies.json')) {
    return { ok: true, status: 200, statusText: 'OK', body: MOCK_CURRENCIES };
  }
  return { ok: false, status: 404, statusText: 'Not Found', body: { error: 'unknown' } };
};
