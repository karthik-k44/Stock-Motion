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
- **Marketing pages:** the front page at `/` (pitch, use cases, how it works), plus `/features`, `/pricing` (Starter $19, Pro $49 a month — no billing in the app yet) and `/faq`. The hero shows illustrated everyday scenarios as a stack of cards in depth. Style: `docs/design/style-reference.md`.

## Run it

Requires Node 20.12+ (tested on Node 24).

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
PORT=3000
LOG_LEVEL=info              # debug | info | warn | error
JWT_SECRET=                 # 32+ characters; required in production, random per run in development
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
TRUST_PROXY=loopback        # "1" behind one load balancer (most hosts), "true", or a list of addresses
SHUTDOWN_TIMEOUT_MS=10000   # grace period for open requests on SIGTERM
```

- **Your local PostgreSQL:** the database is created on first start and migrations run automatically.
- **No database install:** leave `DATABASE_URL` empty and an embedded Postgres is stored in `.data/pglite`.

Sessions use a short-lived access token held in memory, plus a rotating, httpOnly refresh cookie. Replaying an already-used refresh token ends every session of that account.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server with HMR on `PORT` (default 3000) |
| `npm run build` | Typecheck both projects and build the frontend to `dist/` |
| `npm start` | Production server: serves `dist/` and the API (needs `JWT_SECRET`) |
| `npm test` | Backend integration tests (in-memory Postgres, one file at a time) |
| `npm run lint` | ESLint: import cycles, frontend/backend boundary, hook rules |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run illustrations` | Re-render the landing page's scenario illustrations into `public/landing/scenarios/` (uses your installed Chrome) |
| `npm run db:seed` | Wipe the database and recreate the demo login (refuses in production) |

## Deploy

Production runs one Node process that serves the API, the realtime socket and the built frontend. Any host that runs a Docker image or Node 20.12+ works (Render, Railway, Fly.io, a VPS …).

**With Docker**

```bash
docker build -t stockmotion .
docker run -p 3000:3000   -e JWT_SECRET="$(openssl rand -hex 48)"   -e DATABASE_URL="postgres://user:pass@host:5432/stockmotion"   -e TRUST_PROXY=1   stockmotion
```

Leave `DATABASE_URL` empty to use the embedded Postgres instead, and mount a volume at `/app/.data` to keep it. The image has a health check on `/api/system/health` and stops gracefully on SIGTERM.

**Without Docker:** `npm ci && npm run build && npm start` with the same environment variables (`.env.example` lists them all).

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

All of these are derived in one place, the `item_views` SQL view (`src/backend/db/migrations/002_multi_business.sql`).

## Structure

See `docs/STRUCTURE.md`:
- **Backend** (`src/backend`): Express + Postgres, one folder per domain module. SQL lives only in each module's `*.repository.ts`.
- **Frontend** (`src/frontend`): React 19 + Vite + React Query, one folder per feature, each with a single service object. Business templates live in `src/backend/modules/templates`; the frontend reads them from the API.

## Credits

3D icons on the landing page: [3dicons](https://github.com/realvjy/3dicons) by realvjy, CC0. Font: Inter (SIL Open Font License), self-hosted via Fontsource. Animation: [GSAP](https://gsap.com) (free under its standard license).
