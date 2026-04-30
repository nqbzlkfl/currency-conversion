export const API_PREFIX = '/api';

export const ROUTES = {
  health: '/health',
  currencies: '/currencies',
  rates: '/rates',
  convert: '/convert',
} as const;

export const CURRENCY_CODE_LENGTH = 3;

export const CACHE_KEYS = {
  rates: 'oxr:rates',
  currencies: 'oxr:currencies',
} as const;

/** OXR free plan returns rates relative to USD only. */
export const OXR_BASE_CURRENCY = 'USD';
