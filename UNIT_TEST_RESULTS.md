# Unit Test Results

> **Captured locally on:** macOS / Node 22 / Vitest 1.6.1
> **Total:** 53 tests passing — 22 frontend + 31 backend

This document is a quick-reference companion to **README §5 Test Coverage**, which contains the full per-test breakdown (what each test verifies and what it asserts). This file shows the actual captured terminal output for evaluators who want to see the green run without executing anything.

---

## How to Reproduce

```bash
# From the repo root, run both test suites:
cd client && npm test && cd ..
cd server && npm test && cd ..
```

Each command runs Vitest once, prints results, and exits. No watch mode, no real network calls (the server's OXR upstream is mocked via `vi.spyOn(globalThis, 'fetch')`).

---

## Summary

| Suite | Test files | Tests | Duration |
|---|---:|---:|---:|
| **Client** (`client/`) | 3 | 22 | 746 ms |
| **Server** (`server/`) | 7 | 31 | 390 ms |
| **Total** | **10** | **53** | — |

All 53 tests pass. No skipped tests. No flaky tests.

---

## Client Test Run

Command: `cd client && npm test`

```
> currency-converter-client@1.0.0 test
> vitest run

 RUN  v1.6.1 /Users/.../currency-conversion/client

 ✓ tests/unit/helpers/currencyToCountry.test.ts (4)
 ✓ tests/unit/services/mockData.test.ts (4)
 ✓ tests/unit/helpers/format.test.ts (14)

 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  09:12:35
   Duration  746ms (transform 64ms, setup 170ms, collect 76ms,
                    tests 57ms, environment 1.23s, prepare 170ms)
```

### Client suite breakdown

| File | Tests | Covers |
|---|---:|---|
| `tests/unit/helpers/format.test.ts` | 14 | Number formatting, parsing, in-progress decimal handling |
| `tests/unit/helpers/currencyToCountry.test.ts` | 4 | Currency code → ISO-3166 country code mapping |
| `tests/unit/services/mockData.test.ts` | 4 | Mock conversion helper used in offline mode |

---

## Server Test Run

Command: `cd server && npm test`

```
> currency-converter-server@1.0.0 test
> vitest run

 RUN  v1.6.1 /Users/.../currency-conversion/server

stderr | tests/integration/currencies.test.ts > GET /api/currencies > returns 502 UPSTREAM_FAILURE when OXR is down
[error] Network error reaching OXR {"url":"https://test.openexchangerates.example/currencies.json?app_id=test-app-id-1234","err":"network error"}
[error] Network error reaching OXR {"url":"https://test.openexchangerates.example/latest.json?app_id=test-app-id-1234","err":"network error"}

 ✓ tests/unit/cache.service.test.ts (6)
 ✓ tests/unit/conversion.service.test.ts (7)
 ✓ tests/integration/currencies.test.ts (3)
 ✓ tests/integration/rates.test.ts (1)
 ✓ tests/integration/notFound.test.ts (1)
 ✓ tests/integration/health.test.ts (1)
 ✓ tests/integration/convert.test.ts (12)

 Test Files  7 passed (7)
      Tests  31 passed (31)
   Start at  09:13:01
   Duration  390ms (transform 182ms, setup 0ms, collect 1.01s,
                    tests 102ms, environment 0ms, prepare 222ms)
```

> **Note on the `[error] Network error reaching OXR` lines:** these come from `currencies.test.ts` and `convert.test.ts` deliberately simulating an upstream failure to verify the 502 mapping works. They are logger output produced by the test scenario — not actual failures. Both suites still report `7 passed (7)` and `31 passed (31)`.

### Server suite breakdown

**Unit tests** (`tests/unit/`):

| File | Tests | Covers |
|---|---:|---|
| `cache.service.test.ts` | 6 | TTL cache: get/set, expiry, lazy cleanup, delete, clear |
| `conversion.service.test.ts` | 7 | Conversion math, identity case, zero amount, unknown-currency error path |

**Integration tests** (`tests/integration/`):

| File | Tests | Covers |
|---|---:|---|
| `health.test.ts` | 1 | `GET /api/health` liveness probe |
| `currencies.test.ts` | 3 | `GET /api/currencies` happy path + 2 upstream failure modes (5xx, 429) |
| `rates.test.ts` | 1 | `GET /api/rates` cached pass-through |
| `notFound.test.ts` | 1 | 404 fallback middleware |
| `convert.test.ts` | 12 | Full controller→service→math chain, all 4xx error codes, **TTL caching** (2 requests = 1 fetch), **single-flight pattern** (5 concurrent requests = 1 fetch) |

---

## Per-Test Detail

For the full per-test description (what each assertion verifies, expected values, and rationale), see **README §5 Test Coverage**. That section contains tables describing every one of the 53 tests individually.

---

*Last captured: this run was committed alongside the repo for evaluator convenience. Re-run `npm test` in either directory to verify locally.*
