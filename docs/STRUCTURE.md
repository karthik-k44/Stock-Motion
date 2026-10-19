# Project Structure & Conventions

How StockMotion is organised and the rules new features follow. Most are enforced by `tsc` or ESLint; the rest are noted as review-only.

## Top level

```
src/
├── backend/               # Express API + Postgres (Node only, never imported by the browser)
│   ├── app.ts              # express app wiring (API only)
│   ├── server.ts           # entry point: db, migrations, seed, socket.io, Vite (dev) or dist/ (prod)
│   ├── common/             # errors/, services/audit.ts (activity + stock ledger), types/, utils/
│   ├── config/             # env.ts (zod-validated), logger.ts
│   ├── db/                 # client.ts, migrate.ts, seed.ts, seed-data.ts, schema/ (row types, one file per table + index.ts), migrations/ (*.sql)
│   ├── middleware/         # auth, rate-limit, error, not-found — each `<name>.middleware.ts`
│   ├── modules/<domain>/   # users, items, orders, deliveries, locations, activity, dashboard, system
│   ├── realtime/           # socket.io server (`data:changed` broadcasts)
│   ├── tests/              # vitest integration tests (in-memory Postgres)
│   └── types/              # backend domain types, one file per domain + index.ts barrel
└── frontend/               # React 19 + Vite + React Query
    ├── components/          # shared UI (button/, card/, form/, modal/, drawer/, toast/, layout/, …)
    ├── config/              # paths.ts, navigation.ts, router.tsx (lazy routes + app root)
    ├── features/<feature>/  # warehouse, dashboard, inventory, orders, deliveries, locations, activity, users, system, not-found
    ├── hooks/               # cross-cutting hooks (use-realtime, use-item-drawer, use-motion, use-overlay, …)
    ├── lib/                 # helpers with no domain meaning (utils.ts: Cn, Clamp; motion-preference.ts)
    ├── providers/           # query-client, AppProviders
    ├── services/            # request.ts, api.ts, api-error.ts, session-state.ts, socket.ts, type.ts
    ├── styles/              # plain CSS, split by area
    ├── types/               # app-wide types (MotionPreferenceTypeEnum)
    └── utils/               # domain helpers shared across features (format.ts, humanize.ts, category.ts)
```

## Frontend feature anatomy

```
features/<feature>/
├── components/        # one component per file
├── <Feature>.tsx      # the page (no index.tsx, no -page suffix)
├── lib/               # pure helpers/presets for this feature (optional)
├── services/          # API calls + React Query hooks, one file per resource, plus index.ts barrel
└── types/             # domain types + zod schemas, plus index.ts barrel
```

No `pages/` or `hooks/` folder inside a feature. Features with nothing to fetch (`not-found`) have no `services/` or `types/`.

**Files stay under ~200 lines** (review-only). Split filter bars, tables, form groups and stat cards into `components/`.

### Service objects

Each `services/<resource>-service.ts` exports exactly one object — `inventoryService`, `ordersService`, `deliveriesService`, … — holding:

- raw requests as PascalCase verbs (`ListItems`, `AdjustStock`, `ReceiveDelivery`) built on the verb helpers in `@/frontend/services/request` — never `httpClient` directly;
- a `keys` factory whose first segment is the resource name (`['items', …]`), with `listPrefix` for prefix invalidation;
- `useXxx` query hooks and `useXxxMutation` mutation hooks. Mutations invalidate in `onSuccess` and raise a toast via `ToastManager`.

Stock changes touch several screens, so `inventoryService.InvalidateStock(qc)` refreshes items, locations, dashboard and activity in one call; order and delivery mutations use it too.

There is no `ApiResponse<T>` envelope; the API returns resources directly. Errors are `{ error: { code, message, details } }` and surface as `ApiError`.

## Types

Frontend and backend keep **separate, duplicated** domain types (`src/backend/types/item.ts` ↔ `src/frontend/features/inventory/types/item-type.ts`). Change both copies together. Each feature type file ends with a `T<Feature>Type` bundle.

`erasableSyntaxOnly` and `verbatimModuleSyntax` are on: no TypeScript `enum` (use a const object plus a same-named type) and use `import type` for types.

## Import rules

- Never import a barrel from inside that barrel's own subtree.
- No import cycles (`import-x/no-cycle`), no self-imports, no duplicate imports.
- The frontend never imports `@/backend/**` (`no-restricted-imports`).
- Relative imports inside a feature, `@/frontend/features/<other>/…` across features.

## Backend module anatomy

```
modules/<domain>/
├── <domain>.service.ts       # business logic + SQL, exported as one `<domain>Service` object
├── <domain>.validators.ts    # zod schemas
├── <domain>.mapper.ts        # row → response, only when shared (items, deliveries, activity)
└── rest-api/<domain>.controller.ts, <domain>.routes.ts
```

Writes run in a transaction, take row locks (`FOR UPDATE`) on the stock they touch, record an `activity` row (and `movements` rows for stock changes) through `common/services/audit.ts`, and then call `BroadcastChange(resources, activity)` after commit.

## Before pushing

```
npx tsc -b --noEmit && npx eslint src && npx vitest run && npm run build
```

## Known deviations

- **`features/warehouse/lib/truck-store.ts` and `crew-store.ts`** are module-level client stores, not data services. They hold the Dock 1 arrival sequence and the crew simulation: synchronous client state with no HTTP. Other features read them (Deliveries starts the truck), and two always-mounted components drive them (`TruckSequenceRunner`, `CrewDirector`, rendered from `config/router.tsx`). The HTTP calls the sequence needs go through `deliveriesService` mutations inside the runner.
- **No authentication.** `middleware/auth.middleware.ts` validates an `x-user-id` "acting as" header against the users table so that changes are attributed. Replace it before exposing this beyond a demo.
- **No Formik.** The few forms validate with the feature's zod schema (`safeParse`) directly; the server validates again.
- **Database driver.** `db/client.ts` speaks to real Postgres when `DATABASE_URL` is set, and otherwise to embedded Postgres (PGlite). Migrations are plain SQL files, and `db/schema/` holds row types rather than an ORM schema.
- **`useAdjustStockMutation` has no error toast.** The adjust dialog shows server errors inline next to the fields, so a toast would duplicate the message.
