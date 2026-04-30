import { loadEnv } from '@/config/env';
import { cache } from './cache.service';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import {
  CACHE_KEYS,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/helpers/constants';
import type { OxrCurrenciesResponse, OxrLatestResponse } from '@/types/oxr.types';

/** OXR returns 401 when the App ID is invalid; we translate to 502 since
 * the client can't fix our config. See docs/02-backend-architecture.md §10.3. */
const OXR_STATUS_UNAUTHORISED = 401;
const OXR_STATUS_RATE_LIMIT = 429;

/** Single-flight: only one upstream fetch per key in-progress at a time. */
const inflight = new Map<string, Promise<unknown>>();

function mapUpstreamError(status: number, message: string): ApiError {
  if (status === OXR_STATUS_RATE_LIMIT) {
    return new ApiError(
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.UPSTREAM_RATE_LIMIT,
      'Rate limit exceeded; please try again later',
    );
  }
  if (status === OXR_STATUS_UNAUTHORISED) {
    logger.error('OXR rejected our App ID — check OXR_APP_ID env var', { status, message });
    return new ApiError(
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.UPSTREAM_FAILURE,
      'Unable to fetch rates',
    );
  }
  return new ApiError(
    HTTP_STATUS.BAD_GATEWAY,
    ERROR_CODES.UPSTREAM_FAILURE,
    'Unable to fetch rates',
  );
}

async function fetchUpstream<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    logger.error('Network error reaching OXR', { url, err: (err as Error).message });
    throw new ApiError(
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.UPSTREAM_FAILURE,
      'Unable to fetch rates',
    );
  }

  if (!response.ok) {
    throw mapUpstreamError(response.status, response.statusText);
  }

  return (await response.json()) as T;
}

async function getOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) {
    logger.debug('Cache hit', { key });
    return cached;
  }

  const existing = inflight.get(key);
  if (existing) {
    logger.debug('Awaiting in-flight fetch', { key });
    return existing as Promise<T>;
  }

  logger.info('Cache miss — fetching upstream', { key });
  const promise = fetcher()
    .then((value) => {
      cache.set(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export const oxrService = {
  async getRates(): Promise<OxrLatestResponse> {
    const env = loadEnv();
    const url = `${env.oxrBaseUrl}/latest.json?app_id=${env.oxrAppId}`;
    return getOrFetch(CACHE_KEYS.rates, env.ratesTtlMs, () =>
      fetchUpstream<OxrLatestResponse>(url),
    );
  },

  async getCurrencies(): Promise<OxrCurrenciesResponse> {
    const env = loadEnv();
    const url = `${env.oxrBaseUrl}/currencies.json?app_id=${env.oxrAppId}`;
    return getOrFetch(CACHE_KEYS.currencies, env.currenciesTtlMs, () =>
      fetchUpstream<OxrCurrenciesResponse>(url),
    );
  },
};

/** Test-only: reset in-flight map so concurrent-fetch tests don't leak state. */
export function _resetInflightForTesting(): void {
  inflight.clear();
}
