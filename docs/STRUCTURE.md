# Project Structure & Conventions

How StockMotion is organised and the rules new features follow. Most are enforced by `tsc` or ESLint; the rest are noted as review-only.

## Top level

```
src/
├── backend/               # Express API + Postgres (Node only, never imported by the browser)
│   ├── app.ts              # express app wiring: public routes, then /businesses/:businessId/* behind RequireAuth + RequireBusinessRole
│   ├── server.ts           # entry point: db, migrations, dev seed, socket.io, Vite (dev) or dist/ (prod)
│   ├── common/             # errors/, services/audit.ts (activity + stock ledger), types/, utils/ (jwt, crypto, csv, cookies …)
│   ├── config/             # env.ts (zod-validated), logger.ts
│   ├── db/                 # client.ts, migrate.ts, seed.ts, next-number.ts, schema/ (row types, one file per table group + index.ts), migrations/ (*.sql)
│   ├── middleware/         # auth, rate-limit, error, not-found — each `<name>.middleware.ts`
│   ├── modules/<domain>/   # auth, businesses, invites, templates, items, categories, locations, suppliers, customers,
│   │                       # orders, deliveries, imports, activity, dashboard, system
│   ├── realtime/           # socket.io server: token-authenticated, one room per business
│   ├── tests/              # vitest integration tests (in-memory Postgres)
│   └── types/              # backend domain types, one file per domain + index.ts barrel
└── frontend/               # React 19 + Vite + React Query + Tailwind CSS v4 + shadcn/ui
    ├── components/          # shared UI (button/, card/, form/, modal/, drawer/, toast/, layout/, …)
    ├── config/              # paths.ts, navigation.ts (built from the template's labels), router.tsx
    ├── features/<feature>/  # landing, auth, onboarding, shell, businesses, world, dashboard, inventory, orders, deliveries,
    │                        # locations, customers, suppliers, team, settings, activity, system, not-found
    ├── hooks/               # cross-cutting hooks (use-realtime, use-connection, use-item-drawer, use-motion, …)
    ├── lib/                 # helpers with no domain meaning (utils.ts, form.ts, motion-preference.ts)
    ├── providers/           # query-client, AppProviders
    ├── services/            # request.ts (Get/Post… and Biz.*), api.ts, token-store.ts, session-state.ts, optimistic.ts, socket.ts
    ├── styles/              # index.css (the one entry: Tailwind layers + theme tokens) and the legacy CSS, split by area
    ├── types/               # app-wide types (MotionPreferenceTypeEnum)
    └── utils/               # domain helpers shared across features (format.ts, humanize.ts, category.ts)
```

## Business templates

A business type (retail, café, trades) is a **template**: plain config in `src/backend/modules/templates/definitions/*.ts`. A template holds:
- the business's vocabulary (`labels`: Products / Ingredients / Materials, Sales orders / Tickets / Jobs …);
- the **order flow**: stages with the flags `reserves`, `consumeLines`, `consumeOnEnter`, `requiresAllDone` and `closed`;
- the staff roles, the default categories and units;
- the storage zones (levels × bins), from which locations are generated;
- sample data.

Services read those flags; they never hard-code a status such as `'PICKING'`. The API returns the template with the business (`GET /api/businesses/:id`), and the frontend words every screen from it. **Add a business type** by adding a definition file, its world layout in `features/world/lib/`, and its enum value in both type copies.

## Multi-business tenancy

- Every operational table has `business_id`. Business routes are mounted at `/api/businesses/:businessId/…` behind `RequireAuth` + `RequireBusinessRole()`.
- That middleware resolves `req.scope = { businessId, template, actor }`. Every service takes the `ScopeType` and every repository query filters by `business_id`.
- Non-members get **404**, not 403, so business ids can't be probed.
- Narrow a route further with `RequireRole(...MANAGEMENT_ROLES)` (owner / manager).
- `BroadcastChange(businessId, resources, activity)` emits only to that business's socket room.
- On the frontend, `session-state.ts` holds the current business id and `Biz.Get/Post/…` prefix it.
- Switching business (`businessesService.SelectBusiness`) drops every business-scoped query.
- `BusinessGate` provides the loaded business through context, keyed by id, so screens remount on a switch. Read it with `businessesService.useBusiness()`.

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

Each `services/<resource>-service.ts` exports exactly one object (`inventoryService`, `ordersService`, `deliveriesService` …) holding:

- raw requests as PascalCase verbs (`ListItems`, `AdjustStock`, `ReceiveDelivery`), built on `Biz.*` from `@/frontend/services/request` for business data (never `httpClient` directly);
- a `keys` factory whose first segment is the **realtime resource name** (`['items', …]`, `['members', …]`), so a `data:changed` event refreshes exactly the right queries;
- `useXxx` query hooks and `useXxxMutation` mutation hooks.

### Optimistic mutations

Every mutation goes through `useOptimisticMutation` (`services/optimistic.ts`):
- `optimistic(vars)` returns cache patches applied at once (`PatchWhere` patches a record in lists and details alike);
- a server refusal restores the exact previous cache entries and toasts `errorTitle`;
- `invalidate` keys are always re-fetched once the server has answered.

Predictions mirror the server's rules in pure helpers (`inventory/lib/stock-math.ts`, `orders/lib/order-flow.ts` `PredictAdvance` / `PredictConsume`), so the screen rarely has to correct itself. Pass `quietError` only when the screen shows the error itself (forms, the order shortage panel).

There is no `ApiResponse<T>` envelope; the API returns resources directly. Errors are `{ error: { code, message, details } }` and surface as `ApiError`.

## UI: Tailwind, shadcn/ui and the theme

- **One stylesheet entry**, `styles/index.css`. Cascade layers decide who wins: `theme` (tokens) → `base` (a reset for shadcn elements only) → `components` (the older CSS files) → `utilities` (Tailwind). So a Tailwind class always beats component CSS. Tailwind's global preflight is not loaded; `base.css` is the reset the older screens rely on.
- **Theme**: orange (`#ff7900`, `primary-500`) and white. It carries near-black text (`primary-foreground`), never white. Orange text on white uses `primary-700`+. Status tones: `success`, `warning`, `danger`, `info` (orange), `reserved`, `incoming`, `neutral`. shadcn's semantic names (`primary`, `muted`, `ring` …) map onto the same palette. Muted *text* is `text-muted-foreground`.
- **shadcn/ui** lives in `components/ui/` (generated, then converted to arrow functions). The app's own `Button`, `Card`, `Badge`, `Select` and `ProgressBar` wrap it and keep their old props. `npx shadcn add <name>` works, but check the result: the CLI has imported `cn` from a package called "cn" instead of `@/frontend/lib/utils`.
- **Text**: every piece of text uses `<Text variant tone weight>` (`components/text`) instead of its own sizes. Marketing pages use the `banner` / `hero` / `section` / `feature` / `lead` variants (Inter, on the reference scale).
- **`Cn`** merges classes with tailwind-merge, so a `className` override replaces a conflicting class.
- **Arrow functions everywhere** (`const Foo = () => …`). ESLint enforces it (`func-style`, `prefer-arrow-callback`, no function expressions); class methods are the only exception.

## Marketing pages

`features/landing` holds the public pages — `Landing.tsx` (`/`), `Features.tsx` (`/features`), `Pricing.tsx` (`/pricing`) and `Faq.tsx` (`/faq`) — as children of one layout route, `MarketingLayout.tsx` (navbar, footer, scroll restoration). They follow `docs/design/style-reference.md` — the palette is scoped to `.landing` in `styles/landing.css`, so the app keeps its own.
- **Copy and plans** live in `lib/landing-content.ts` and `lib/pricing-content.ts`; components only lay them out. Nothing there is invented: features are real, prices are the owner's, there are no fake customer logos or counts.
- **Hero:** the pitch on the left, the scenario illustrations on the right in `components/ui/depth-carousel` (cards stacked back in 3D, eased by GSAP; drag, horizontal wheel, arrow keys, arrows and dots; follows the app's motion setting). Styles in `styles/depth-carousel.css`.
- **Illustrations:** `scripts/illustrations/` draws each scenario with the live world's isometric kit and renders it to `public/landing/scenarios/` — `npm run illustrations`.
- **Navbar:** shadcn NavigationMenu with a full-width mega menu; Features, Pricing and FAQ are pages, and `/#…` links (How it works, the use cases) scroll to a section of the front page from any page.

## Live world

`features/world` draws the business as an isometric SVG scene (no WebGL), built from records only.
- **Data:** `ctx` holds the dashboard, locations, open orders, deliveries not yet received and every item. Nothing in the scene is invented: racks show real slots, vehicles appear only for real deliveries or orders, there is one walker per team member.
- **Layouts:** `lib/<type>-world.ts` lists the clickable objects (label, tag, stats, alert, the tracker tabs it belongs to) and points at its scene, `lib/scenes/<type>-scene.ts`, which builds boxes from `ctx` with the kit in `lib/iso/kit.ts`.
- **Renderer:** `lib/iso/prepare.ts` turns the scene by quarter turns, projects it (`project.ts`) and sorts boxes in painter's order; `components/IsoScene.tsx` draws it as SVG. Moving trucks and people (`lib/iso/movers.ts`) are moved every frame by transform without re-rendering the static scene.
- **Doors:** the app does not book dock doors, so retail doors 1–3 show the next deliveries in arrival order (`DockDoors`); door 4 shows the next packed order.
- **Inspector and tracker:** selecting an object or a record (`WorldSelectionType`) fills the inspector from `lib/inspect*.ts`; the tracker lists deliveries, open orders and stock alerts, or search results across all records.
- **Tabs:** each tracker tab drops its own pins, lifts its objects' tags to full text and animates its rows in.
- **Accessibility:** tags are real buttons; the inspector's overview lists every object; reduced motion stops all animation.

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
├── <domain>.repository.ts    # ALL SQL for the domain: functions taking a Queryable (db or a transaction) first
├── <domain>.service.ts       # business rules only — no SQL — exported as one `<domain>Service` object
├── <domain>.validators.ts    # zod schemas
├── <domain>.mapper.ts        # row → response, only when shared (items, deliveries, activity)
└── rest-api/<domain>.controller.ts, <domain>.routes.ts, <domain>.middleware.ts (optional)
```

- **No SQL in services** (review-only). A service calls repositories, its own and other modules' (e.g. orders uses `itemsRepository.LockItemsByIds`), so a query is written once. Shared services (`common/services/audit.ts`, `realtime/socket.ts`) go through repositories too.
- **Writes** run in a transaction:
  - lock the rows they change (`FOR UPDATE`, stock rows in id order);
  - record an `activity` row (and `movements` rows for stock changes) through `common/services/audit.ts`;
  - after commit, call `BroadcastChange(scope.businessId, resources, activity)`.
- **Human numbers** (`SO-10239`, `TKT-1045`) come from `db/next-number.ts`, which serialises on an advisory lock.

## Before pushing

```
npx tsc -b --noEmit && npx eslint src && npx vitest run && npm run build
```

## Known deviations

- **No Formik.** Forms validate with the feature's zod schema (`safeParse`) directly; the server validates again.
- **Database driver.** `db/client.ts` speaks to real Postgres when `DATABASE_URL` is set, and otherwise to embedded Postgres (PGlite). Migrations are plain SQL files, and `db/schema/` holds row types rather than an ORM schema.
- **Tests run one file at a time** (`fileParallelism: false`). Each file starts its own in-memory Postgres, and running them all at once exhausts memory on Windows.
- **Templates are served, not duplicated.** Unlike domain types, the template config lives only on the backend; the frontend reads it from the API. Only its TypeScript shape is duplicated (`features/businesses/types`).
