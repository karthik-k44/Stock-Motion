CREATE TABLE users (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  role      TEXT NOT NULL CHECK (role IN ('INVENTORY_MANAGER','PICKER','FORKLIFT_OPERATOR','RECEIVING_LEAD','PACKER')),
  initials  TEXT NOT NULL,
  vest      TEXT NOT NULL,
  skin      TEXT NOT NULL,
  hat       TEXT NOT NULL
);

CREATE TABLE locations (
  code   TEXT PRIMARY KEY,
  aisle  TEXT NOT NULL,
  level  INT  NOT NULL,
  bin    INT  NOT NULL
);

CREATE TABLE items (
  sku            TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  unit           TEXT NOT NULL,
  on_hand        INT  NOT NULL CHECK (on_hand >= 0),
  reorder_level  INT  NOT NULL CHECK (reorder_level >= 0),
  location       TEXT UNIQUE REFERENCES locations(code)
);

CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  customer        TEXT NOT NULL,
  requested_date  TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL CHECK (status IN ('NEW','PICKING','PACKED','SHIPPED')),
  assignee        TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE order_lines (
  order_id  TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku       TEXT NOT NULL REFERENCES items(sku),
  position  INT  NOT NULL,
  qty       INT  NOT NULL CHECK (qty > 0),
  picked    INT  NOT NULL DEFAULT 0 CHECK (picked >= 0 AND picked <= qty),
  PRIMARY KEY (order_id, sku)
);

CREATE TABLE deliveries (
  id           TEXT PRIMARY KEY,
  supplier     TEXT NOT NULL,
  truck        TEXT NOT NULL,
  plate        TEXT NOT NULL,
  expected_at  TIMESTAMPTZ NOT NULL,
  received_at  TIMESTAMPTZ,
  status       TEXT NOT NULL CHECK (status IN ('SCHEDULED','IN_TRANSIT','UNLOADING','RECEIVED'))
);

CREATE TABLE delivery_lines (
  delivery_id  TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  sku          TEXT NOT NULL REFERENCES items(sku),
  position     INT  NOT NULL,
  expected     INT  NOT NULL CHECK (expected > 0),
  received     INT  CHECK (received >= 0),
  PRIMARY KEY (delivery_id, sku)
);

CREATE TABLE movements (
  id       SERIAL PRIMARY KEY,
  at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  sku      TEXT NOT NULL REFERENCES items(sku),
  type     TEXT NOT NULL CHECK (type IN ('RECEIPT','PICK','ADJUSTMENT','RELOCATION')),
  delta    INT  NOT NULL,
  balance  INT  NOT NULL,
  ref      TEXT,
  user_id  TEXT NOT NULL REFERENCES users(id),
  note     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX movements_sku_at ON movements (sku, at DESC);

CREATE TABLE activity (
  id        SERIAL PRIMARY KEY,
  at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind      TEXT NOT NULL CHECK (kind IN ('DELIVERY','ADJUSTMENT','ALLOCATION','PICK','PACK','SHIP','RELOCATION','SYSTEM')),
  user_id   TEXT NOT NULL REFERENCES users(id),
  message   TEXT NOT NULL,
  ref_type  TEXT CHECK (ref_type IN ('ORDER','DELIVERY','ITEM')),
  ref_id    TEXT,
  meta      JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX activity_at ON activity (at DESC);

-- Reserved stock = open quantity on orders released for picking.
-- Incoming stock = expected quantity on deliveries not yet received.
CREATE VIEW item_views AS
SELECT
  i.sku, i.name, i.category, i.unit, i.on_hand, i.reorder_level, i.location,
  COALESCE(r.reserved, 0)::int AS reserved,
  GREATEST(i.on_hand - COALESCE(r.reserved, 0), 0)::int AS available,
  COALESCE(inc.incoming, 0)::int AS incoming,
  CASE
    WHEN i.on_hand <= 0 THEN 'OUT'
    WHEN i.on_hand - COALESCE(r.reserved, 0) <= i.reorder_level THEN 'LOW'
    ELSE 'IN_STOCK'
  END AS status
FROM items i
LEFT JOIN (
  SELECT ol.sku, SUM(ol.qty - ol.picked) AS reserved
  FROM order_lines ol JOIN orders o ON o.id = ol.order_id
  WHERE o.status = 'PICKING'
  GROUP BY ol.sku
) r ON r.sku = i.sku
LEFT JOIN (
  SELECT dl.sku, SUM(dl.expected) AS incoming
  FROM delivery_lines dl JOIN deliveries d ON d.id = dl.delivery_id
  WHERE d.status <> 'RECEIVED'
  GROUP BY dl.sku
) inc ON inc.sku = i.sku;
