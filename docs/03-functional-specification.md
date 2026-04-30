# 04 — Functional Specification Document

> **Project:** Currency Converter
> **Audience:** Developers and QA. Describes *how the system behaves*, not why it exists.
> **Companion:** `05-product-requirements.md` covers the *what* and *why*.

---

## 1. Scope of This Document

This document specifies, for every interactive element and every endpoint:
- Inputs accepted
- Validation rules
- Outputs produced
- Error states
- Acceptance criteria

It does not cover code structure (see `01-` and `02-`) or product rationale (see `05-`).

---

## 2. System Overview

A single-page web app with one screen. The user picks two currencies and an amount; the app shows the converted amount and the indicative exchange rate. All conversion math runs on the backend using cached rates from Open Exchange Rates.

There is exactly one screen. There are no tabs, modals, settings, or navigation.

---

## 3. The Single Screen — Element Inventory

```
┌────────────────────────────────────────┐
│  Currency Converter                    │ ← H1 title
│  Check live rates, set rate alerts,    │ ← subtitle (static)
│  receive notifications and more.       │
│                                        │
│  ┌──────────────────────────────────┐  │ ← card
│  │ Amount                           │  │ ← row label (static)
│  │ ┌──────┐ ┌────────────────────┐  │  │
│  │ │ FROM │ │ amount input       │  │  │ ← row 1
│  │ └──────┘ └────────────────────┘  │  │
│  │ ──────────  (●)  ────────────    │  │ ← divider + swap button
│  │ Converted Amount                 │  │ ← row label (static)
│  │ ┌──────┐ ┌────────────────────┐  │  │
│  │ │ TO   │ │ result output      │  │  │ ← row 2
│  │ └──────┘ └────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│  Indicative Exchange Rate              │ ← rate label (static)
│  1 USD = 1.3600 SGD                    │ ← rate value (dynamic)
└────────────────────────────────────────┘
```

| ID  | Element              | Type                | Interactive? |
|-----|----------------------|---------------------|:------------:|
| E1  | Page title           | Static text         | No           |
| E2  | Page subtitle        | Static text         | No           |
| E3  | "Amount" label       | Static text         | No           |
| E4  | From currency selector | Button + dropdown | Yes          |
| E5  | Amount input         | Text input          | Yes          |
| E6  | Divider line         | Visual              | No           |
| E7  | Swap button          | Button              | Yes          |
| E8  | "Converted Amount" label | Static text     | No           |
| E9  | To currency selector | Button + dropdown   | Yes          |
| E10 | Result output        | Read-only text      | No           |
| E11 | "Indicative Exchange Rate" label | Static text | No        |
| E12 | Rate value           | Dynamic text        | No           |

---

## 4. Initial State (on app load)

| State                 | Value                                              |
|-----------------------|----------------------------------------------------|
| `from`                | `USD`                                              |
| `to`                  | `SGD`                                              |
| `amount`              | `1000`                                             |
| `amount input display`| `1,000.00`                                         |
| `result display`      | computed result of converting 1000 USD → SGD       |
| `rate value`          | `1 USD = X.XXXX SGD` where X.XXXX is the live rate |
| `currencies list`     | populated from `GET /api/currencies`               |

If `GET /api/currencies` fails on initial load:
- Default codes still show in selectors (USD/SGD), but selectors are disabled.
- Subtitle is replaced with: `Unable to load currencies. Please refresh.`

If the initial conversion fails:
- Result output shows an empty pill.
- Rate value shows: `Rate unavailable`.

---

## 5. Element Specifications

### E4 / E9 — Currency Selector

#### Trigger button (closed state)
- Display: 44 px circular flag, 18 px bold uppercase code, 16 px chevron-down icon.
- Width: occupies left half of its row (50% — 8 px gap).
- Click: opens the dropdown panel.
- Keyboard: `Enter` or `Space` opens the dropdown.

#### Dropdown panel (open state)
- Anchored 8 px below the trigger, left-aligned to the trigger.
- Min width 280 px, max height 280 px, scrollable if list exceeds.
- Lists every currency from `currencies` state.
- Each row: 28 px circular flag, 15 px code, 13 px full name (truncated with ellipsis).
- The currently selected currency: bolded code, subtle background `#F9FAFB`, optional check indicator.
- Hover row: background `#F9FAFB`.
- Chevron on the trigger rotates 180° while open.

#### Selection
- Click a row → row's currency code becomes the new value for that side (`from` or `to`).
- Dropdown closes.
- Conversion re-runs immediately (no debounce).

#### Dismissal
- Click outside the panel → close, no selection.
- Press `Escape` → close, no selection.
- Open the *other* selector → first one closes.

#### Validation
- The dropdown only contains codes returned by `/api/currencies`. There is no free-text input. Therefore selection cannot fail validation client-side.

#### Edge cases
- If user picks the same code on both sides (e.g. `from = USD`, then picks `to = USD`): allowed. Result equals input amount; rate equals `1.0000`.

---

### E5 — Amount Input

#### Display rules
| Event           | Behaviour                                                        |
|-----------------|------------------------------------------------------------------|
| Initial render  | Shows `1,000.00`                                                 |
| User types      | Strips non-numeric (except one `.`), inserts thousands commas    |
| User pastes     | Same as typing — sanitised on the fly                            |
| Blur            | Reformats to two decimals, e.g. `1000` → `1,000.00`              |
| Focus           | No reformat; cursor preserved                                    |

#### Accepted characters
Digits `0-9` and a single decimal point `.`.  All other characters are silently dropped.

#### Validation rules
| Rule                              | Behaviour                                                     |
|-----------------------------------|---------------------------------------------------------------|
| Empty string                      | Treated as `0`. Result = `0.00`. Rate still shown.            |
| Multiple decimal points           | Only the first is kept; subsequent are dropped during input   |
| Decimal places > 2 on blur        | Truncated to 2 (no rounding-up beyond two places shown)       |
| Negative sign                     | Disallowed — typed `-` is dropped                             |
| Leading zeros (`0001000`)         | Cleaned on blur to `1,000.00`                                 |
| Value exceeds JS Number precision | Practical max ≈ 1e15. Beyond that, behaviour undefined; not a target use case |

#### Triggering conversion
- Every keystroke schedules a debounced (250 ms) call to `GET /api/convert`.
- If the user types fast, only the final state hits the API.
- Currency-selector changes call `/api/convert` immediately (no debounce).

---

### E7 — Swap Button

#### Visual
- 44 × 44 px circle, fill `#1F2261`, drop shadow.
- Centred on the divider line, vertically aligned with it.
- Custom SVG icon (two staggered arrows) per `uiux_guideline.md` §6.

#### Click behaviour (timing locked at 600 ms total)

```
t=0ms     Begin: lock animation guard
          Apply .fade-out to: from-flag, to-flag, from-code, to-code,
                              amount input, result output
          Apply .spin-180 to the swap-icon wrapper
t=300ms   Swap from/to in state
          Re-render flags and codes (now invisible)
          Replace .fade-out with .fade-in on the same six elements
          Re-fetch conversion (now reflects new direction)
t=600ms   Remove .fade-in and .spin-180
          Release animation guard
```

Static elements (row labels) never animate.

#### Re-entrance protection
While the animation is running, additional clicks on the swap button are ignored. A `useRef<boolean>` guard handles this; no debouncing needed.

#### Keyboard
- `Tab` focuses the button.
- `Enter` or `Space` triggers the swap.

#### What happens to the amount on swap
The numeric amount stays the same. The "from" and "to" currencies swap. The result becomes the new amount-equivalent in the new direction. (Example: `1000 USD → 1360 SGD`. After swap: `1000 SGD → 735.29 USD`.)

---

### E10 — Result Output

- Visually identical pill to the amount input (grey background, rounded, right-aligned).
- `readonly` attribute on the underlying input element.
- Cursor: `default` (not text I-beam).
- Updates whenever conversion succeeds.
- During an in-flight conversion the previous value remains visible (no spinner per design).
- On error the pill is cleared (empty value).

---

### E12 — Rate Value

Format: `1 {FROM} = {RATE} {TO}` where `{RATE}` is the indicative rate to **four decimal places**.

Examples:
- `1 USD = 1.3600 SGD`
- `1 SGD = 0.7353 USD`
- `1 EUR = 1.0857 USD`

If conversion is in error state, the rate value shows `Rate unavailable`.

---

## 6. Backend Endpoint Behaviour

### 6.1 GET /api/health

| Aspect       | Specification                                       |
|--------------|-----------------------------------------------------|
| Request      | No params                                           |
| Response 200 | `{ "status": "ok", "uptime": <seconds since start> }` |
| Errors       | None expected; any failure → 500                    |

### 6.2 GET /api/currencies

| Aspect       | Specification                                          |
|--------------|--------------------------------------------------------|
| Request      | No params                                              |
| Response 200 | `{ "currencies": [{ "code", "name" }, ...] }` sorted alphabetically by code |
| Behaviour    | Returns the **intersection** of OXR `currencies.json` and `latest.json` rates so the frontend never offers a code that fails to convert |
| Cache        | 24 h TTL (configurable)                                |
| Errors       | 502 `UPSTREAM_FAILURE`, 502 `UPSTREAM_RATE_LIMIT`, 500 |

### 6.3 GET /api/rates

| Aspect       | Specification                                          |
|--------------|--------------------------------------------------------|
| Request      | No params                                              |
| Response 200 | `{ "base", "timestamp", "rates": { ... } }` (passes through OXR shape, base always `USD`) |
| Cache        | 60 min TTL (configurable)                              |
| Errors       | 502, 500                                               |

### 6.4 GET /api/convert

| Aspect       | Specification                                          |
|--------------|--------------------------------------------------------|
| Required params | `from`, `to`, `amount`                              |
| Validation   | `from`, `to`: 3 letters, uppercased server-side, must exist in cached rates. `amount`: finite, ≥ 0. |
| Response 200 | `{ "from", "to", "amount", "result", "rate", "timestamp" }` |
| Math         | `result = amount × (rates[to] / rates[from])`          |
| Errors       | See §6.5 below                                         |

### 6.5 Error matrix

| Scenario                                    | HTTP | `code`                | `message` example                                  |
|---------------------------------------------|:----:|-----------------------|----------------------------------------------------|
| `from` missing                              | 400  | `MISSING_PARAM`       | `from is required`                                 |
| `to` missing                                | 400  | `MISSING_PARAM`       | `to is required`                                   |
| `amount` missing                            | 400  | `MISSING_PARAM`       | `amount is required`                               |
| `from = "us"` (not 3 letters)               | 400  | `INVALID_CURRENCY`    | `from must be a 3-letter currency code`            |
| `to = "1234"`                               | 400  | `INVALID_CURRENCY`    | `to must be a 3-letter currency code`              |
| `amount = "abc"`                            | 400  | `INVALID_AMOUNT`      | `amount must be a finite number`                   |
| `amount = -50`                              | 400  | `INVALID_AMOUNT`      | `amount must be non-negative`                      |
| `from = "ZZZ"` (valid format, not in rates) | 404  | `UNKNOWN_CURRENCY`    | `Currency ZZZ is not supported`                    |
| OXR returns 429                             | 502  | `UPSTREAM_RATE_LIMIT` | `Rate limit exceeded; please try again later`      |
| OXR returns 5xx / network error             | 502  | `UPSTREAM_FAILURE`    | `Unable to fetch rates`                            |
| Unexpected exception                        | 500  | `INTERNAL_ERROR`      | `An unexpected error occurred`                     |

All error responses share the shape:
```json
{ "error": true, "code": "<CODE>", "message": "<human-readable>" }
```

---

## 7. Caching Behaviour (observable from outside)

| Cache key         | TTL        | First request          | Subsequent (within TTL) |
|-------------------|------------|------------------------|-------------------------|
| `oxr:currencies`  | 24 h       | Fetches OXR upstream   | Returns cached         |
| `oxr:rates`       | 60 min     | Fetches OXR upstream   | Returns cached         |

Single-flight: if N requests for the same key arrive while a fetch is already in flight, only **one** upstream fetch occurs. All N callers receive the same result.

---

## 8. Animation Specification (locked)

Per `uiux_guideline.md` §5, restated here for completeness.

### 8.1 Cross-fade

```css
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
```
Each direction: 300 ms, ease, forwards.

### 8.2 Swap spin

```css
@keyframes spin180 {
  from { transform: rotate(0deg); }
  to   { transform: rotate(180deg); }
}
```
Duration: 600 ms, easing: `cubic-bezier(0.4, 0, 0.2, 1)`, forwards.

### 8.3 Chevron rotation

The chevron in the open trigger rotates 180° in 200 ms ease.

### 8.4 No other animations

No transitions on hover beyond browser defaults. No skeleton shimmers. No spinners. The card never moves or scales.

---

## 9. Acceptance Criteria

A feature is complete when **all** of the following pass.

### 9.1 Visual fidelity
- [ ] Page background shows the lavender bloom from top-left, fading to white by 65%.
- [ ] Card width is exactly 390 px on mobile.
- [ ] Card centres on viewports wider than 390 px without layout shift.
- [ ] Title is 26 px / 700, subtitle is 14 px / 400, both Roboto.
- [ ] Currency code in the trigger is 18 px / 700.
- [ ] Amount and result use 18 px / 600, right-aligned, on a `#F2F3F5` pill with 12 px radius.
- [ ] Swap button is exactly 44 × 44 px, `#1F2261`, with the specified drop shadow.
- [ ] Indicative rate sits 28 px below the card, slightly inset.

### 9.2 Functional behaviour
- [ ] Default load shows USD/SGD with `1,000.00` and a non-zero result.
- [ ] Typing in the amount input updates the result within 250 ms after typing stops.
- [ ] Selecting a different currency in either dropdown updates the result within ~200 ms (no debounce).
- [ ] Swap exchanges from/to and produces the correct inverse rate.
- [ ] After swap, indicative rate displays in the new direction (e.g. "1 SGD = 0.7353 USD").

### 9.3 Validation & errors
- [ ] Calling `/api/convert` with missing param returns 400 + correct `code`.
- [ ] Calling with `amount=-50` returns 400 `INVALID_AMOUNT`.
- [ ] Calling with `from=ZZZ` returns 404 `UNKNOWN_CURRENCY`.
- [ ] Frontend shows error UI when backend returns 4xx or 5xx.

### 9.4 Caching
- [ ] First request to `/api/rates` triggers an upstream OXR fetch.
- [ ] Subsequent request within 60 min returns cached data without fetching upstream.
- [ ] After clearing the cache (server restart), upstream fetch happens again.
- [ ] 10 concurrent requests during a cache miss result in exactly 1 upstream fetch.

### 9.5 Accessibility
- [ ] All interactive elements are reachable by `Tab`.
- [ ] Selectors open with `Enter` or `Space`.
- [ ] Dropdown closes on `Escape`.
- [ ] Visible focus ring on all interactive elements.
- [ ] Amount input has `inputmode="decimal"` (mobile numeric keypad).

### 9.6 Tests
- [ ] All unit tests pass (`npm test` in `server/` and `client/`).
- [ ] All integration tests pass.
- [ ] No real network calls during tests.

---

## 10. What This Doc Does NOT Cover

- Why this app exists / who it's for → see `05-product-requirements.md`
- Code organisation → see `01-` and `02-`
- How to run it → see `03-`
