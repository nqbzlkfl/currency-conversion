# 01 — Frontend Architecture

> **Project:** Currency Converter
> **Stack:** Vite + React 18 + TypeScript
> **Scope:** Single-page web application that consumes the project's own backend API (`/api/*`). The frontend never calls Open Exchange Rates directly.

---

## 1. Goals & Non-Goals

### Goals
- Faithfully render the design from `uiux_guideline.md` and the Android Figma source (UI.pdf).
- Mobile-first layout with a fixed 390 px card that centres on desktop without breakpoint shifts.
- Convert between any two supported currencies in real time as the user types or selects.
- Stay lightweight: minimum dependencies, no global state library, no CSS framework.

### Non-Goals (out of scope)
- Authentication, user accounts, persistence of preferences.
- Historical charts, rate alerts, notifications.
- Server-side rendering or static export.
- Internationalisation beyond the existing English copy.

---

## 2. Tech Stack

| Layer            | Choice                       | Why                                                            |
|------------------|------------------------------|----------------------------------------------------------------|
| Build tool       | Vite                         | Fast dev server, simple TS config, zero runtime cost           |
| Framework        | React 18                     | Required by assignment                                         |
| Language         | TypeScript                   | Required by assignment                                         |
| Styling          | Plain CSS + CSS Modules      | Design system already specifies tokens; no Tailwind needed     |
| Flags            | `react-country-flag`         | Already specified in `uiux_guideline.md` §7                    |
| Icons            | `lucide-react`               | Only `ChevronDown`; matches design system                      |
| HTTP             | Native `fetch`               | One endpoint family; axios would be unnecessary weight         |
| Tests            | Vitest + React Testing Library | Aligns with Vite, no extra config                              |

**Explicitly avoided:** Redux/Zustand (not needed for this scope), Tailwind (tokens already defined as plain CSS variables), axios, Material UI / Chakra (custom design system).

---

## 3. Folder Structure

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── ConverterCard/         The main card (composition root)
│   │   ├── CurrencyRow/           Label + selector + amount input
│   │   ├── CurrencySelector/      Trigger button (flag + code + chevron)
│   │   ├── CurrencyDropdown/      Panel + list + click-outside overlay
│   │   ├── AmountInput/           Formatted decimal pill (controlled)
│   │   ├── SwapButton/            Circular button + spin animation
│   │   ├── RateDisplay/           Indicative rate line below the card
│   │   └── Flag/                  Wraps react-country-flag, applies sizing
│   ├── hooks/
│   │   ├── useCurrencies.ts       Fetches currency list once on mount
│   │   ├── useConvert.ts          Debounced /convert call, returns result + rate
│   │   └── useSwapAnimation.ts    Timing guard + class orchestration for swap
│   ├── services/
│   │   └── api.ts                 fetch wrapper, typed responses, error mapping
│   ├── types/
│   │   └── api.ts                 Currency, ConvertResponse, ApiError
│   ├── utils/
│   │   ├── format.ts              Number formatting helpers
│   │   └── currencyToCountry.ts   Currency code → ISO-3166 alpha-2 mapping
│   ├── styles/
│   │   ├── tokens.css             CSS variables from uiux_guideline.md §9
│   │   └── reset.css              Minimal reset
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 4. Component Hierarchy

```
App
└── ConverterCard
    ├── CurrencyRow (from)
    │   ├── CurrencySelector
    │   │   ├── Flag
    │   │   └── ChevronDown
    │   ├── CurrencyDropdown   (conditionally rendered)
    │   │   └── DropdownItem[] (Flag + code + name)
    │   └── AmountInput        (editable)
    │
    ├── SwapButton (with divider)
    │
    └── CurrencyRow (to)
        ├── CurrencySelector
        │   ├── Flag
        │   └── ChevronDown
        ├── CurrencyDropdown   (conditionally rendered)
        └── AmountInput        (read-only, displays result)

RateDisplay (sibling of ConverterCard, sits below)
```

Each component is a thin functional component. State lives at the `App` level (or a single reducer); children receive props and emit events.

---

## 5. State Model

A single reducer at the `App` level holds all converter state. No context, no global store.

```ts
type ConverterState = {
  from: string;          // currency code, e.g. "USD"
  to: string;            // currency code, e.g. "SGD"
  amount: number;        // numeric value (commas stripped)
  amountInput: string;   // raw input string preserving user formatting
  result: number | null; // computed by backend; null while loading
  rate: number | null;   // indicative rate from backend
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
};

type ConverterAction =
  | { type: 'SET_FROM'; code: string }
  | { type: 'SET_TO'; code: string }
  | { type: 'SET_AMOUNT'; raw: string }
  | { type: 'SWAP' }
  | { type: 'CONVERT_START' }
  | { type: 'CONVERT_SUCCESS'; result: number; rate: number }
  | { type: 'CONVERT_ERROR'; message: string };
```

Currency list is held separately (it's loaded once and never changes during a session):

```ts
type CurrenciesState = {
  list: Currency[];
  status: 'idle' | 'loading' | 'success' | 'error';
};
```

---

## 6. Data Flow

### 6.1 App load
1. `App` mounts → `useCurrencies()` runs → `GET /api/currencies`.
2. On success, list is stored in component state and passed to both `CurrencyDropdown` instances.
3. Default pair is `USD → SGD` with `amount = 1000` (matching the Figma mockup default).
4. Initial conversion triggers via `useConvert()`.

### 6.2 User changes amount
1. `AmountInput.onChange` → reducer `SET_AMOUNT` (stores raw string + parsed number).
2. `useConvert()` debounces 250 ms → `GET /api/convert?from=&to=&amount=`.
3. Response → reducer `CONVERT_SUCCESS` → result and rate render.

### 6.3 User changes currency (either side)
1. User clicks selector → dropdown opens → user selects code.
2. Reducer `SET_FROM` or `SET_TO`.
3. `useConvert()` re-runs (no debounce — it's an explicit action).

### 6.4 User clicks swap
1. Reducer `SWAP` → `from` and `to` exchange. Amount stays as-is (user may type before result fades back in).
2. `useSwapAnimation()` orchestrates the 600 ms cross-fade and 180° spin (see §8).
3. `useConvert()` re-runs after the animation completes.

---

## 7. API Service Layer

A single typed wrapper in `src/services/api.ts`. It exists to centralise base URL, error parsing, and type safety.

```ts
// types/api.ts
export type Currency = { code: string; name: string };
export type ConvertResponse = {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
};
export type ApiError = {
  error: true;
  code: string;       // e.g. "INVALID_AMOUNT", "UNKNOWN_CURRENCY"
  message: string;
};
```

```ts
// services/api.ts (sketch)
const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getCurrencies: () => request<{ currencies: Currency[] }>('/currencies'),
  convert: (from: string, to: string, amount: number) =>
    request<ConvertResponse>(
      `/convert?from=${from}&to=${to}&amount=${amount}`
    ),
};
```

**Environment variables consumed:**
| Variable                | Default  | Purpose                           |
|-------------------------|----------|-----------------------------------|
| `VITE_API_BASE_URL`     | `/api`   | Backend base URL (proxied in dev) |

In dev, Vite proxies `/api` to `http://localhost:8800` (see §11).

---

## 8. Animation System

Faithful to `uiux_guideline.md` §5. Implemented as classes added/removed by `useSwapAnimation()`.

### 8.1 Cross-fade timing
```
t=0ms    Add `.fade-out` to flag, code, amount, result on both rows
t=300ms  Animation guard releases enough to swap state
         Swap from/to in reducer
         Add `.fade-in` to the same elements
t=600ms  Remove all classes, release the animation guard
```

The two rows fade in unison — there's no per-row choreography. Static elements (row labels "Amount" / "Converted Amount") never animate.

### 8.2 Swap button spin
A 180° rotation in 600 ms with the Material standard ease curve. The `<svg>` icon is wrapped in a `<span>` that rotates — the button itself does not.

### 8.3 Animation guard
A `useRef<boolean>` prevents double-tap during the 600 ms window. Subsequent clicks are silently dropped until the animation completes.

---

## 9. Styling Approach

### 9.1 Tokens
Every design value is a CSS custom property in `src/styles/tokens.css`, taken verbatim from `uiux_guideline.md` §9.

### 9.2 Per-component CSS Modules
Each component has a co-located `.module.css` file. Selectors reference tokens, never hardcoded hex.

### 9.3 The page background
Set on `body` (or the root `App` div):
```css
background-color: #ffffff;
background-image: radial-gradient(
  ellipse at top left,
  #EAEAFE 0%,
  rgba(221, 246, 243, 0) 65%
);
```

### 9.4 Number formatting
Centralised in `utils/format.ts`:
- Amount input: commas inserted on the fly while typing, two decimals on blur.
- Converted result: `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- Indicative rate: four decimal places.

---

## 10. Error & Loading UX

| Condition                         | UI behaviour                                                  |
|-----------------------------------|---------------------------------------------------------------|
| Currencies list still loading     | Dropdowns disabled (chevron dimmed), default codes shown      |
| Currencies list fails to load     | Inline error text replaces subtitle; retry option             |
| Convert request in flight         | Result pill shows previous value; no spinner per design       |
| Convert returns 4xx               | Result cleared; small error line below the card               |
| Convert returns 5xx (incl. 502)   | Result cleared; "Service temporarily unavailable" message     |
| Network failure                   | Same as 5xx                                                   |

The design contains no spinners or skeletons; loading is intentionally invisible to keep the card calm.

---

## 11. Vite Configuration

```ts
// vite.config.ts (sketch)
export default defineConfig({
  plugins: [react()],
  envDir: './env',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8800',
        changeOrigin: true,
      },
    },
  },
});
```

This means in development the frontend calls `/api/...` paths and Vite proxies to the backend, avoiding any CORS configuration. The `envDir: './env'` setting tells Vite to load `.env*` files from `client/env/` instead of the project root.

---

## 12. Testing Strategy

Per the assignment's "unit test results" deliverable.

| Test type      | Tool                       | What we test                                                |
|----------------|----------------------------|-------------------------------------------------------------|
| Pure utils     | Vitest                     | `format.ts`, `currencyToCountry.ts`                         |
| Hooks          | Vitest + RTL               | `useConvert` debounce, `useSwapAnimation` timing            |
| Components     | Vitest + RTL               | `AmountInput` formatting, `CurrencyDropdown` open/close     |
| Integration    | Vitest + MSW (mock fetch)  | App loads → renders default conversion                      |

We do not test third-party libraries (`react-country-flag`, `lucide-react`).

---

## 13. Build & Output

`npm run build` produces a static bundle in `client/dist/`. The bundle is served by any static host or by the Docker compose setup (see `03-setup-and-docker.md`).

---

## 14. What This Doc Does NOT Cover

- Backend implementation → see `02-backend-architecture.md`
- Setup instructions → see `03-setup-and-docker.md`
- Per-screen behaviour and validation rules → see `04-functional-specification.md`
- Product goals and success criteria → see `05-product-requirements.md`
