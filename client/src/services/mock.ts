/**
 * Mock data used when VITE_USE_MOCK=true.
 *
 * Mirrors the prototype's hardcoded RATES table so the frontend can run
 * before the backend exists. All rates are USD-based (matches the OXR
 * free-plan contract that the real backend will use).
 */

import type {
  ConvertResponse,
  CurrenciesResponse,
  RatesResponse,
} from '@/types/api';
import { CURRENCY_CODE_LENGTH } from '@/helpers/constants';

const MOCK_BASE = 'USD';

/** Static currency list — a representative subset, alphabetised by code. */
export const MOCK_CURRENCIES: CurrenciesResponse = {
  currencies: [
    { code: 'AED', name: 'United Arab Emirates Dirham' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan Renminbi' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound Sterling' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'USD', name: 'United States Dollar' },
  ],
};

/** Static rate table relative to USD. Matches the prototype values. */
const MOCK_RATES: Record<string, number> = {
  AED: 3.6725,
  AUD: 1.5240,
  CAD: 1.3680,
  CHF: 0.8710,
  CNY: 7.2410,
  EUR: 0.9210,
  GBP: 0.7850,
  HKD: 7.7950,
  IDR: 16240.0,
  INR: 83.45,
  JPY: 152.34,
  KRW: 1378.50,
  MYR: 4.7250,
  NZD: 1.6720,
  PHP: 56.85,
  SGD: 1.3600,
  THB: 36.42,
  USD: 1.0,
};

const FIXED_TIMESTAMP_SECONDS = 1714435200;

export function getMockRates(): RatesResponse {
  return {
    base: MOCK_BASE,
    timestamp: FIXED_TIMESTAMP_SECONDS,
    rates: { ...MOCK_RATES },
  };
}

/**
 * Compute a mock conversion using the static rate table.
 * Mirrors the formula the real backend will use.
 */
export function getMockConversion(
  from: string,
  to: string,
  amount: number,
): ConvertResponse {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  if (fromCode.length !== CURRENCY_CODE_LENGTH || toCode.length !== CURRENCY_CODE_LENGTH) {
    throw new Error(`Invalid currency code length`);
  }

  const rateFrom = MOCK_RATES[fromCode];
  const rateTo = MOCK_RATES[toCode];

  if (rateFrom === undefined || rateTo === undefined) {
    throw new Error(`Unknown currency code`);
  }

  const rate = rateTo / rateFrom;
  const result = amount * rate;

  return {
    from: fromCode,
    to: toCode,
    amount,
    result,
    rate,
    timestamp: FIXED_TIMESTAMP_SECONDS,
  };
}
