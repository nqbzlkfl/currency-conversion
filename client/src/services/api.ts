import { API_BASE_URL, API_PATHS, USE_MOCK_API } from '@/helpers/constants';
import type {
  ApiErrorResponse,
  ConvertResponse,
  CurrenciesResponse,
  RatesResponse,
} from '@/types/api';
import { ApiError } from '@/types/api';
import { computeMockConversion, getMockCurrencies, getMockRates } from './mockData';

const MOCK_LATENCY_MS = 120;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(
      body?.code ?? 'NETWORK_ERROR',
      body?.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

function buildConvertQuery(from: string, to: string, amount: number): string {
  const params = new URLSearchParams({
    from,
    to,
    amount: String(amount),
  });
  return `${API_PATHS.convert}?${params.toString()}`;
}

export const api = {
  getCurrencies(): Promise<CurrenciesResponse> {
    if (USE_MOCK_API) return delay(getMockCurrencies(), MOCK_LATENCY_MS);
    return request<CurrenciesResponse>(API_PATHS.currencies);
  },

  getRates(): Promise<RatesResponse> {
    if (USE_MOCK_API) return delay(getMockRates(), MOCK_LATENCY_MS);
    return request<RatesResponse>(API_PATHS.rates);
  },

  convert(from: string, to: string, amount: number): Promise<ConvertResponse> {
    if (USE_MOCK_API) {
      try {
        return delay(computeMockConversion(from, to, amount), MOCK_LATENCY_MS);
      } catch (err) {
        return Promise.reject(
          new ApiError('UNKNOWN_CURRENCY', (err as Error).message, 404),
        );
      }
    }
    return request<ConvertResponse>(buildConvertQuery(from, to, amount));
  },
};
