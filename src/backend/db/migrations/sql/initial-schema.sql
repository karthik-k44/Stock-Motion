-- The schema TypeORM started from (run by migrations/1792368000000-initial-schema.ts).
-- Multi-business: accounts sign up, create businesses from a template (retail, café, trades)
-- and every operational row is scoped to a business. The DROPs clear the single-tenant demo
-- tables of the very first version, which only ever held seed data.

DROP VIEW IF EXISTS item_views;
DROP TABLE IF EXISTS activity, movements, delivery_lines, deliveries, order_lines, orders, items, locations, users CASCADE;

CREATE TABLE accounts (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  token_hash  TEXT PRIMARY KEY,
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_account ON refresh_tokens (account_id);

CREATE TABLE businesses (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('RETAIL','CAFE','TRADES')),
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- role is OWNER, MANAGER or one of the template's staff roles (checked in the service).
CREATE TABLE memberships (
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  account_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  color        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, account_id)
);
CREATE INDEX memberships_account ON memberships (account_id);

CREATE TABLE invites (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_hash   TEXT NOT NULL UNIQUE,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  created_by   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  accepted_by  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invites_business ON invites (business_id);

CREATE TABLE locations (
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  zone         TEXT NOT NULL,
  name         TEXT NOT NULL,
  position     INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, code)
);

CREATE TABLE categories (
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  position     INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, code)
);

CREATE TABLE suppliers (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  contact      TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  lead_days    INT  NOT NULL DEFAULT 2 CHECK (lead_days >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

CREATE TABLE customers (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX customers_business ON customers (business_id, name);

-- kind STOCK is counted on the shelf; MADE (menu item, job kit, bundle) is built from
-- item_components and has no stock of its own; SERVICE (labour, call-out fee) is sold but never
-- stocked. Quantities are whole numbers in the item's unit (g, ml, ea …); cost per unit keeps 4 decimals so a gram of coffee can cost 0.0250.
CREATE TABLE items (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id    TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sku            TEXT NOT NULL,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  unit           TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'STOCK' CHECK (kind IN ('STOCK','MADE','SERVICE')),
  on_hand        INT  NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reorder_level  INT  NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  cost           NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  price          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  location       TEXT,
  supplier_id    TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  archived_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, sku),
  FOREIGN KEY (business_id, location) REFERENCES locations(business_id, code)
);
CREATE INDEX items_business ON items (business_id);

CREATE TABLE item_components (
  parent_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  component_id  TEXT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
  qty           INT  NOT NULL CHECK (qty > 0),
  PRIMARY KEY (parent_id, component_id),
  CHECK (parent_id <> component_id)
);
CREATE INDEX item_components_component ON item_components (component_id);

-- status is a stage of the business template's order flow. `reserves` and `closed` are
-- copied from that stage on every transition so stock maths never needs the template.
CREATE TABLE orders (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id    TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  number         TEXT NOT NULL,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  TEXT NOT NULL,
  status         TEXT NOT NULL,
  reserves       BOOLEAN NOT NULL DEFAULT false,
  closed         BOOLEAN NOT NULL DEFAULT false,
  cancelled      BOOLEAN NOT NULL DEFAULT false,
  due_at         TIMESTAMPTZ,
  assignee_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  notes          TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at      TIMESTAMPTZ,
  UNIQUE (business_id, number)
);
CREATE INDEX orders_business ON orders (business_id, closed, created_at DESC);

-- done = quantity already picked / used / consumed from stock.
CREATE TABLE order_lines (
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id           TEXT NOT NULL REFERENCES items(id),
  position          INT  NOT NULL,
  qty               INT  NOT NULL CHECK (qty > 0),
  done              INT  NOT NULL DEFAULT 0 CHECK (done >= 0 AND done <= qty),
  unit_price        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, item_id)
);
CREATE INDEX order_lines_item ON order_lines (item_id);

CREATE TABLE deliveries (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id    TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  number         TEXT NOT NULL,
  supplier_id    TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name  TEXT NOT NULL,
  vehicle        TEXT NOT NULL DEFAULT '',
  reference      TEXT NOT NULL DEFAULT '',
  expected_at    TIMESTAMPTZ NOT NULL,
  received_at    TIMESTAMPTZ,
  status         TEXT NOT NULL CHECK (status IN ('SCHEDULED','IN_TRANSIT','ARRIVED','RECEIVED')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, number)
);
CREATE INDEX deliveries_business ON deliveries (business_id, status);

CREATE TABLE delivery_lines (
  delivery_id  TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL REFERENCES items(id),
  position     INT  NOT NULL,
  expected     INT  NOT NULL CHECK (expected > 0),
  received     INT  CHECK (received >= 0),
  unit_cost    NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  PRIMARY KEY (delivery_id, item_id)
);
CREATE INDEX delivery_lines_item ON delivery_lines (item_id);

CREATE TABLE movements (
  id           SERIAL PRIMARY KEY,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  item_id      TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('RECEIPT','CONSUME','ADJUSTMENT','RELOCATION')),
  delta        INT  NOT NULL,
  balance      INT  NOT NULL,
  ref          TEXT,
  account_id   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  note         TEXT NOT NULL DEFAULT ''
);
CREATE INDEX movements_item_at ON movements (item_id, at DESC);

CREATE TABLE activity (
  id           SERIAL PRIMARY KEY,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind         TEXT NOT NULL CHECK (kind IN ('DELIVERY','ADJUSTMENT','ALLOCATION','CONSUME','STATUS','RELOCATION','CATALOG','TEAM','SYSTEM')),
  account_id   TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  message      TEXT NOT NULL,
  ref_type     TEXT CHECK (ref_type IN ('ORDER','DELIVERY','ITEM','CUSTOMER','SUPPLIER')),
  ref_id       TEXT,
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX activity_business_at ON activity (business_id, at DESC);

-- reserved: open quantity on orders in a reserving stage. A MADE line reserves its components.
-- incoming: expected quantity on deliveries not yet received.
-- available: on hand − reserved for stock items; for MADE items, how many can be made right now.
-- SERVICE items are always IN_STOCK.
CREATE VIEW item_views AS
WITH reserved AS (
  SELECT COALESCE(c.component_id, ol.item_id) AS item_id,
         SUM((ol.qty - ol.done) * COALESCE(c.qty, 1)) AS reserved
  FROM order_lines ol
  JOIN orders o ON o.id = ol.order_id
  JOIN items li ON li.id = ol.item_id
  LEFT JOIN item_components c ON c.parent_id = ol.item_id
  WHERE o.reserves AND (c.component_id IS NOT NULL OR li.kind = 'STOCK')
  GROUP BY 1
),
incoming AS (
  SELECT dl.item_id, SUM(dl.expected) AS incoming
  FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id
  WHERE d.status <> 'RECEIVED'
  GROUP BY dl.item_id
),
stock AS (
  SELECT i.*,
         COALESCE(r.reserved, 0)::int AS reserved,
         COALESCE(inc.incoming, 0)::int AS incoming,
         GREATEST(i.on_hand - COALESCE(r.reserved, 0), 0)::int AS stock_available
  FROM items i
  LEFT JOIN reserved r ON r.item_id = i.id
  LEFT JOIN incoming inc ON inc.item_id = i.id
),
made AS (
  SELECT c.parent_id, MIN(s.stock_available / c.qty)::int AS can_make
  FROM item_components c JOIN stock s ON s.id = c.component_id
  GROUP BY c.parent_id
)
SELECT
  s.id, s.business_id, s.sku, s.name, s.category, s.unit, s.kind, s.on_hand, s.reorder_level,
  s.cost, s.price, s.location, s.supplier_id, s.reserved, s.incoming,
  CASE WHEN s.kind = 'MADE' THEN COALESCE(m.can_make, 0) ELSE s.stock_available END AS available,
  CASE
    WHEN s.kind = 'SERVICE' THEN 'IN_STOCK'
    WHEN s.kind = 'MADE' THEN
      CASE WHEN COALESCE(m.can_make, 0) = 0 THEN 'OUT' WHEN m.can_make <= s.reorder_level THEN 'LOW' ELSE 'IN_STOCK' END
    WHEN s.on_hand <= 0 THEN 'OUT'
    WHEN s.stock_available <= s.reorder_level THEN 'LOW'
    ELSE 'IN_STOCK'
  END AS status
FROM stock s
LEFT JOIN made m ON m.parent_id = s.id
WHERE s.archived_at IS NULL;
