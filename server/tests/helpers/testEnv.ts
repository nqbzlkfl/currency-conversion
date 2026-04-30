/**
 * Common test setup utilities.
 *
 * Tests don't go through the real .env.{APP_ENV} loader — they set
 * process.env directly here, then reset the env cache so loadEnv()
 * picks up the test values.
 */

import { _resetEnvForTesting } from '@/config/env';
import { _resetInflightForTesting } from '@/services/oxr.service';
import { cache } from '@/services/cache.service';

export const TEST_OXR_APP_ID = 'test-app-id-1234';
export const TEST_OXR_BASE_URL = 'https://test.openexchangerates.example';

export function applyTestEnv(): void {
  process.env.OXR_APP_ID = TEST_OXR_APP_ID;
  process.env.OXR_BASE_URL = TEST_OXR_BASE_URL;
  process.env.PORT = '8800';
  process.env.RATES_TTL_MS = '60000';
  process.env.CURRENCIES_TTL_MS = '300000';
  process.env.CORS_ORIGIN = '*';
  process.env.LOG_LEVEL = 'error'; // quiet logs during tests
  process.env.APP_ENV = 'local';
  _resetEnvForTesting();
}

export function clearAllCaches(): void {
  cache.clear();
  _resetInflightForTesting();
}
