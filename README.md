# Currency Converter

A single-purpose currency converter web app: pick two currencies, type an amount, see the converted value and live rate. Built as a fullstack assignment using Open Exchange Rates.

**Stack:** React 18 + TypeScript + Vite (frontend) · Node 22 + Express 4 + TypeScript (backend) · in-memory TTL cache · Open Exchange Rates (free tier).

![Status](https://img.shields.io/badge/Node-22-green) ![Tests](https://img.shields.io/badge/tests-53%20passing-brightgreen) ![Build](https://img.shields.io/badge/build-passing-brightgreen)

## 🌐 Live URLs

| What | URL |
|------|-----|
| **Frontend** (Firebase Hosting) | https://currency-conversion-9e2e5.web.app |
| **Backend API** (Google Cloud Run) | https://currency-conversion-696403394356.asia-southeast1.run.app |
| **Health check** | https://currency-conversion-696403394356.asia-southeast1.run.app/api/health |

> Backend may take a few seconds to respond on the first request after idle (Cloud Run cold start with `min-instances=0` for free-tier cost optimisation). The frontend shows a loading indicator during this wait.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Structure](#2-project-structure)
3. [Environments](#3-environments)
4. [API Reference](#4-api-reference)
5. [Test Coverage](#5-test-coverage)
6. [CI / Build Pipeline](#6-ci--build-pipeline)
7. [Postman Collection](#7-postman-collection)
8. [Docker (Backend Only)](#8-docker-backend-only)
9. [Architecture & Design Docs](#9-architecture--design-docs)
10. [AI Prompt Log](#10-ai-prompt-log)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Quick Start

**Prerequisites:** Node 22 (use `nvm use` — `.nvmrc` files are provided), npm 10+.

### Option A — One-shot setup script (recommended)

From the repo root:

```bash
chmod +x setup.sh   # first time only
./setup.sh
```

The script:
1. Verifies Node 22+ is installed
2. Creates `server/env/.env.local` and `client/env/.env.local` from the templates
3. Prompts you for an `OXR_APP_ID` ([sign up free](https://openexchangerates.org/signup/free))
4. Runs `npm install` in both projects

Then start each side in its own terminal:

```bash
# Terminal 1
cd server && npm run dev    # → http://localhost:8800

# Terminal 2
cd client && npm run dev    # → http://localhost:5173
```

### Option B — Manual setup

```bash
# 1. Backend (terminal 1)
cd server
cp env/.env.example env/.env.local   # then edit OXR_APP_ID
npm install
npm run dev                          # → http://localhost:8800

# 2. Frontend (terminal 2)
cd client
cp env/.env.example env/.env.local
npm install
npm run dev                          # → http://localhost:5173
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api/*` to `localhost:8800`, so no CORS configuration is required.

**Default conversion:** USD → SGD, 1,000 (matches the Figma mockup).

---

## 2. Project Structure

```
currency-conversion-converter/
├── .github/workflows/         CI workflows (GitHub Actions)
├── client/                    Vite + React + TS frontend
│   ├── src/
│   │   ├── components/        UI components (each with .module.css)
│   │   ├── hooks/             useConvert, useCurrencies, useSwapAnimation
│   │   ├── helpers/           constants/, format.ts, currencyToCountry.ts
│   │   ├── services/          api.ts (fetch wrapper), mockData.ts
│   │   ├── styles/            theme.css, base.css, global.css
│   │   └── types/             api.ts (mirrors server contract)
│   └── .env.{local,preprod,prod}
│
├── server/                    Node + Express + TS backend (MVC)
│   ├── src/
│   │   ├── controllers/       Thin: parse → service → respond
│   │   ├── services/          OXR fetch + cache + conversion math
│   │   ├── middleware/        Validation, error handling, 404
│   │   ├── routes/            Express router wiring
│   │   ├── helpers/constants/ Routes, error codes, HTTP statuses
│   │   ├── config/env.ts      Env loader + validator
│   │   └── utils/             ApiError, logger
│   ├── tests/{unit,integration}
│   └── .env.{local,preprod,prod}
│
├── docs/                      Architecture & spec documents (1–5)
├── postman/                   Postman collection + Local/Production environments
└── README.md                  ← you are here
```

---

## 3. Environments

Three environments are supported on both client and server: **local**, **preprod**, **prod**.

### Backend env files (`server/env/.env.{local,preprod,prod}`)

| Variable             | local     | preprod    | prod       | Purpose                              |
|----------------------|-----------|------------|------------|--------------------------------------|
| `OXR_APP_ID`         | required  | required   | required   | Open Exchange Rates App ID           |
| `PORT`               | 8800      | 8800       | 8800       | HTTP listen port                     |
| `OXR_BASE_URL`       | OXR url   | OXR url    | OXR url    | Upstream API base                    |
| `RATES_TTL_MS`       | 60000     | 3600000    | 3600000    | Rates cache TTL (1m dev / 1h prod)   |
| `CURRENCIES_TTL_MS`  | 300000    | 86400000   | 86400000   | Currencies cache TTL                 |
| `CORS_ORIGIN`        | localhost | preprod URL| prod URL   | Allowed CORS origin                  |
| `LOG_LEVEL`          | debug     | info       | warn       | Logger threshold                     |

Selected at runtime via `APP_ENV={local|preprod|prod}` (set by npm scripts).

### Frontend env files (`client/env/.env.{local,preprod,prod}`)

| Variable              | local     | preprod                                          | prod                                             |
|-----------------------|-----------|--------------------------------------------------|--------------------------------------------------|
| `VITE_USE_MOCK`       | false     | false                                            | false                                            |
| `VITE_API_BASE_URL`   | `/api`    | Cloud Run URL `+ /api`                           | Cloud Run URL `+ /api`                           |

In production both `preprod` and `prod` point at the same Cloud Run service (`https://currency-conversion-696403394356.asia-southeast1.run.app/api`) — there's no separate preprod backend deployed.

Selected via Vite's `--mode` flag (Vite reads from `client/env/` via the `envDir` config). `.env.local` is auto-loaded by Vite in every mode (gitignored).

> **Convention:** only `env/.env.example` is committed; real env files in `env/` are gitignored.

---

## 4. API Reference

All endpoints under `/api`. Base URL: `http://localhost:8800/api` (dev).

### `GET /api/health`

Liveness probe. No upstream calls.

```bash
curl http://localhost:8800/api/health
# → { "status": "ok", "uptime": 12.5 }
```

### `GET /api/currencies`

Returns the intersection of OXR `currencies.json` ∩ `latest.json` rates, sorted alphabetically.

```bash
curl http://localhost:8800/api/currencies
# → { "currencies": [{ "code": "AED", "name": "United Arab Emirates Dirham" }, ...] }
```

### `GET /api/rates`

Returns the cached rates payload. Base is always USD on the OXR free plan.

```bash
curl http://localhost:8800/api/rates
# → { "base": "USD", "timestamp": 1714435200, "rates": { "SGD": 1.36, ... } }
```

### `GET /api/convert?from=&to=&amount=`

Converts an amount between two currencies using cached rates.

```bash
curl "http://localhost:8800/api/convert?from=USD&to=SGD&amount=1000"
# → { "from":"USD","to":"SGD","amount":1000,"result":1360,"rate":1.36,"timestamp":1714435200 }
```

**Math:** `result = amount × (rates[to] / rates[from])` (cross-currency via implicit USD base).

### Error contract

All errors return:
```json
{ "error": true, "code": "<CODE>", "message": "<human-readable>" }
```

| HTTP | Code                  | Trigger                                              |
|------|-----------------------|------------------------------------------------------|
| 400  | `MISSING_PARAM`       | Required query param absent                          |
| 400  | `INVALID_CURRENCY`    | `from`/`to` not 3 letters                            |
| 400  | `INVALID_AMOUNT`      | Not finite or negative                               |
| 404  | `UNKNOWN_CURRENCY`    | Valid format but not in cached rates                 |
| 404  | `NOT_FOUND`           | Unknown route                                        |
| 502  | `UPSTREAM_FAILURE`    | OXR network/5xx error                                |
| 502  | `UPSTREAM_RATE_LIMIT` | OXR returned 429                                     |
| 500  | `INTERNAL_ERROR`      | Unexpected exception                                 |

---

## 5. Test Coverage

**Total:** 53 tests passing (31 backend + 22 frontend). All run with `npm test`.

### Backend tests — `server/tests/`

#### Unit: `cache.service.test.ts` (6 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | returns null for missing keys | Cache miss returns null, not throws | `null` |
| 2 | stores and retrieves values within TTL | Set then get returns the same value | Stored value |
| 3 | returns null after TTL expires | Time travel past expiry → null | `null` |
| 4 | removes expired entries on access | Lazy cleanup keeps memory tidy | `size === 0` |
| 5 | delete removes a specific key | Targeted removal works | One key gone, other intact |
| 6 | clear removes all keys | Wholesale reset | `size === 0` |

#### Unit: `conversion.service.test.ts` (7 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | converts USD to SGD using rate ratio | Math correctness on canonical pair | `1000 × 1.36 = 1360` |
| 2 | converts SGD to USD as the inverse | Symmetric inversion | `≈ 1/1.36` |
| 3 | cross-currency via implicit USD (EUR→MYR) | `rates.MYR / rates.EUR` | Rate ratio |
| 4 | rate of 1 for same-currency conversion | Identity case | `rate=1, result=amount` |
| 5 | handles zero amount | Edge case | `result=0, rate=1.36` |
| 6 | throws UNKNOWN_CURRENCY for missing from-rate | `ApiError 404` thrown | `code: UNKNOWN_CURRENCY` |
| 7 | throws UNKNOWN_CURRENCY for missing to-rate | `ApiError 404` thrown | `code: UNKNOWN_CURRENCY` |

#### Integration: `health.test.ts` (1 test)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | returns 200 with status and uptime | Liveness probe contract | `{status:"ok", uptime:number}` |

#### Integration: `currencies.test.ts` (3 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | returns intersection sorted by code | Excludes codes with no rate (e.g. ANG) | Alphabetical, no orphans |
| 2 | returns 502 UPSTREAM_FAILURE on network error | Catches `fetch()` throw | `502 UPSTREAM_FAILURE` |
| 3 | returns 502 UPSTREAM_RATE_LIMIT on 429 | Maps OXR rate-limit | `502 UPSTREAM_RATE_LIMIT` |

#### Integration: `rates.test.ts` (1 test)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | returns cached payload | Pass-through of `base/timestamp/rates` | OXR shape |

#### Integration: `notFound.test.ts` (1 test)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | returns 404 NOT_FOUND for unknown routes | 404 fallback middleware | `404 NOT_FOUND` |

#### Integration: `convert.test.ts` (12 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | happy path USD→SGD amount 1000 | Full controller→service→math chain | `result=1360, rate=1.36` |
| 2 | normalises lowercase currency codes | Validation upper-cases input | `from=USD, to=SGD` |
| 3 | returns 0 for amount=0 | Edge case, no error | `result=0` |
| 4 | 400 MISSING_PARAM when from missing | Validation triggers | `400 MISSING_PARAM` |
| 5 | 400 MISSING_PARAM when amount missing | Validation triggers | `400 MISSING_PARAM` |
| 6 | 400 INVALID_CURRENCY when from < 3 letters | Format check | `400 INVALID_CURRENCY` |
| 7 | 400 INVALID_CURRENCY when to has digits | Format check | `400 INVALID_CURRENCY` |
| 8 | 400 INVALID_AMOUNT when amount=abc | Numeric parse fails | `400 INVALID_AMOUNT` |
| 9 | 400 INVALID_AMOUNT when amount=-50 | Range check | `400 INVALID_AMOUNT` |
| 10 | 404 UNKNOWN_CURRENCY for valid format unsupported code | Cache lookup miss | `404 UNKNOWN_CURRENCY` |
| 11 | **caches rates** — 2 sequential requests = 1 upstream fetch | TTL cache works | `fetch` called once |
| 12 | **single-flight** — 5 concurrent requests = 1 upstream fetch | Concurrency guard works | `fetch` called once |

---

### Frontend tests — `client/src/`

#### `helpers/format.test.ts` (14 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | formatAmount: integer with commas | `1000 → "1,000.00"` | Comma + 2dp |
| 2 | formatAmount: small decimal | `0.5 → "0.50"` | Pad to 2dp |
| 3 | formatAmount: negative | `-1234.5 → "-1,234.50"` | Sign preserved |
| 4 | formatAmount: rounds 3+ decimals | `1.236 → "1.24"` | Half-up rounding |
| 5 | formatAmount: large numbers | `1000000 → "1,000,000.00"` | All separators |
| 6 | formatRate: 4 decimal places | `1.36 → "1.3600"` | Pad to 4dp |
| 7 | formatRate: rounds beyond 4dp | `1.23456789 → "1.2346"` | Half-up |
| 8 | parseAmount: strips commas | `"1,234.56" → 1234.56` | Numeric value |
| 9 | parseAmount: handles plain decimals | `"99.5" → 99.5` | No-op |
| 10 | parseAmount: invalid → NaN | `"abc"` | `NaN` |
| 11 | formatAmountInput: in-progress decimal | `"1234." → "1,234."` | Trailing dot kept |
| 12 | formatAmountInput: incomplete decimal | `"1234.5" → "1,234.5"` | Single dp kept |
| 13 | formatAmountInput: strips invalid chars | `"1a2b3" → "123"` | Non-numeric dropped |
| 14 | formatAmountInput: empty string | `""` | `""` |

#### `helpers/currencyToCountry.test.ts` (4 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | maps known currency to ISO country | `USD → US, SGD → SG, MYR → MY` | Correct ISO-3166 alpha-2 |
| 2 | falls back to UN for unknown code | `XYZ → UN` | UN sentinel (UN flag) |
| 3 | EUR maps to EU | Multi-country currency special-case | `EUR → EU` |
| 4 | uppercases input | `usd → US` (case-insensitive) | Treated same as USD |

#### `services/mockData.test.ts` (4 tests)
| # | Test | What it verifies | Expected |
|---|------|------------------|----------|
| 1 | mock conversion uses local RATES table | USD→SGD with mock data | Same formula as backend |
| 2 | mock returns rate of 1 for same currency | Identity case | `rate=1` |
| 3 | mock throws for unknown currency | Mirrors backend error | Throws |
| 4 | mock currencies list is non-empty | Sanity check | `length > 0` |

> **Note:** Component-level tests intentionally minimal — UI behaviour is verified by integration with the live backend during dev. The 22 frontend tests focus on pure logic (formatters, mappers, mock service) where regressions would be silent.

---

## 6. CI / Build Pipeline

GitHub Actions workflow at `.github/workflows/ci.yml`.

**Triggers:** push and pull request to `main` or `develop`.

**Two parallel jobs:**

| Job      | Steps                                                  |
|----------|--------------------------------------------------------|
| `server` | Setup Node 22 → `npm ci` → `lint` → `test` → `build`   |
| `client` | Setup Node 22 → `npm ci` → `lint` → `test` → 3× builds (local, preprod, prod) |

**Concurrency control:** previous runs on the same branch are cancelled when a new commit comes in (`cancel-in-progress: true`).

**Caching:** npm cache keyed on `package-lock.json` per project for fast re-installs.

The pipeline runs lint as `tsc --noEmit` for the client and as `tsc -p tsconfig.test.json --noEmit` for the server (covers both `src/` and `tests/`). Tests run with `vitest run`. Builds are type-check-only on the server (since runtime uses `tsx`) and full Vite production builds on the client.

To run the same checks locally:
```bash
# Server
cd server && npm run lint && npm test && npm run build

# Client
cd client && npm run lint && npm test && npm run build:prod
```

---

## 7. Postman Collection

A Postman collection lives in `postman/`, with separate environment files for local and production. Together they cover all 4 endpoints plus 5 error scenarios (9 requests total).

```
postman/
├── Currency_Converter_API.postman_collection.json   ← the collection
├── Local.postman_environment.json                   ← base_url = localhost:8800/api
└── Production.postman_environment.json              ← base_url = Cloud Run URL
```

**Import steps:**
1. Open Postman → click **Import** (top-left)
2. Drop **all three files** in at once — Postman imports the collection and both environments
3. In the top-right environment dropdown, select **Local** or **Production**
4. Run any request — `{{base_url}}` resolves from the active environment

To switch environments, just change the dropdown — no edits needed to the collection or requests.

**Included requests:**

| # | Name                                       | Method | Path                                    |
|---|--------------------------------------------|--------|-----------------------------------------|
| 1 | Health                                     | GET    | `/health`                               |
| 2 | Currencies                                 | GET    | `/currencies`                           |
| 3 | Rates                                      | GET    | `/rates`                                |
| 4 | Convert — Happy path (USD to SGD)          | GET    | `/convert?from=USD&to=SGD&amount=1000`  |
| 5 | Convert — Same currency (rate=1)           | GET    | `/convert?from=USD&to=USD&amount=500`   |
| 6 | Convert — Error: missing param (400)       | GET    | `/convert?from=USD&to=SGD`              |
| 7 | Convert — Error: invalid currency (400)    | GET    | `/convert?from=US&to=SGD&amount=100`    |
| 8 | Convert — Error: negative amount (400)     | GET    | `/convert?from=USD&to=SGD&amount=-50`   |
| 9 | Convert — Error: unknown currency (404)    | GET    | `/convert?from=USD&to=ZZZ&amount=100`   |

---

## 8. Docker (Backend Only)

The backend ships as a Docker container — the **same image runs locally and on Cloud Run**. The frontend does not need Docker because it deploys as static files to a CDN (see §8.2).

### 8.1 Backend Dockerfile

A multi-stage build that compiles TypeScript with `tsc + tsc-alias` (resolves `@/*` aliases and adds `.js` extensions for ESM), then runs `node dist/server.js` in a minimal runtime stage.

`server/Dockerfile`:
```dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and tsconfig, then compile to ./dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Cloud Run injects PORT at runtime; default to 8080 for local docker run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
```

`server/.dockerignore`:
```
node_modules
dist
coverage
tests
env
*.log
.DS_Store
.gitignore
.nvmrc
.env*
Dockerfile
.dockerignore
```

### 8.2 Test the container locally

The backend container listens on port `8080` (Cloud Run convention). Native dev (`npm run dev`) still uses `8800` — see §1. The container is environment-agnostic: env vars are passed at runtime via `-e` flags or Cloud Run service config, never baked into the image.

```bash
cd server

# Build the image
docker build -t currency-converter-server .

# Run it (replace OXR_APP_ID with your own for production)
docker run --rm -p 8080:8080 \
  -e OXR_APP_ID=aa141bebf0c24253a6a89a9f9591c0d9 \
  currency-converter-server

# In another terminal — verify it's healthy
curl http://localhost:8080/api/health
# → { "status": "ok", "uptime": ... }

curl "http://localhost:8080/api/convert?from=USD&to=SGD&amount=1000"
# → { "from":"USD", "to":"SGD", "result":1360, "rate":1.36, ... }
```

To pass additional env vars (CORS origin, custom TTLs, etc.), add more `-e KEY=VALUE` flags to the `docker run` command.

### 8.3 Frontend deployment (no Docker)

The frontend ships as static files (`client/dist/`) to **Firebase Hosting** — a CDN-backed static host. No container, no nginx, no runtime: Firebase serves the build output directly with auto-HTTPS and global edge caching. Containerising a static SPA would add zero value for this deployment target.

### 8.4 Production deployment

Backend → **Google Cloud Run** (deploys this Dockerfile from GitHub via Cloud Build).
Frontend → **Firebase Hosting** (deploys `client/dist/` after `npm run build:prod`).

| Layer | Provider | Live URL |
|---|---|---|
| Frontend | Firebase Hosting | https://currency-conversion-9e2e5.web.app |
| Backend | Google Cloud Run (`asia-southeast1`) | https://currency-conversion-696403394356.asia-southeast1.run.app |

**Frontend deploy** (from repo root, after editing `client/env/.env.prod` if needed):
```bash
cd client && npm run build:prod && cd ..
firebase deploy --only hosting
```

**Backend deploy** is automatic via the Cloud Build trigger on every push to `main`. The trigger builds `server/Dockerfile`, pushes the image to Artifact Registry, and deploys a new Cloud Run revision. Environment variables (including `OXR_APP_ID`) are set on the Cloud Run service itself — never baked into the image.

---

## 9. Architecture & Design Docs

Detailed design documents live in [`docs/`](docs/):

| Doc | Covers |
|-----|--------|
| [`01-frontend-architecture.md`](docs/01-frontend-architecture.md) | Stack, folder tree, state model, data flow, animation system, testing approach |
| [`02-backend-architecture.md`](docs/02-backend-architecture.md) | MVC contract, full API spec, error matrix, caching strategy, env vars |
| [`03-setup-and-docker.md`](docs/setup/03-setup-and-docker.md) | Prerequisites, env setup, native run, Docker (full architecture), troubleshooting |
| [`04-functional-specification.md`](docs/04-functional-specification.md) | Element-by-element behaviour, validation rules, animation timings, 25+ acceptance criteria |
| [`05-product-requirements.md`](docs/05-product-requirements.md) | Problem, personas, user stories, features, NFRs, constraints, risks |

Plus the source assets used as inputs:
- `Code_Standard` — coding standards (DRY, YAGNI, MVC, no unnecessary deps)
- `Open_Exchange_Rates_API_` — OXR API reference & quirks
- `uiux_guideline.md` — full design tokens & component specs from the Figma source
- `UI.pdf` — original Android Figma mockups

---

## 10. AI Prompt Log

This project was built collaboratively with Claude (Anthropic) per the assignment policy on AI assistance. The summary below captures the major decisions, prompts, and architectural debates from the build session — not a verbatim transcript, but a faithful record of what was asked and decided.

### Phase 1 — Planning & locked decisions

The session opened by uploading the assignment PDF, the OXR API guide, the UI/UX guideline, the code standard, and the Figma source (`UI.pdf`). Ground rules were set up front:

> *"Act as a senior full-stack developer with 10+ years of experience. If you don't know something, say so clearly. Always ask questions or propose changes before proceeding. Don't over-engineer or add anything not explicitly requested."*

Before any code was written, the assistant proposed an architecture and asked for confirmation on every major decision. The user explicitly asked for **a full architecture proposal covering both backend and frontend** — folder structure, component hierarchy, data flow, state model, error contract — before any implementation. The following were locked:

- **Stack:** Vite + React 18 + TS (frontend), Node 22 + Express 4 + TS (backend), separate folders (no monorepo), in-memory `Map` cache (no Redis/sqlite), zero unnecessary deps.
- **End-to-end flow agreed up front:** App load → `GET /api/currencies` → populate dropdowns → user types or selects → debounced `GET /api/convert` → render result + indicative rate. Swap flow: animate cross-fade and 180° spin, then re-fetch. Every state transition mapped before writing the reducer.
- **Bonuses included:** `/rates` endpoint, integration tests. Docker added later as a scope addition.
- **Custom rule from user:** "No hardcoded colors or magic numbers. Visual values go in `theme.css` (CSS custom properties), behavior values go in `helpers/constants/`. Use `@/*` path alias."
- **Three environments:** local, preprod, prod — selected via `APP_ENV` (backend) and Vite `--mode` (frontend), `dotenv-cli` for backend env loading. Env files live in `env/` on each side; only `env/.env.example` committed.

### Phase 2 — Documentation first

Before writing any source code, the assistant produced five design documents (`01-` through `05-` in `docs/`) covering frontend architecture, backend architecture, setup & Docker, functional specification, and product requirements. The user reviewed and approved each in turn. Rationale: aligning on contracts and behavior up front made the implementation phase mostly mechanical.

### Phase 3 — Frontend implementation

> *"Build a mock SVG design first — a single HTML file that I can open in a browser and validate the design against the Figma source before we commit to the React structure."*

The user explicitly asked for a **visual mockup deliverable** — a self-contained HTML prototype with hardcoded data — to validate the design end-to-end before any React or component decomposition. The assistant produced `docs/currency-converter-prototype.html`: a single file containing the complete card layout, custom dropdown, swap animation, divider, indicative rate display, and **inline SVG shapes for both the swap-button arrow icon and placeholder country flags**. This let the user verify spacing, animation timing, dropdown behaviour, gradient background, and overall layout before writing any React. Once approved, the structure was ported into the proper Vite/React/TS project, components decomposed into `ConverterCard`, `CurrencyRow`, `CurrencySelector`, `CurrencyDropdown`, `AmountInput`, `SwapButton`, `RateDisplay`, and `Flag`. The placeholder flag SVGs were swapped for `react-country-flag`. Each component got its own folder with a co-located `.module.css` file. Animation timings were extracted into `theme.css`; behaviour constants into `helpers/constants/`.

#### Notable iterations:
- **Flag rendering bug** went through three rounds. The user kept screenshotting "still doesn't fill the circle." First two rounds the assistant guessed at `object-fit: cover` and `transform: scale(1.5)` without checking the actual DOM. Third round the assistant finally read `react-country-flag/src/index.tsx` and discovered: it renders an `<img>` (not `<svg>`) sourced from a CDN, with inline `width: 1em; height: 1em`. Fix was a `:global(img)` selector with `!important` to override the inline styles. **Lesson reinforced:** inspect the actual library output before guessing.

- **Swap re-fire bug.** When swap exchanges `from`/`to`, the *set* of values doesn't change so `useEffect([from, to])` doesn't re-fire. Fix: monotonic `epoch` counter on the reducer that increments on every action; `useConvert` watches `[immediate, epoch]` instead.

- **Swap animation timing.** User initially asked for the swap rotation to feel "more weighty." Bumped from 600ms to 900ms; fade duration kept at 300ms so content fades back in while the icon is still rotating. The two timings deliberately overlap — content settles before the icon finishes spinning.

### Phase 4 — Backend implementation

> *"Build it now. MVC strictly. Ask before any architectural divergence."*

Built in this order: scaffold → helpers/constants → utils (`ApiError`, `logger`) → config (`env.ts`) → cache service → OXR service (with single-flight) → conversion service → middleware → controllers → routes → app factory → server bootstrap.

#### Notable decisions:
- **Single-flight pattern.** During cache miss, an in-flight `Promise` is registered so concurrent requests for the same key share one upstream fetch. Verified by the "5 concurrent requests = 1 fetch" integration test.

- **`tsx` for production runs.** Initial plan was to `tsc` emit JS and run `node dist/server.js`. ESM strictness in Node 22 requires `.js` extensions on imports plus an alias resolver — both add complexity for no real benefit on an assignment-scope project. Decided to keep `tsx` for both `dev:*` and `start:*` scripts. `npm run build` is `tsc --noEmit` (type-check only). This was an honest trade-off, not an oversight.

- **Test type-check vs build type-check.** Putting `tests/` in the main `tsconfig.json` broke `rootDir: "src"`. Created `tsconfig.test.json` extending the main tsconfig with `rootDir: "."`. The lint script uses the test config; the build script uses the main one.

- **`fetch` mock typing.** `RequestInfo` is a DOM type, not a Node type. Used `string | URL | Request` in test helpers to keep the strict type-check happy.

### Phase 5 — Three-environment setup

Discussed four options for env loading. Chose: custom `APP_ENV=local|preprod|prod` (separate from `NODE_ENV`), `env/.env.example` committed, real env files in `env/` gitignored, `dotenv-cli` to load the right file at script start. Frontend uses Vite's `--mode` flag with `envDir: './env'` in `vite.config.ts`.

> *"Vite errored on `--mode local` because `.env.local` is reserved."*

Vite reserves `.env.local` as a special always-loaded gitignored override. The fix was to use `vite` (no `--mode` flag) for local — Vite auto-loads `.env` + `.env.local` — and `--mode preprod`/`--mode prod` for the others.

### Phase 6 — Port number consistency

Initial port was 3000. User decided mid-session to use 8800 instead. Used a Python regex `3000(?!\d)` to swap port references across env files, source code, and docs without mangling TTL values like `3600000` and `86400000`. 23 references updated across docs alone.

### Phase 7 — Final deliverables (this turn)

User requested:
1. Scrollbar styling on the dropdown panel — done with `::-webkit-scrollbar` + Firefox `scrollbar-width: thin`, primary-tinted thumb at 20%/35% opacity.
2. GitHub Actions CI — `.github/workflows/ci.yml` with separate server/client jobs, npm cache, concurrency cancellation.
3. This README with the full AI prompt log + test coverage table.
4. Postman collection — 9 requests covering all endpoints + error cases.
5. Docker setup as **optional step-by-step instructions** (above) rather than created files — user wanted the choice.

### Reflections on the AI collaboration

What worked:
- **Asking before coding.** The "ask question first" rule prevented at least three over-engineered detours (a database layer, complex CSS frameworks, premature monorepo setup).
- **Locking decisions in writing.** The `01-`–`05-` docs served as a contract that both sides referred back to throughout implementation.
- **User pushback was high-signal.** When the user said "still doesn't fit" three times on the flag bug, the right response would have been to inspect the library output on round 1, not round 3.

What didn't:
- The assistant occasionally guessed at fixes when reading the actual library or DOM would have been faster (the flag bug; the ESM extension issue).
- A few times, scope crept past what was asked — the assistant once started writing nginx config when the user only wanted a Postman collection.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend fails with `Missing required environment variable: OXR_APP_ID` | No `env/.env.local` in `server/` | `cp server/env/.env.example server/env/.env.local` and fill `OXR_APP_ID` |
| Frontend shows "Service temporarily unavailable" | Backend not running or wrong port | Start backend (`cd server && npm run dev`); confirm on `localhost:8800` |
| All conversions show same value across multiple changes | Cache stuck on stale OXR data | Restart backend — memory cache resets on every restart |
| `502 UPSTREAM_RATE_LIMIT` | OXR free-plan monthly quota exhausted | Wait for quota reset, or use a different App ID |
| CORS error in browser | Frontend served from origin not in `CORS_ORIGIN` | Update `CORS_ORIGIN` in `server/env/.env.local`, or use the Vite proxy (default) |
| Tests fail with `RequestInfo is not defined` | Old test helper using DOM type | Already fixed — pull latest |
| Vite errors `cannot be used as a mode name` | Tried `--mode local` | Use `npm run dev` (no flag) — `.env.local` is auto-loaded |
| Dropdown shows default browser scrollbar | Old CSS cached | Hard reload (Cmd+Shift+R) |
| Swap doesn't fire conversion after 1st use | (Should not happen — `epoch` counter fixes it) | If reproducible, check `useConverterState.ts` increments `epoch` on every action |

---

## License

ISC — see `package.json`.

## Acknowledgements

- Open Exchange Rates for the free API tier
- Lipis flag-icons for the SVG flags (via `react-country-flag`)
- Lucide for the chevron icon
- Anthropic Claude as a coding collaborator (see §10)
