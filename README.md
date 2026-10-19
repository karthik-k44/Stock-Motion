# StockMotion

Warehouse inventory management with a live, animated warehouse floor. Trucks back into Dock 1 and unload, cartons on the shelves reflect real stock, and the warehouse staff walk the floor as work happens — picking, packing, shipping, counting and moving stock.

## Run it

Requires Node 20+ (tested on Node 24). No database install needed.

```bash
npm install
npm run dev          # http://localhost:3000 — API + frontend (Vite HMR) on one port
```

### Database

Settings are read from `.env` in the project root (git-ignored). Real environment variables override it. Create it with:

```
# Leave empty to use the embedded Postgres instead
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/stockmotion
# Embedded Postgres folder (only used when DATABASE_URL is empty)
PGLITE_DIR=.data/pglite
PORT=3000
# debug | info | warn | error
LOG_LEVEL=info
```

- **Your local PostgreSQL** — set `DATABASE_URL` in `.env`:
  ```
  DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/stockmotion
  ```
  The `stockmotion` database is created on first start, then migrations run and demo data is seeded. A wrong password or a stopped service is reported in one line at startup.
- **No database install** — leave `DATABASE_URL` empty and an embedded Postgres (PGlite) is stored in `.data/pglite`. Only one server can use that folder at a time; a second one is refused with a clear message.

| Script | What it does |
| --- | --- |
| `npm run dev` | API + Vite dev server with HMR on `PORT` (default 3000) |
| `npm run build` | Typecheck both projects and build the frontend to `dist/` |
| `npm start` | Production server — serves `dist/` and the API |
| `npm test` | Backend integration tests (in-memory Postgres) |
| `npm run lint` | ESLint — import cycles, frontend/backend boundary, hook rules |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run db:seed` | Wipe and re-seed the demo data (the **Reset** button in the app does the same) |

Environment variables (validated in `src/backend/config/env.ts`): `PORT`, `DATABASE_URL`, `PGLITE_DIR`, `LOG_LEVEL`, `NODE_ENV`.

## What to try

- **Warehouse floor** — scroll down: the camera travels from the loading yard through aisles A–D to packing, and shelves fill with cartons as they come into view. Hover a carton for stock details; click it for the item panel. Your own character (tagged **You**) walks over to the bin you inspect.
- **Simulate delivery** (Dock 1 panel) — the next expected truck reverses into the bay, the dock door opens, Ana and Marcus unload cartons to staging, stock increases on the server, and the forklift puts stock away. **Replay arrival** re-runs the last arrival without changing stock.
- **Incoming deliveries** — open a delivery, adjust counted quantities (short/over is recorded), then **Receive & unload** to watch the same sequence.
- **Orders** — release a New order to picking (stock becomes reserved, available drops), pick lines (on-hand drops, the picker walks to the bin and carries the box to packing), mark packed, ship (Tom takes it out the outbound door).
- **Inventory** — search and filter; open an item to adjust stock (two-step confirm), relocate it to an empty bin, or **Show in warehouse** to pan the floor to its spotlighted bin.
- **Acting as** (top bar) — every change is recorded under the chosen user. Open two tabs: changes, the activity log and the moving characters sync live.
- **Motion** (top bar) — System / On / Off. With reduced motion the truck and people jump between positions and shelves are shown immediately; everything stays usable.

## Stock model

- **On hand** — physically in the bin.
- **Reserved** — open quantity on orders released to picking (`PICKING`). Allocation happens on release and is checked against available stock.
- **Available** = on hand − reserved.
- **Incoming** — expected quantity on deliveries not yet received.
- **Status** — *Out* when on hand is 0, *Low* when available ≤ reorder level.

These are derived in one place, the `item_views` SQL view (`src/backend/db/migrations/001_init.sql`).

## Structure

Follows `docs/STRUCTURE.md`: an Express + Postgres backend (`src/backend`, one folder per domain module) and a React 19 + Vite + React Query frontend (`src/frontend`, one folder per feature, each with a single service object). Realtime updates go over socket.io.
