# StockMotion

Inventory and orders for any small business, with a live 3D world of the business. An owner signs up, picks what kind of business they run, and the whole app adapts to it: its words, its order flow, its storage, and the 3D world.

| Business type | Stock | Sells | Order flow | Storage | 3D world |
| --- | --- | --- | --- | --- | --- |
| Retail / e-commerce warehouse | Products | Products and bundles | New → Picking → Packed → Shipped | Aisles × shelves × bins | Warehouse with racks, Dock 1 truck, packing bench, outbound van |
| Café / restaurant | Ingredients & stock (g, ml, ea) | Menu items made from recipes | New → Preparing → Served | Dry store, fridge, freezer, bar, front counter | Café with counter, coffee machine, till, storage and tables |
| Trades / agency | Materials | Job kits and labour / fees | Quoted → Scheduled → In progress → Done | Depot shelves, vans, site store | Depot, two vans on the road, job-site houses |

## What it does

- **Accounts and teams.** Owners sign up, and one account can own or join several businesses. Owners invite staff with one-time links and a role from the template (Picker, Barista, Technician …). Managers run the catalogue and settings; everyone works orders and stock.
- **Items of three kinds.**
  - Stock items are counted on a shelf.
  - Made items are built from stock items: menu recipes, job kits, bundles. The app shows how many can be made right now.
  - Services (labour, call-out fee) are sold but never stocked.
- **Orders follow the business's flow.** Entering a reserving stage checks that stock is available and reserves it. Work stages take stock line by line, or all at once (a ticket is served). Closing counts the order towards revenue. Selling a made item uses up its components.
- **Deliveries.** Book incoming stock from suppliers, or let *Reorder low stock* book one delivery per supplier. Mark it on the way or arrived, then count it in.
- **Also:** customers (with spend and order history), suppliers, storage locations, categories, CSV import with a per-row preview, and an activity log of who did what.
- **Optimistic updates.** Stock adjustments, moves, order stage changes, receiving, and edits to items, customers and suppliers show at once. If the server refuses, the screen rolls back and a toast says why.
- **Live everywhere.** Changes reach every open tab of the same business over socket.io.
- **Live world.** An isometric drawing of the business made only from its own records: racks coloured bin by bin, trucks at the dock doors or on the road, orders on the packing bench, one person per team member. Every label is live; click anything (or any tracker row) for its details. The tracker tabs — deliveries, orders, stock alerts — each bring their own pins and highlights. Zoom, pan and turn the view in quarter turns.
- **Marketing pages:** the front page at `/` (pitch, the stock sketch, use cases), plus `/features`, `/how-it-works` (setting up, the daily loop, each business type), `/pricing` (Starter $19, Pro $49 a month, Scale by contact — no billing in the app yet) and `/faq`. Each page opens on a bento hero animated with GSAP; on the front page a hand-drawn sketch of stock moving through a business follows it, inked in with rough.js as it scrolls into view. The footer sets the wordmark behind a rendered skyline of factories and warehouses. Logo files are in `public/brand`. Style: `docs/design/style-reference.md`.

## Run it

Requires Node 20.19+ or 22.13+ (tested on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000 — API + frontend (Vite HMR) on one port
```

In development an empty database gets a demo login with one sample business of each type:

```
demo@stockmotion.local / stockmotion-demo
```

Or create your own account at `/signup`.

### Settings

Settings are read from `.env` in the project root (git-ignored). Real environment variables override it.

```
# Leave empty to use the embedded Postgres (PGlite) in .data/pglite instead
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/stockmotion
PGLITE_DIR=.data/pglite
DB_POOL_SIZE=10            # PostgreSQL connections per server instance (keep it small on Vercel)
PORT=3000
LOG_LEVEL=info              # debug | info | warn | error
JWT_SECRET=                 # 32+ characters; required in production, random per run in development
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
TRUST_PROXY=loopback        # "1" behind one load balancer (most hosts), "true", or a list of addresses
SHUTDOWN_TIMEOUT_MS=10000   # grace period for open requests on SIGTERM
```

- **Your local PostgreSQL:** the database is created on first start and migrations run automatically (TypeORM, recorded in `typeorm_migrations`). A database made by an earlier version is adopted as it is — its data is kept.
- **No database install:** leave `DATABASE_URL` empty and an embedded Postgres is stored in `.data/pglite`.

Sessions use a short-lived access token held in memory, plus a rotating, httpOnly refresh cookie. Replaying an already-used refresh token ends every session of that account.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server with HMR on `PORT` (default 3000) |
| `npm run build` | Typecheck both projects and build the frontend to `dist/` |
| `npm start` | Production server: serves `dist/` and the API (needs `JWT_SECRET`) |
| `npm test` | Backend integration tests (in-memory Postgres, one file at a time). Set `TEST_DATABASE_URL` to run them against a real PostgreSQL database whose name contains `test` — it is emptied |
| `npm run lint` | ESLint: import cycles, frontend/backend boundary, hook rules |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run vercel-build` | Vercel's build: frontend, migrations, and the backend bundled as one function in `.vercel/output` (needs `DATABASE_URL`) |
| `npm run illustrations` | Re-render the landing page's scenario illustrations into `public/landing/scenarios/` (uses your installed Chrome) |
| `npm run db:seed` | Wipe the database and recreate the demo login (refuses in production) |
| `npm run db:migrate` | Apply pending migrations (the server also does this on start) |
| `npm run db:migration:create -- Name` | Start a new migration in `src/backend/db/migrations/` |

## Deploy

Production runs one Node process that serves the API, the realtime socket and the built frontend. Any host that runs a Docker image or Node 20.19+ works (Render, Railway, Fly.io, a VPS …).

**With Docker**

```bash
docker build -t stockmotion .
docker run -p 3000:3000   -e JWT_SECRET="$(openssl rand -hex 48)"   -e DATABASE_URL="postgres://user:pass@host:5432/stockmotion"   -e TRUST_PROXY=1   stockmotion
```

Leave `DATABASE_URL` empty to use the embedded Postgres instead, and mount a volume at `/app/.data` to keep it. The image has a health check on `/api/system/health` and stops gracefully on SIGTERM.

**Without Docker:** `npm ci && npm run build && npm start` with the same environment variables (`.env.example` lists them all).

**On Render** (recommended)

`render.yaml` describes one always-on service that serves the frontend, the API and the live-update socket from a single address.

1. Copy your database's **pooled** connection string. For Supabase: **Connect → Direct → Transaction pooler**, then add `?sslmode=no-verify`. Render has no IPv6, so it can't use the direct `db.….supabase.co` address, and its disk is wiped on every restart, so the server refuses to start without `DATABASE_URL`.
2. In Render: **New → Blueprint**, pick this repository and branch, paste the string when it asks for `DATABASE_URL`, and apply. `JWT_SECRET` is generated for you.
3. When the deploy is live, open `https://<your-service>.onrender.com/api/system/health` — it should answer `{"ok":true}`.

The Blueprint uses the Free plan in Singapore, the closest region to a Mumbai database; a service's region can't be changed later. Free services sleep after 15 idle minutes and take about a minute to wake, with Render showing a loading page meanwhile. A paid plan stays on.

**On Vercel** (not working yet)

The function fails to start on a real Vercel deployment: every `/api` request hangs for 60 seconds and ends in `INTERNAL_FUNCTION_INVOCATION_FAILED`. The cause wasn't confirmed, so use Render unless you're debugging this. The setup, for reference:

1. Create a PostgreSQL database (Neon or Supabase, e.g. from Vercel's Marketplace) and copy its **pooled** connection string. Vercel can't keep the embedded database.
2. Import the repository in Vercel. `vercel.json` already sets the build (`npm run vercel-build`); leave the framework preset as "Other".
3. Add environment variables: `DATABASE_URL` (pooled), `JWT_SECRET` (32+ characters) and `DB_POOL_SIZE=3`. Don't set `NODE_ENV` — the build sets it on the function, and setting it project-wide makes the install skip the build tools. Give Preview deployments their own database (e.g. a Neon branch): every build runs the migrations against its `DATABASE_URL`.
4. Deploy, then open `https://<your-domain>/api/system/health` — it should answer `{"ok":true}`.

The build runs the migrations, puts the frontend on Vercel's CDN and bundles the backend (`src/backend/server.ts`, which skips the start-up work Vercel does itself) into one function that serves `/api/*`, including the live-update socket at `/api/socket.io`. Compared with one long-running server:
- **Live updates** reach the people connected to the same function instance. At low traffic that is everyone; once Vercel runs several instances, changes need a shared Redis channel (the Socket.IO Redis adapter) to reach all of them — not included yet. Live sockets also close at the function's time limit (300 s) and the app reconnects on its own. WebSockets need Fluid compute, on by default for projects created since April 2025.
- **Rate limits** are counted per instance.

Checklist:
- Serve over **HTTPS** (the refresh cookie is `Secure` in production and HSTS is on).
- Set a strong `JWT_SECRET` (32+ characters) — the server refuses to start without one.
- Behind a load balancer, set `TRUST_PROXY` so rate limits see real client addresses.
- Use a managed Postgres for anything beyond one instance; migrations run on start.
- What production adds: a strict Content-Security-Policy and security headers (helmet), Brotli/gzip compression, year-long caching for hashed assets and `no-cache` for the app shell.

## Stock model

- **On hand:** physically there, in the item's unit (whole numbers: g, ml, ea …).
- **Reserved:** open quantity on orders in a reserving stage. A made item reserves its components.
- **Available:** on hand − reserved. For a made item, how many can be made from available components.
- **Incoming:** expected on deliveries not yet received.
- **Status:** *Out* when nothing is on hand (or nothing can be made), *Low* when available ≤ reorder level.

All of these are derived in one place, the `item_views` SQL view (`src/backend/db/migrations/sql/initial-schema.sql`).

## Security and data integrity

- **Tenancy.** Every business route checks membership in the database on each request (not from the token); non-members get 404. Realtime rooms are joined the same way, and removing someone from a team cuts their open tabs off at once.
- **Roles.** Owners manage the team; only an owner can make or invite an owner, and the last owner can’t leave. Managers run the catalogue and imports, book deliveries and cancel orders; staff work orders, count stock and receive deliveries.
- **Stock under concurrency.** Order, item and delivery rows are locked (`SELECT … FOR UPDATE`, in id order) for every change, so two people can’t reserve the same last unit, close an order twice or receive a delivery twice. `CHECK` constraints keep on-hand and line quantities from going negative.
- **Stale writes.** A stock count is refused if the count changed since the person started it. Receiving more than a delivery expected takes a manager.
- **History.** The activity log and stock ledger are append-only: the API has no way to edit them and a database trigger refuses updates.
- **Sessions.** Short-lived access tokens; rotating, single-use refresh tokens — replaying one ends every session of the account. Credential and invite endpoints are rate-limited.

`src/backend/tests/security.test.ts` checks each of these.

## Structure

See `docs/STRUCTURE.md`:
- **Backend** (`src/backend`): Express + PostgreSQL through TypeORM, one folder per domain module. Database access lives only in each module's `*.repository.ts`.
- **Frontend** (`src/frontend`): React 19 + Vite + React Query, one folder per feature, each with a single service object. Business templates live in `src/backend/modules/templates`; the frontend reads them from the API.

## Credits

3D icons on the landing page: [3dicons](https://github.com/realvjy/3dicons) by realvjy, CC0. Font: Inter (SIL Open Font License), self-hosted via Fontsource. Data access: [TypeORM](https://typeorm.io) (MIT). Animation: [GSAP](https://gsap.com) (free under its standard license).
