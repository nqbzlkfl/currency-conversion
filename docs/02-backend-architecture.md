# 02 — Backend Architecture

> **Project:** Currency Converter
> **Stack:** Node.js 22 + Express 4 + TypeScript
> **Scope:** REST API that proxies and caches Open Exchange Rates, performs local conversion math, and serves a typed JSON contract to the frontend.

---

## 1. Goals & Non-Goals

### Goals
- Expose `GET /api/convert` that returns a calculated conversion using the latest cached rates.
- Expose `GET /api/currencies` and `GET /api/rates` for frontend consumption.
- Cache upstream OXR responses in memory to minimise rate-limit risk.
- Proper MVC separation, typed end-to-end, clear error contract.
- No upstream calls fan out under concurrent traffic (single-flight pattern).

### Non-Goals (out of scope)
- Database or persistent storage.
- Authentication, API keys for clients, rate limiting per client.
- Historical rates (`historical/{date}.json`) or paid-plan features (custom base, time series).
- Webhooks, push, or background workers.

---

## 2. Tech Stack

| Layer            | Choice                  | Why                                                         |
|------------------|-------------------------|-------------------------------------------------------------|
| Runtime          | Node.js 22              | Required by assignment ("22+ preferred")                    |
| Web framework    | Express 4               | Allowed by assignment, minimal boilerplate                  |
| Language         | TypeScript              | Required by assignment                                      |
| HTTP client      | Native `fetch`          | Built into Node 22; no axios needed                         |
| Cache            | In-memory `Map` + TTL   | Per agreed plan (zero external deps)                        |
| Validation       | Manual middleware       | Two query params; zod would be overkill                     |
| Tests            | Vitest + supertest      | Lightweight, aligns with frontend tooling                   |
| Logging          | Tiny custom wrapper     | Avoid winston/pino — not requested                          |

**Explicitly avoided:** `node-cache`, `axios`, `zod`, `helmet`, `morgan`, `winston`. The Code Standard ("avoid unnecessary dependencies") rules these out.

---

## 3. Folder Structure

```
server/
├── src/
│   ├── config/
│   │   └── env.ts                  Loads + validates env vars
│   ├── controllers/                Thin: parse request, call service, respond
│   │   ├── convert.controller.ts
│   │   ├── currencies.controller.ts
│   │   ├── rates.controller.ts
│   │   └── health.controller.ts
│   ├── services/                   All business logic lives here
│   │   ├── oxr.service.ts          Fetch + cache OXR responses
│   │   ├── conversion.service.ts   Pure math: convert(amount, from, to)
│   │   └── cache.service.ts        Generic Map-based TTL cache
│   ├── routes/
│   │   ├── index.ts                Mounts all routers under /api
│   │   ├── convert.routes.ts
│   │   ├── currencies.routes.ts
│   │   ├── rates.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/
│   │   ├── errorHandler.ts         Catches all errors → JSON
│   │   ├── notFound.ts             404 fallback
│   │   └── validateConvert.ts      Query param validation
│   ├── utils/
│   │   ├── ApiError.ts             Custom error class with statusCode + code
│   │   └── logger.ts               Minimal wrapper (info, warn, error)
│   ├── types/
│   │   ├── oxr.types.ts            OxrLatestResponse, OxrCurrenciesResponse
│   │   └── api.types.ts            ConvertResponse, ApiErrorResponse
│   ├── app.ts                      Express app setup (no .listen)
│   └── server.ts                   Bootstraps and listens
├── tests/
│   ├── unit/
│   │   ├── conversion.service.test.ts
│   │   └── cache.service.test.ts
│   └── integration/
│       ├── convert.test.ts         supertest against /api/convert
│       ├── currencies.test.ts
│       └── rates.test.ts
├── env/
│   └── .env.example
├── tsconfig.json
└── package.json
```

The structure enforces the Code Standard: each layer has one job, and no controller knows about HTTP-from-OXR or about Maps.

---

## 4. MVC Separation

| Layer         | Responsibility                                                                       | What it must NOT do                                                  |
|---------------|--------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| Routes        | URL → controller mapping; attach validation middleware                               | No business logic                                                    |
| Controllers   | Read req, call service, write response. Return early on errors via `next(err)`        | No `fetch`, no Map access, no math                                   |
| Services      | All business logic: fetching OXR, caching, conversion math                            | No `req`/`res`, no Express imports                                   |
| Middleware    | Validate query/body, format errors, handle 404                                        | No service calls beyond what's needed for validation                 |
| Utils         | Shared helpers and types                                                              | No I/O                                                                |

This is the contract. Reviews should reject PRs that violate it.

---

## 5. API Contract

All endpoints are mounted under `/api`. All responses are JSON. All errors share the same shape.

### 5.1 GET /api/health
**Purpose:** liveness probe.
**Response 200:**
```json
{ "status": "ok", "uptime": 1234.5 }
```

### 5.2 GET /api/currencies
**Purpose:** return supported currency codes (intersection of OXR `currencies.json` and `latest.json` rates, so the UI never offers a code that fails to convert).
**Response 200:**
```json
{
  "currencies": [
    { "code": "AED", "name": "United Arab Emirates Dirham" },
    { "code": "USD", "name": "United States Dollar" }
  ]
}
```

### 5.3 GET /api/rates
**Purpose:** return the latest cached rates (bonus endpoint).
**Response 200:**
```json
{
  "base": "USD",
  "timestamp": 1714435200,
  "rates": {
    "AED": 3.6725,
    "SGD": 1.36,
    "USD": 1.0
  }
}
```

### 5.4 GET /api/convert
**Query params (all required):**
| Name     | Type    | Constraint                             |
|----------|---------|----------------------------------------|
| `from`   | string  | 3-letter uppercase currency code       |
| `to`     | string  | 3-letter uppercase currency code       |
| `amount` | number  | Finite, non-negative; max 10 decimals  |

**Response 200:**
```json
{
  "from": "USD",
  "to": "SGD",
  "amount": 1000,
  "result": 1360,
  "rate": 1.36,
  "timestamp": 1714435200
}
```

### 5.5 Error response shape (every endpoint)
```json
{
  "error": true,
  "code": "INVALID_AMOUNT",
  "message": "amount must be a positive finite number"
}
```

| HTTP | `code`                | When                                                    |
|------|----------------------|----------------------------------------------------------|
| 400  | `MISSING_PARAM`       | A required query param is absent                         |
| 400  | `INVALID_CURRENCY`    | `from`/`to` not 3 letters                                |
| 400  | `INVALID_AMOUNT`      | `amount` not a finite non-negative number                |
| 404  | `UNKNOWN_CURRENCY`    | Currency code valid format but not in cached rates       |
| 502  | `UPSTREAM_FAILURE`    | OXR returned 5xx or network error                        |
| 502  | `UPSTREAM_RATE_LIMIT` | OXR returned 429                                         |
| 500  | `INTERNAL_ERROR`      | Anything unexpected                                      |

---

## 6. Conversion Math

Single source of truth in `conversion.service.ts`. Pure function, no I/O.

```ts
// Free plan returns rates relative to USD only
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): { result: number; rate: number } {
  const rateFrom = rates[from];
  const rateTo = rates[to];
  if (rateFrom === undefined || rateTo === undefined) {
    throw new ApiError(404, 'UNKNOWN_CURRENCY', `Unknown currency code`);
  }
  const rate = rateTo / rateFrom;
  const result = amount * rate;
  return { result, rate };
}
```

This mirrors the formula documented in `Open_Exchange_Rates_API_` §3 and the prototype frontend, so the two never diverge.

---

## 7. Caching Strategy

A single generic in-memory cache, two keys, two TTLs.

### 7.1 Cache module
```ts
// services/cache.service.ts (sketch)
type Entry<T> = { value: T; expiresAt: number };

export class Cache {
  private store = new Map<string, Entry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as Entry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void { this.store.clear(); }
}
```

### 7.2 OXR service with single-flight
```ts
// services/oxr.service.ts (sketch)
const inflight = new Map<string, Promise<unknown>>();

async function getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;

  // If a request for this key is already in flight, await it
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher()
    .then(value => { cache.set(key, value, ttlMs); return value; })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
```

This guarantees N concurrent client requests during a cache miss produce exactly **one** upstream fetch.

### 7.3 TTLs
| Key              | Default TTL | Env override         | Justification                                |
|------------------|-------------|----------------------|----------------------------------------------|
| `oxr:rates`      | 60 minutes  | `RATES_TTL_MS`       | OXR free plan updates hourly                 |
| `oxr:currencies` | 24 hours    | `CURRENCIES_TTL_MS`  | Currency list rarely changes; not metered    |

---

## 8. Configuration

`src/config/env.ts` loads `.env` (via `dotenv`) and exports a typed config. The app fails fast at startup if `OXR_APP_ID` is missing.

| Variable             | Required | Default    | Purpose                                      |
|----------------------|:--------:|------------|----------------------------------------------|
| `OXR_APP_ID`         | Yes      | —          | Open Exchange Rates App ID                   |
| `PORT`               | No       | `8800`     | HTTP listen port                             |
| `OXR_BASE_URL`       | No       | `https://openexchangerates.org/api` | OXR base URL          |
| `RATES_TTL_MS`       | No       | `3600000`  | 60 minutes                                   |
| `CURRENCIES_TTL_MS`  | No       | `86400000` | 24 hours                                     |
| `CORS_ORIGIN`        | No       | `*`        | Allowed origin for CORS                      |
| `LOG_LEVEL`          | No       | `info`     | `error`, `warn`, `info`, `debug`             |

A `env/.env.example` ships with the repo.

---

## 9. Request Lifecycle

For `GET /api/convert?from=USD&to=SGD&amount=1000`:

1. Express matches the route → runs `validateConvert` middleware.
2. `validateConvert` parses and normalises params; on failure calls `next(new ApiError(400, ...))`.
3. `convert.controller` calls `oxr.service.getRates()`.
4. `oxr.service` checks cache:
   - **Hit:** returns cached `latest.json` payload.
   - **Miss + no in-flight:** issues `fetch` to OXR, registers in-flight, on success caches and returns.
   - **Miss + in-flight:** awaits the existing promise.
5. `convert.controller` calls `conversion.service.convert(amount, from, to, rates)`.
6. Controller responds with the `ConvertResponse` JSON.
7. Any thrown `ApiError` (or unexpected error) hits `errorHandler` middleware → JSON error response with the right status.

---

## 10. Error Handling

### 10.1 ApiError class
```ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
```

### 10.2 Central error middleware
- If `err instanceof ApiError`, respond with `err.statusCode` and `{ error: true, code, message }`.
- Otherwise log the error and respond 500 `INTERNAL_ERROR`.
- Never leak stack traces in production responses.

### 10.3 Upstream error mapping
| OXR returns          | We respond                               |
|----------------------|------------------------------------------|
| 200 + `{ rates }`    | normal flow                              |
| 401 (invalid app id) | 502 `UPSTREAM_FAILURE` (server config issue) |
| 429                  | 502 `UPSTREAM_RATE_LIMIT`                |
| 5xx / network error  | 502 `UPSTREAM_FAILURE`                   |

We deliberately translate upstream 401 to a 502 because from the client's perspective, the upstream is broken — they can't fix our App ID.

---

## 11. CORS

Configured globally in `app.ts` via the `cors` middleware:
- Allowed origin = `CORS_ORIGIN` env var (default `*` in dev).
- In Docker compose dev, the frontend hits the backend through a Vite proxy, so CORS only matters for production deployments.

---

## 12. Logging

Single `logger` utility with `info`, `warn`, `error`. Logs JSON lines in production, plain text in development. No request logging middleware by default — the assignment doesn't require it and adding morgan is unjustified scope.

What we do log:
- Server start (port + env summary, with `OXR_APP_ID` redacted).
- Cache miss → upstream fetch start/finish.
- Errors caught by the error middleware.

---

## 13. Testing Strategy

Per the assignment's "Add integration tests" bonus + "unit test results" deliverable.

### 13.1 Unit tests (Vitest)
| File                             | Coverage                                              |
|----------------------------------|-------------------------------------------------------|
| `conversion.service.test.ts`     | Math correctness, unknown currency throws, edge cases |
| `cache.service.test.ts`          | Set/get, TTL expiry, clear                            |

### 13.2 Integration tests (Vitest + supertest)
| File                       | Coverage                                                    |
|----------------------------|-------------------------------------------------------------|
| `convert.test.ts`          | Happy path, all 400 variants, 404 unknown, 502 upstream     |
| `currencies.test.ts`       | Returns intersection, 502 on upstream failure               |
| `rates.test.ts`            | Returns cached payload                                      |

Upstream `fetch` is mocked via `vi.spyOn(globalThis, 'fetch')`. No real network calls in tests.

### 13.3 Coverage target
Not enforcing a numeric threshold. The above tests cover every branch in services and controllers.

---

## 14. What This Doc Does NOT Cover

- Frontend → see `01-frontend-architecture.md`
- How to run / Docker → see `03-setup-and-docker.md`
- Endpoint behaviour as observed by users → see `04-functional-specification.md`
- Why these endpoints exist at all → see `05-product-requirements.md`
