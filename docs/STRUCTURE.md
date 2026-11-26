# Project Structure & Conventions

How StockMotion is organised and the rules new features follow. Most are enforced by `tsc` or ESLint; the rest are noted as review-only.

## Top level

```
src/
├── backend/               # Express API + Postgres (Node only, never imported by the browser)
│   ├── app.ts              # express app wiring: public routes, then /businesses/:businessId/* behind RequireAuth + RequireBusinessRole
│   ├── server.ts           # entry point: db, migrations, socket.io, Vite (dev) or dist/ (prod); on Vercel, the function
│   ├── common/             # errors/, services/audit.ts (activity + stock ledger), types/, utils/ (jwt, crypto, csv, cookies …)
│   ├── config/             # env.ts (zod-validated), logger.ts
│   ├── db/                 # client.ts (Drizzle `db`: PostgreSQL or PGlite), schema/ (the tables; ids.ts: id prefixes; enums.ts: enum types),
│   │                       # migrations/ (drizzle-kit SQL + meta/), migrate.ts, next-number.ts, cli/ (`db:migrate`)
│   ├── middleware/         # auth, rate-limit, error, not-found — each `<name>.middleware.ts`
│   ├── modules/<domain>/   # auth, businesses, invites, templates, items, categories, locations, suppliers, customers,
│   │                       # orders, deliveries, imports, activity, dashboard, system, rate-limits, demo, billing
│   ├── realtime/           # socket.io server: token-authenticated, one room per business
│   ├── tests/              # vitest integration tests (in-memory Postgres)
│   └── types/              # backend domain types, one file per domain
└── frontend/               # React 19 + Vite + React Query + Tailwind CSS v4 + shadcn/ui
    ├── App.tsx              # every route: the lazy pages, then the <Route> tree
    ├── components/          # shared UI (button/, card/, form/, modal/, drawer/, toast/, layout/, …)
    ├── config/              # paths.ts, navigation.ts (built from the template's labels)
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
- sample data, loaded only into the shared demo account (`modules/demo`).

Services read those flags; they never hard-code a status such as `'PICKING'`. The API returns the template with the business (`GET /api/businesses/:id`), and the frontend words every screen from it. **Add a business type** by adding a definition file, its world layout in `features/world/lib/`, and its enum value in both type copies.

## Multi-business tenancy

- Every operational table has `business_id`. Business routes are mounted at `/api/businesses/:businessId/…` behind `RequireAuth` + `RequireBusinessRole()`.
- That middleware resolves `req.scope = { businessId, template, actor }`. Every service takes the `ScopeType` and every repository query filters by `business_id`.
- Non-members get **404**, not 403, so business ids can't be probed.
- Narrow a route further with `RequireRole(...MANAGEMENT_ROLES)` (owner / manager).
- `BroadcastChange(businessId, resources, activity)` emits only to that business's socket room. Joining the room checks membership; every socket also sits in an `account:<id>` room, so `RevokeRealtimeAccess` cuts a removed member's open tabs off at once.
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

- a `<resource>Keys` factory (`all`, `lists()`, `list(filter)`, `details()`, `detail(id)`) whose first segment is the **realtime resource name** (`['items', …]`, `['members', …]`), so a `data:changed` event refreshes exactly the right queries;
- `useGetXxx` query hooks and verb-named mutation hooks (`useCreateItem`, `useAdjustStock`, `useReceiveDelivery`), with the request written inline and its return type spelled out with the normal type name (`Promise<ItemResponseType[]>`);
- requests built on `Biz.*` from `@/frontend/services/request` for business data (never `httpClient` directly);
- pure helpers that belong to the resource (`CategoryName`, `InviteLink`). A request stays a named function only when something outside a hook needs it too (`ListMine`).

Invalidating another resource uses its plain name (`['dashboard']`) rather than importing its service: services invalidate each other in both directions, and those imports would be cycles.

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

`features/landing` holds the public pages — `Landing.tsx` (`/`), `Features.tsx` (`/features`), `Pricing.tsx` (`/pricing`), `Faq.tsx` (`/faq`) and `Contact.tsx` (`/contact`) — as children of one layout route, `MarketingLayout.tsx` (navbar, footer, scroll restoration). They follow `docs/design/style-reference.md` — the palette is scoped to `.landing` in `styles/landing.css`, so the app keeps its own.
- **Copy and plans** live in `lib/landing-content.ts` and `lib/pricing-content.ts`; components only lay them out. Nothing there is invented: features are real, prices are the owner's, there are no fake customer logos or counts.
- **Hero:** each page opens on a bento of tiles (`components/HeroTiles.tsx`), animated with GSAP and following the app's motion setting.
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
├── <domain>.repository.ts    # ALL database access for the domain (Drizzle): functions taking a Queryable (`db` or a transaction) first
├── <domain>.service.ts       # business rules only — no SQL — exported as one `<domain>Service` object
├── <domain>.validators.ts    # zod schemas
├── <domain>.mapper.ts        # row → response, only when shared (items, deliveries, activity)
└── rest-api/<domain>.controller.ts, <domain>.routes.ts, <domain>.middleware.ts (optional)
```

- **No queries in services** (review-only). A service calls repositories, its own and other modules' (e.g. orders uses `itemsRepository.LockItemsByIds`), so a query is written once. Shared services (`common/services/audit.ts`, `realtime/socket.ts`) go through repositories too.
- **Repositories use Drizzle's query builder** for every read and write: `select … from … where`, joins, `.for('update')` locks, `$count` subqueries, `onConflictDoUpdate`. Nothing runs a hand-written SQL string; the `sql` helper appears only as an expression inside a builder query, for what the builder has no function for (`count(*) filter (…)`, `case`, `nulls last`). A function returns `undefined`, never `null`, for "not found".
- **Writes** run in a transaction, `db.transaction(async (tx) => …)`, passing `tx` to every repository call (never `db` inside a transaction — on embedded PGlite that waits for itself):
  - lock the rows they change (`FOR UPDATE`, stock rows in id order);
  - record an `activity` row (and `movements` rows for stock changes) through `common/services/audit.ts`;
  - after commit, call `BroadcastChange(scope.businessId, resources, activity)`.
- **Human numbers** (`SO-10239`, `TKT-1045`) come from `db/next-number.ts`, which serialises on an advisory lock.

## Checks

Git hooks (husky, installed by `npm install`) run them for you: **pre-commit** lints the staged files (`lint-staged`) and typechecks; **pre-push** runs the backend tests. CI (`.github/workflows/ci.yml`) runs everything on every pull request, plus the end-to-end tests and a Docker build.

```
npm run typecheck && npm run lint && npm test   # what the hooks run
npm run test:e2e                                # builds, then drives the app in a real browser (Playwright, e2e/)
```

## Known deviations

- **No Formik.** Forms validate with the feature's zod schema (`safeParse`) directly; the server validates again.
- **Drizzle tables keep snake_case property names** (`db/schema/`), exactly the column names, so table rows and joined query rows share one shape and the services never map between them. Constraint names are the ones PostgreSQL gave them, so `drizzle-kit generate` diffs against the real databases.
- **Migrations own the schema.** Change a table in `db/schema/`, then `npm run db:generate -- --name <change>` writes the SQL (hand-edit it for data changes; `--custom` for SQL only). They run on start-up, all pending ones in one transaction. 0000–0002 are the schema the TypeORM migrations built, written so they also pass over those databases; 0001 makes `activity` and `movements` append-only; 0003 removed sample data from ordinary accounts; 0004 renamed every id to its prefixed form, references included. The `item_views` view and the append-only triggers live only in the SQL (`pgView(…).existing()`).
- **Database driver.** `DATABASE_URL` → PostgreSQL through Drizzle's node-postgres driver and a `pg` pool. Otherwise embedded PostgreSQL (PGlite) through Drizzle's PGlite driver; PGlite runs one transaction at a time, so requests keep their isolation. `db/ensure-database.ts` creating a missing database is the one statement that isn't Drizzle: it runs before there is a database to connect to.
- **One entry point, two ways to run.** `server.ts` is a long-running process in dev, Docker and `npm start`. On Vercel (`VERCEL` is set) it only connects to PostgreSQL and default-exports its server: `scripts/vercel-build.ts` has bundled it with esbuild into one function for `/api/*` (bundling resolves the `@/` imports, which Vercel's own build would leave unresolved), run the migrations, and put the frontend on the CDN with routes that send every other path to `index.html`. Everywhere else production runs the same code compiled by `npm run build:server` to `build/server/server.mjs` (plain `node`, no TypeScript at runtime; `scripts/lib/bundle-server.ts` is shared by both builds). The command-line scripts live in `db/cli/`, so no module in a bundle runs anything just by being imported. The realtime socket lives at `/api/socket.io` so one route covers the whole backend.
- **Tests run one file at a time** (`fileParallelism: false`). Each file starts its own in-memory Postgres, and running them all at once exhausts memory on Windows. `TEST_DATABASE_URL` runs them against a real PostgreSQL database instead (its name must contain `test`). The end-to-end tests start the compiled server with `ENV_FILE=none` and `PGLITE_DIR=:memory:`, so they never read `.env` or touch its database.
- **Templates are served, not duplicated.** Unlike domain types, the template config lives only on the backend; the frontend reads it from the API. Only its TypeScript shape is duplicated (`features/businesses/types`).
