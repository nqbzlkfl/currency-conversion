/**
 * Loads and validates env vars. dotenv-cli already populated process.env
 * with the appropriate .env.{APP_ENV} file before this runs.
 * Fails fast at startup if OXR_APP_ID is missing.
 */

const VALID_APP_ENVS = ['local', 'preprod', 'prod'] as const;
type AppEnv = (typeof VALID_APP_ENVS)[number];

function readRequiredString(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readOptionalString(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function readOptionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer`);
  }
  return parsed;
}

function readAppEnv(): AppEnv {
  const raw = process.env.APP_ENV?.toLowerCase().trim();
  if (raw && (VALID_APP_ENVS as readonly string[]).includes(raw)) {
    return raw as AppEnv;
  }
  return 'local';
}

const DEFAULT_PORT = 8800;
const DEFAULT_OXR_BASE_URL = 'https://openexchangerates.org/api';
const DEFAULT_RATES_TTL_MS = 60 * 60 * 1000;
const DEFAULT_CURRENCIES_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CORS_ORIGIN = '*';

export type Env = {
  appEnv: AppEnv;
  port: number;
  oxrAppId: string;
  oxrBaseUrl: string;
  ratesTtlMs: number;
  currenciesTtlMs: number;
  corsOrigin: string;
};

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  cachedEnv = {
    appEnv: readAppEnv(),
    port: readOptionalInt('PORT', DEFAULT_PORT),
    oxrAppId: readRequiredString('OXR_APP_ID'),
    oxrBaseUrl: readOptionalString('OXR_BASE_URL', DEFAULT_OXR_BASE_URL).replace(/\/$/, ''),
    ratesTtlMs: readOptionalInt('RATES_TTL_MS', DEFAULT_RATES_TTL_MS),
    currenciesTtlMs: readOptionalInt('CURRENCIES_TTL_MS', DEFAULT_CURRENCIES_TTL_MS),
    corsOrigin: readOptionalString('CORS_ORIGIN', DEFAULT_CORS_ORIGIN),
  };

  return cachedEnv;
}

/** Test-only: clears the env cache so tests can re-load after mutating process.env. */
export function _resetEnvForTesting(): void {
  cachedEnv = null;
}
