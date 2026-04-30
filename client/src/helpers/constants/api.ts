const FALLBACK_API_BASE = '/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE;
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === 'true';
export const CONVERT_DEBOUNCE_MS = 250;

export const API_PATHS = {
  currencies: '/currencies',
  convert: '/convert',
  rates: '/rates',
  health: '/health',
} as const;
