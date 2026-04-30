import type { ConvertResponse, CurrenciesResponse, RatesResponse } from '@/types/api';

export const MOCK_CURRENCIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
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
];

export const MOCK_RATES: Readonly<Record<string, number>> = {
  USD: 1.0,
  AED: 3.6725,
  AUD: 1.5285,
  CAD: 1.3680,
  CHF: 0.8920,
  CNY: 7.2410,
  EUR: 0.9210,
  GBP: 0.7850,
  HKD: 7.8200,
  IDR: 16250.0,
  INR: 83.45,
  JPY: 152.34,
  KRW: 1372.5,
  MYR: 4.7250,
  NZD: 1.6840,
  PHP: 56.85,
  SGD: 1.3600,
  THB: 36.20,
};

export function getMockCurrencies(): CurrenciesResponse {
  return { currencies: [...MOCK_CURRENCIES] };
}

export function getMockRates(): RatesResponse {
  return {
    base: 'USD',
    timestamp: Math.floor(Date.now() / 1000),
    rates: { ...MOCK_RATES },
  };
}

export function computeMockConversion(
  from: string,
  to: string,
  amount: number,
): ConvertResponse {
  const rateFrom = MOCK_RATES[from];
  const rateTo = MOCK_RATES[to];
  if (rateFrom === undefined || rateTo === undefined) {
    const missing = rateFrom === undefined ? from : to;
    throw new Error(`Currency ${missing} is not supported`);
  }
  const rate = rateTo / rateFrom;
  const result = amount * rate;
  return {
    from,
    to,
    amount,
    result,
    rate,
    timestamp: Math.floor(Date.now() / 1000),
  };
}
