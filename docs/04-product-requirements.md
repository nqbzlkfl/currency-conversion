# 05 — Product Requirements Document

> **Project:** Currency Converter
> **Audience:** Stakeholders, evaluators, and the development team. Describes *what* we are building and *why*.
> **Companion:** `04-functional-specification.md` covers the *how it behaves*.

---

## 1. Background

Currency conversion is a routine task for travellers, freelancers working with foreign clients, online shoppers comparing prices across regions, and anyone making cross-border financial decisions. Most existing converters fall into one of two categories: bulky financial tools with feature creep, or simple widgets buried inside larger products.

This project — built as a fullstack assignment using the Open Exchange Rates free tier — aims for the second category done well: a single-purpose, fast, beautifully designed converter that does one thing without distraction.

---

## 2. Problem Statement

A user needs to know, *right now*, what an amount in one currency is worth in another, with confidence that the rate is current. Existing solutions are either:
- Cluttered with charts, news, ads, and conversion history they didn't ask for, or
- Too simplistic, with stale rates or no indication of when the rate was last updated.

Users want: instant conversion, clearly stated rate, minimal interaction cost, no setup.

---

## 3. Goals

### 3.1 Product goals
1. **Instant clarity** — User sees the converted amount and the indicative rate within a single glance.
2. **Live data** — Conversions reflect rates fetched from Open Exchange Rates within the last hour.
3. **Minimal friction** — Default state shows a useful conversion (USD → SGD, 1,000) with no required input.
4. **Clean design** — Match the supplied Figma design exactly; no visual noise.

### 3.2 Engineering goals
1. **Proper architecture** — MVC separation on the backend, modular components on the frontend.
2. **Safe API consumption** — Cache aggressively to respect Open Exchange Rates' free-tier limits.
3. **Type safety end-to-end** — TypeScript on both sides; shared shapes in code documentation.
4. **Graceful failure** — Every error path produces a meaningful response, not a stack trace.

### 3.3 Non-goals (explicitly out of scope)
- User accounts, login, or saved preferences.
- Historical charts or trend analysis.
- Multi-currency baskets or batch conversions.
- Rate alerts or push notifications (despite what the subtitle copy suggests — that text is from the Figma source and is purely cosmetic for this iteration).
- Mobile native apps (web-only, though the design is mobile-first).
- Offline functionality.
- Internationalisation beyond English.

---

## 4. Target Users

### 4.1 Primary persona — "The traveller"
Someone planning or actively on a trip who needs to convert prices on the fly. Quick mental anchoring (e.g., "is 50 SGD a lot for lunch?") matters more than four-decimal precision.

### 4.2 Secondary persona — "The freelancer"
A remote worker invoicing a client in a different currency. Needs a defensible reference point for what the foreign-currency amount is worth in their home currency.

### 4.3 Out-of-persona
- Day traders and FX professionals (need historical data, charting, sub-second updates).
- Banks and businesses processing transactions (need licensed rate feeds, audit trails).

---

## 5. User Stories

| ID  | As a…       | I want to…                                | So that…                                              |
|-----|-------------|-------------------------------------------|-------------------------------------------------------|
| US1 | Visitor     | open the page and immediately see a working conversion | I can verify it works without input                  |
| US2 | Traveller   | type any amount in my home currency       | I can see what it's worth abroad                      |
| US3 | Traveller   | pick from a list of currencies            | I'm not limited to a hard-coded pair                  |
| US4 | Freelancer  | swap "from" and "to" with one tap         | I can see the inverse without retyping anything       |
| US5 | User        | see the indicative rate clearly           | I can sanity-check the converted amount               |
| US6 | User        | trust that the rate is current            | I'm not making decisions on stale data                |
| US7 | Developer   | call `/api/convert` directly              | I can integrate the conversion in another tool        |

Each user story maps to a feature in §6.

---

## 6. Features

### 6.1 In scope (this release)

| ID  | Feature                            | User stories | Priority |
|-----|------------------------------------|--------------|:--------:|
| F1  | Default conversion shown on load   | US1          | Must     |
| F2  | Editable amount with live update   | US2          | Must     |
| F3  | Currency dropdowns (both sides)    | US3          | Must     |
| F4  | Swap button with animation         | US4          | Must     |
| F5  | Indicative exchange rate display   | US5          | Must     |
| F6  | Live data via Open Exchange Rates  | US6          | Must     |
| F7  | Backend `/api/convert` endpoint    | US7          | Must     |
| F8  | Backend `/api/currencies` endpoint | US3, US7     | Must     |
| F9  | Backend `/api/rates` endpoint      | US7          | Should (bonus per assignment) |
| F10 | Server-side caching with TTL       | US6 (reliability) | Must |
| F11 | Integration tests                  | (engineering) | Should (bonus per assignment) |
| F12 | Docker setup                       | (deployment)  | Could (scope addition)       |

### 6.2 Out of scope (this release)

| Feature                            | Why deferred                                          |
|------------------------------------|-------------------------------------------------------|
| User accounts                      | Not needed for the core task                          |
| Rate alerts                        | Requires persistence and notifications infrastructure |
| Historical rates / charts          | Requires paid OXR plan                                |
| Custom base currency               | Requires paid OXR plan                                |
| Cloud deployment                   | Out of agreed assignment scope                        |
| Performance benchmarking           | Single-page app at this scale doesn't require it      |

---

## 7. Functional Requirements

### 7.1 Frontend
- **FR-FE-01** The page renders correctly on viewports from 360 px to 1920 px wide without breakpoint-specific layouts.
- **FR-FE-02** The page loads and displays a working default conversion within 2 seconds on a typical broadband connection.
- **FR-FE-03** Typing in the amount input triggers a converted value within 250 ms of stopping.
- **FR-FE-04** Selecting a currency triggers a converted value within ~200 ms.
- **FR-FE-05** The swap interaction visually completes in exactly 600 ms regardless of input speed.
- **FR-FE-06** The page must function fully via keyboard (Tab, Enter/Space, Escape).

### 7.2 Backend
- **FR-BE-01** `/api/convert` returns a correctly calculated result for any pair of supported currencies.
- **FR-BE-02** Calculations use the most recently cached rates; cache is refreshed at most once per hour.
- **FR-BE-03** Concurrent requests during a cache miss produce exactly one upstream OXR fetch.
- **FR-BE-04** All endpoints respond in JSON with the documented shape.
- **FR-BE-05** All error conditions return an appropriate HTTP status and a structured error body.
- **FR-BE-06** The server starts cleanly given a valid `OXR_APP_ID` and refuses to start without one.

### 7.3 Integration
- **FR-INT-01** The frontend never calls Open Exchange Rates directly; all upstream traffic goes through the backend.
- **FR-INT-02** The frontend's currency list is sourced exclusively from `/api/currencies`.

---

## 8. Non-Functional Requirements

| Category              | Requirement                                                              |
|-----------------------|--------------------------------------------------------------------------|
| **Code quality**      | Adheres to `Code_Standard`: DRY, YAGNI, MVC, no unnecessary deps          |
| **Type safety**       | TypeScript on both client and server with `strict: true`                  |
| **Testing**           | Unit tests for pure logic; integration tests for endpoints                |
| **Reliability**       | Cache must survive concurrent traffic without duplicate upstream calls    |
| **Observability**     | Server logs cache hits/misses and all error paths                         |
| **Security**          | OXR App ID never exposed to the client; never logged                      |
| **Maintainability**   | Folder structure mirrors responsibilities (`controllers/`, `services/`)   |
| **Performance**       | Cache hits respond in <50 ms locally; cache misses bounded by OXR latency |
| **Browser support**   | Latest Chrome, Firefox, Safari, Edge. No IE                               |

We deliberately do not state SLA-style targets (uptime %, latency p99) because there's no production deployment.

---

## 9. Constraints

### 9.1 Technical constraints
- **Open Exchange Rates free tier:** base currency is locked to USD; we cannot use the native `/convert` endpoint; monthly request quota applies.
- **Node 22+:** required by assignment.
- **TypeScript:** required by assignment.
- **MVC structure:** required by assignment.
- **No persistent storage** beyond in-memory cache.

### 9.2 Design constraints
- The visual design is fixed by `uiux_guideline.md` and the Figma source. No deviation without sign-off.
- Mobile-first: card width is 390 px and does not change on desktop.

### 9.3 Operational constraints
- Single developer, short timeline (assignment context).
- AI assistance is permitted; significant prompts will be logged in the README per assignment policy.

---

## 10. Assumptions

1. The supplied OXR App ID (`aa141bebf0c24253a6a89a9f9591c0d9`) remains valid and within quota for the duration of evaluation.
2. Evaluators have Node 22 (or Docker) available locally.
3. Network access to `openexchangerates.org` is unrestricted at evaluation time.
4. The currency list returned by OXR is stable enough that a 24-hour cache is acceptable.
5. Two-decimal precision on the result is acceptable (per assignment: "precision is secondary to functional implementation").

---

## 11. Dependencies

### 11.1 External services
- **Open Exchange Rates** (https://openexchangerates.org) — sole source of currency rates and currency metadata.

### 11.2 External libraries (frontend)
- React, react-dom (framework)
- react-country-flag (specified by design system)
- lucide-react (specified by design system, only `ChevronDown`)

### 11.3 External libraries (backend)
- Express, cors, dotenv (web server + env loading)

### 11.4 Tooling
- Vite, TypeScript, Vitest, supertest, tsx

No other runtime dependencies. The Code Standard explicitly forbids unnecessary additions.

---

## 12. Success Criteria

The release is successful when:

| Criterion                                                              | Measurable by                                          |
|------------------------------------------------------------------------|--------------------------------------------------------|
| All "Must" features (§6.1) are implemented                              | Acceptance criteria in `04-functional-specification.md` §9 pass |
| Visual implementation matches Figma source                             | Side-by-side comparison; QA sign-off                  |
| Backend endpoints return documented shapes for all documented inputs    | Integration tests pass                                |
| Server respects OXR rate limits via caching                            | Logs show cache hits dominate cache misses            |
| Unit tests cover services and utilities                                 | `npm test` reports passing in both client and server  |
| Code follows the agreed structure                                       | Code review against `01-` and `02-`                   |

---

## 13. Risks & Mitigations

| Risk                                                          | Likelihood | Impact | Mitigation                                          |
|---------------------------------------------------------------|:----------:|:------:|----------------------------------------------------|
| OXR free-tier quota exhausted during evaluation               | Low        | High   | Aggressive caching (60 min); single-flight pattern; documented `429` handling |
| OXR adds/removes a currency we hardcoded a flag for            | Medium     | Low    | Frontend uses `/api/currencies` as source of truth; unknown codes get a fallback flag |
| Network instability during demo                               | Low        | Medium | Cache continues to serve until expiry even if upstream blips |
| Browser rejects mixed-content (HTTPS frontend → HTTP backend) | Low        | Low    | Same-origin via Vite proxy in dev, nginx proxy in Docker  |
| Floating-point precision artefacts                             | Low        | Low    | Per assignment, precision is secondary; we display 2 decimals via `toLocaleString` |
| Scope creep                                                    | Medium     | Medium | This document; explicit out-of-scope list (§3.3, §6.2)    |

---

## 14. Open Questions

None at the time of writing. All decisions made during planning are documented in this set of files. Future iterations should append to this section as questions arise.

---

## 15. Document History

| Version | Date         | Notes                                                  |
|---------|--------------|--------------------------------------------------------|
| 1.0     | 2026-04-30   | Initial draft based on agreed plan and locked decisions |

---

## 16. Related Documents

- `01-frontend-architecture.md` — frontend structure, state model, data flow
- `02-backend-architecture.md` — backend structure, API contract, caching
- `03-setup-and-docker.md` — how to run, test, and containerise
- `04-functional-specification.md` — element-by-element behaviour and acceptance criteria
- Source assets: `Code_Standard`, `Open_Exchange_Rates_API_`, `uiux_guideline.md`, `UI.pdf`, the assignment PDF
