# 03 — Setup, Run & Docker

> **Audience:** Developers cloning the repo for the first time.
> **Goal:** Get the app running locally in three ways: native (Node + Vite), Docker (compose), and tests.

> **Note:** Docker setup is included as a **scope addition** beyond the originally locked plan (which had `/rates` endpoint and integration tests as the only bonuses). It's optional — the app runs fine without Docker.

---

## 1. Prerequisites

| Tool          | Version    | Notes                                          |
|---------------|------------|------------------------------------------------|
| Node.js       | 22.x       | Assignment requires 22+                        |
| npm           | 10.x+      | Ships with Node 22                             |
| Git           | any        | For cloning                                    |
| Docker        | 24.x+      | **Optional**, only for the Docker path         |
| Docker Compose| v2 (plugin)| **Optional**, only for the Docker path         |

Verify:
```bash
node --version    # v22.x.x
npm --version     # 10.x.x
```

---

## 2. Repository Layout

Two separate folders, no workspace (per locked plan):

```
currency-conversion-converter/
├── client/                         Frontend (Vite + React + TS)
├── server/                         Backend (Express + TS)
├── docs/                           This documentation
├── docker-compose.yml              Optional Docker orchestration
└── README.md                       Top-level quick start
```

Each of `client/` and `server/` has its own `package.json`, `node_modules`, and `tsconfig.json`. They are independent.

---

## 3. Environment Variables

### 3.1 Backend (`server/env/.env.local`)

Copy `server/env/.env.example` to `server/env/.env.local` and fill in:

```
OXR_APP_ID=aa141bebf0c24253a6a89a9f9591c0d9
PORT=8800
OXR_BASE_URL=https://openexchangerates.org/api
RATES_TTL_MS=3600000
CURRENCIES_TTL_MS=86400000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

> The App ID above is the project key from `Open_Exchange_Rates_API_`. Replace it with your own for production.

### 3.2 Frontend (`client/env/.env.local`)

Optional. Only needed if your backend doesn't run on `localhost:8800`.

```
VITE_API_BASE_URL=/api
```

In development, Vite proxies `/api` to the backend (see `01-frontend-architecture.md` §11), so this stays as `/api`. Vite reads from `client/env/` via the `envDir` setting in `vite.config.ts`.

---

## 4. Native Setup (no Docker)

### 4.1 Backend

```bash
cd server
npm install
cp env/.env.example env/.env.local   # then edit OXR_APP_ID
npm run dev                          # starts on http://localhost:8800
```

Verify:
```bash
curl http://localhost:8800/api/health
# → { "status": "ok", "uptime": ... }
```

### 4.2 Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `localhost:8800`, so no CORS configuration is needed.

### 4.3 Production build

```bash
# Backend
cd server
npm run build              # → server/dist
npm start                  # runs dist/server.js

# Frontend
cd client
npm run build              # → client/dist (static files)
npm run preview            # serves the production build locally
```

The frontend's `dist/` is a static bundle — host it on any static server, or serve it from the backend by adding `express.static()` in production (out of scope for this doc).

---

## 5. NPM Scripts (reference)

### 5.1 Backend (`server/package.json`)

| Script              | Action                                          |
|---------------------|-------------------------------------------------|
| `npm run dev`       | `tsx watch src/server.ts`                       |
| `npm run build`     | `tsc`                                           |
| `npm start`         | `node dist/server.js`                           |
| `npm test`          | `vitest run`                                    |
| `npm run test:watch`| `vitest`                                        |
| `npm run lint`      | `tsc --noEmit` (type check only; no ESLint to avoid scope creep) |

### 5.2 Frontend (`client/package.json`)

| Script              | Action                                          |
|---------------------|-------------------------------------------------|
| `npm run dev`       | `vite`                                          |
| `npm run build`     | `tsc && vite build`                             |
| `npm run preview`   | `vite preview`                                  |
| `npm test`          | `vitest run`                                    |
| `npm run test:watch`| `vitest`                                        |

---

## 6. Testing

### 6.1 Backend

```bash
cd server
npm test                   # runs all unit + integration tests
npm test -- conversion     # runs only files matching "conversion"
```

Test files live in `server/tests/`. Tests do not hit the real OXR API — `fetch` is mocked.

### 6.2 Frontend

```bash
cd client
npm test                   # runs all component + hook tests
```

---

## 7. Example API Calls (cURL)

After the backend is running on `localhost:8800`:

```bash
# Health
curl http://localhost:8800/api/health

# Currencies (intersection of OXR currencies.json ∩ latest.json)
curl http://localhost:8800/api/currencies

# Latest rates (cached)
curl http://localhost:8800/api/rates

# Convert 1000 USD → SGD
curl "http://localhost:8800/api/convert?from=USD&to=SGD&amount=1000"

# Error: missing param
curl "http://localhost:8800/api/convert?from=USD&amount=1000"
# → 400 { "error": true, "code": "MISSING_PARAM", "message": "to is required" }

# Error: unknown currency
curl "http://localhost:8800/api/convert?from=USD&to=XYZ&amount=100"
# → 404 { "error": true, "code": "UNKNOWN_CURRENCY", ... }
```

A Postman collection covering these endpoints is described in `Open_Exchange_Rates_API_` §5 — adapt it by changing `{{base_url}}` from the OXR public URL to `http://localhost:8800/api`.

---

## 8. Docker Setup

> **Scope note:** Docker was added as an extension after the original plan. The native flow above is the primary supported path; Docker is provided as a convenience for evaluators who prefer one-command startup.

### 8.1 What gets built

| Image            | Source            | Purpose                                          |
|------------------|-------------------|--------------------------------------------------|
| `cc-server`      | `server/Dockerfile`| Compiled Node 22 + Express server               |
| `cc-client`      | `client/Dockerfile`| Static React build served via nginx             |

### 8.2 `server/Dockerfile`

```dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8800
CMD ["node", "dist/server.js"]
```

### 8.3 `client/Dockerfile`

```dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- runtime stage (nginx) ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 8.4 `client/nginx.conf`

Proxies `/api/*` to the backend container so the SPA and API share an origin in production.

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://server:8800/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 8.5 `docker-compose.yml`

```yaml
services:
  server:
    build: ./server
    container_name: cc-server
    environment:
      - NODE_ENV=production
      - PORT=8800
      - OXR_APP_ID=${OXR_APP_ID}
      - OXR_BASE_URL=https://openexchangerates.org/api
      - RATES_TTL_MS=3600000
      - CURRENCIES_TTL_MS=86400000
      - CORS_ORIGIN=*
      - LOG_LEVEL=info
    expose:
      - "8800"
    restart: unless-stopped

  client:
    build: ./client
    container_name: cc-client
    ports:
      - "8080:80"
    depends_on:
      - server
    restart: unless-stopped
```

### 8.6 Running with Docker

Place a `.env` at the **repo root** (read by docker compose):

```
OXR_APP_ID=aa141bebf0c24253a6a89a9f9591c0d9
```

Then:

```bash
docker compose up --build       # build & start both services
# open http://localhost:8080

docker compose down             # stop & remove
docker compose logs -f server   # tail backend logs
```

Notes:
- The backend port (`8800`) is **not** published to the host — only the nginx-served frontend on `8080`. The frontend reaches the backend through the docker network.
- For local dev with hot reload, use the **native setup** (§4), not Docker.

---

## 9. Troubleshooting

| Symptom                                    | Likely cause                                  | Fix                                                   |
|--------------------------------------------|-----------------------------------------------|-------------------------------------------------------|
| Backend logs `OXR_APP_ID is required`      | Missing `.env` or env var                     | Create `server/.env` per §3.1                         |
| Frontend shows "Service temporarily unavailable" | Backend not running or wrong port           | Start backend (§4.1), confirm `localhost:8800`        |
| All conversions return same value          | Cache stuck on stale data                     | Restart backend (memory cache resets)                 |
| `502 UPSTREAM_RATE_LIMIT`                  | OXR free-plan monthly quota exhausted         | Wait for quota reset, or use a different App ID       |
| `CORS error` in browser                    | Frontend served from origin not in `CORS_ORIGIN` | Update `CORS_ORIGIN` env var or use Vite proxy        |
| Docker `client` can't reach `server`       | Service name mismatch in nginx.conf           | Confirm `proxy_pass http://server:8800/`              |

---

## 10. What This Doc Does NOT Cover

- Why the architecture is shaped this way → see `01-frontend-architecture.md` and `02-backend-architecture.md`
- App behaviour as a user observes it → see `04-functional-specification.md`
- Project goals and acceptance criteria → see `05-product-requirements.md`
- Cloud deployment (AWS/GCP) — out of agreed scope.
