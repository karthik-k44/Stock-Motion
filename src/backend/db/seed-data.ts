/** Realistic sample data. Dates are relative to "now" so the demo always looks current. */

export const SEED_USERS = [
  { id: 'u-jordan', name: 'Jordan Lee', role: 'INVENTORY_MANAGER', initials: 'JL', vest: '#2b4c7e', skin: '#e0b48f', hat: '#f4f4f0' },
  { id: 'u-priya', name: 'Priya Nair', role: 'PICKER', initials: 'PN', vest: '#e86b2c', skin: '#b9825a', hat: '#f2c230' },
  { id: 'u-marcus', name: 'Marcus Bell', role: 'FORKLIFT_OPERATOR', initials: 'MB', vest: '#d9b21c', skin: '#7a5136', hat: '#f2c230' },
  { id: 'u-ana', name: 'Ana Souza', role: 'RECEIVING_LEAD', initials: 'AS', vest: '#2f9e6d', skin: '#d39d74', hat: '#f4f4f0' },
  { id: 'u-tom', name: 'Tom Okafor', role: 'PACKER', initials: 'TO', vest: '#3a7bd5', skin: '#5e3b26', hat: '#f2c230' },
];

export const SUPPLIERS = [
  'Shenzhen Audio Ltd',
  'Nordic Homeware AB',
  'Coastline Apparel',
  'Peak Outdoor Supply',
  'OfficeWorks Wholesale',
  'Meridian Health Goods',
];

// [sku, name, category, unit, onHand, reorderLevel, location]
export const SEED_ITEMS: [string, string, string, string, number, number, string][] = [
  ['ELC-1001', 'Wireless Earbuds Pro', 'ELECTRONICS', 'ea', 148, 60, 'A-1-1'],
  ['ELC-1002', 'USB-C Hub 7-port', 'ELECTRONICS', 'ea', 42, 50, 'A-1-2'],
  ['ELC-1003', 'Smart LED Bulb 4-pack', 'ELECTRONICS', 'pk', 210, 80, 'A-1-3'],
  ['ELC-1004', 'Bluetooth Speaker Mini', 'ELECTRONICS', 'ea', 0, 40, 'A-1-4'],
  ['ELC-1005', '4K HDMI Cable 2m', 'ELECTRONICS', 'ea', 320, 100, 'A-2-1'],
  ['ELC-1006', 'Mechanical Keyboard TKL', 'ELECTRONICS', 'ea', 64, 30, 'A-2-2'],
  ['OFC-2001', 'Ergonomic Mouse', 'OFFICE', 'ea', 18, 35, 'A-2-3'],
  ['OFC-2002', 'A4 Copy Paper (5 ream)', 'OFFICE', 'box', 96, 40, 'A-3-1'],
  ['OFC-2003', 'Gel Pens Black 12-pack', 'OFFICE', 'pk', 340, 120, 'A-3-2'],
  ['OFC-2004', 'Bamboo Desk Organizer', 'OFFICE', 'ea', 27, 20, 'A-3-3'],
  ['HOM-3001', 'Steel Water Bottle 750ml', 'HOME_KITCHEN', 'ea', 186, 70, 'B-1-1'],
  ['HOM-3002', 'Ceramic Mug Set (4)', 'HOME_KITCHEN', 'set', 55, 40, 'B-1-2'],
  ['HOM-3003', 'Non-stick Pan 28cm', 'HOME_KITCHEN', 'ea', 12, 25, 'B-1-3'],
  ['HOM-3004', 'Glass Food Containers 10pc', 'HOME_KITCHEN', 'set', 74, 30, 'B-1-4'],
  ['HOM-3005', 'Bamboo Cutting Board', 'HOME_KITCHEN', 'ea', 0, 20, 'B-2-1'],
  ['HOM-3006', 'Cotton Bath Towels 2-pack', 'HOME_KITCHEN', 'pk', 132, 50, 'B-2-2'],
  ['HOM-3007', 'Scented Soy Candle', 'HOME_KITCHEN', 'ea', 88, 40, 'B-2-3'],
  ['HOM-3008', 'French Press 1L', 'HOME_KITCHEN', 'ea', 39, 25, 'B-3-1'],
  ['APP-4001', 'Merino Crew Socks 3-pack', 'APPAREL', 'pk', 240, 90, 'C-1-1'],
  ['APP-4002', 'Rain Shell Jacket M', 'APPAREL', 'ea', 34, 30, 'C-1-2'],
  ['APP-4003', 'Rain Shell Jacket L', 'APPAREL', 'ea', 9, 30, 'C-1-3'],
  ['APP-4004', 'Running Cap', 'APPAREL', 'ea', 76, 30, 'C-1-4'],
  ['APP-4005', 'Fleece Pullover S', 'APPAREL', 'ea', 45, 25, 'C-2-1'],
  ['APP-4006', 'Canvas Tote Bag', 'APPAREL', 'ea', 160, 60, 'C-2-2'],
  ['APP-4007', 'Leather Belt 34"', 'APPAREL', 'ea', 0, 15, 'C-3-1'],
  ['OUT-5001', 'LED Camping Lantern', 'OUTDOOR', 'ea', 58, 25, 'D-1-1'],
  ['OUT-5002', 'Insulated Cooler 24L', 'OUTDOOR', 'ea', 14, 12, 'D-1-2'],
  ['OUT-5003', 'Trekking Poles (pair)', 'OUTDOOR', 'pr', 22, 20, 'D-1-3'],
  ['OUT-5004', 'Compact Hammock', 'OUTDOOR', 'ea', 31, 15, 'D-2-1'],
  ['HLT-6001', 'First Aid Kit 120pc', 'HEALTH_BEAUTY', 'kit', 67, 30, 'D-2-2'],
  ['HLT-6002', 'Sunscreen SPF50 200ml', 'HEALTH_BEAUTY', 'ea', 19, 40, 'D-2-3'],
  ['HLT-6003', 'Electric Toothbrush', 'HEALTH_BEAUTY', 'ea', 44, 20, 'D-3-1'],
  ['HLT-6004', 'Yoga Mat 6mm', 'HEALTH_BEAUTY', 'ea', 26, 15, 'D-3-2'],
];

type SeedOrder = {
  id: string; customer: string; dueDays: number; dueHour: number; createdMinsAgo: number;
  status: string; assignee: string; lines: [string, number, number][]; // [sku, qty, picked]
};

export const SEED_ORDERS: SeedOrder[] = [
  { id: 'SO-10231', customer: 'Northwind Outfitters', dueDays: 1, dueHour: 12, createdMinsAgo: 300, status: 'PICKING', assignee: 'u-priya',
    lines: [['APP-4002', 6, 6], ['APP-4004', 10, 0], ['OUT-5001', 4, 0]] },
  { id: 'SO-10232', customer: 'Bluebird Home Co.', dueDays: 2, dueHour: 12, createdMinsAgo: 190, status: 'NEW', assignee: 'u-priya',
    lines: [['HOM-3001', 24, 0], ['HOM-3002', 6, 0], ['HOM-3007', 12, 0]] },
  { id: 'SO-10233', customer: 'Kestrel Electronics', dueDays: 1, dueHour: 17, createdMinsAgo: 150, status: 'NEW', assignee: 'u-priya',
    lines: [['ELC-1001', 20, 0], ['ELC-1005', 40, 0], ['ELC-1003', 15, 0]] },
  { id: 'SO-10234', customer: 'Pinecrest Office Supply', dueDays: 0, dueHour: 17, createdMinsAgo: 1300, status: 'PACKED', assignee: 'u-tom',
    lines: [['OFC-2002', 10, 10], ['OFC-2003', 30, 30]] },
  { id: 'SO-10235', customer: 'Harbor & Vine', dueDays: -1, dueHour: 12, createdMinsAgo: 2600, status: 'SHIPPED', assignee: 'u-tom',
    lines: [['HOM-3006', 8, 8]] },
  { id: 'SO-10236', customer: 'Summit Trail Co.', dueDays: 3, dueHour: 10, createdMinsAgo: 95, status: 'NEW', assignee: 'u-priya',
    lines: [['OUT-5003', 6, 0], ['OUT-5004', 4, 0], ['HLT-6001', 10, 0]] },
  { id: 'SO-10237', customer: 'Lumen Studio', dueDays: 1, dueHour: 9, createdMinsAgo: 240, status: 'PICKING', assignee: 'u-priya',
    lines: [['ELC-1006', 5, 5], ['OFC-2001', 8, 0]] },
  { id: 'SO-10238', customer: 'Greenleaf Pharmacy', dueDays: 4, dueHour: 12, createdMinsAgo: 40, status: 'NEW', assignee: 'u-priya',
    lines: [['HLT-6002', 12, 0], ['HLT-6003', 6, 0]] },
];

type SeedDelivery = {
  id: string; supplier: string; truck: string; plate: string; dueDays: number; dueHour: number; dueMin: number;
  status: string; lines: [string, number][]; // [sku, expected]
};

export const SEED_DELIVERIES: SeedDelivery[] = [
  { id: 'DLV-2041', supplier: 'Shenzhen Audio Ltd', truck: 'TRK-17', plate: 'KX 4471', dueDays: 0, dueHour: 14, dueMin: 30, status: 'IN_TRANSIT',
    lines: [['ELC-1004', 120], ['ELC-1001', 80], ['ELC-1002', 60]] },
  { id: 'DLV-2042', supplier: 'Nordic Homeware AB', truck: 'TRK-22', plate: 'NH 2208', dueDays: 0, dueHour: 16, dueMin: 0, status: 'SCHEDULED',
    lines: [['HOM-3005', 60], ['HOM-3003', 40], ['HOM-3008', 24]] },
  { id: 'DLV-2043', supplier: 'Coastline Apparel', truck: 'TRK-09', plate: 'CA 9031', dueDays: 1, dueHour: 9, dueMin: 0, status: 'SCHEDULED',
    lines: [['APP-4007', 45], ['APP-4003', 60], ['APP-4001', 120]] },
  { id: 'DLV-2044', supplier: 'Peak Outdoor Supply', truck: 'TRK-31', plate: 'PO 3150', dueDays: 2, dueHour: 11, dueMin: 0, status: 'SCHEDULED',
    lines: [['OUT-5002', 20], ['HLT-6002', 80], ['OUT-5003', 24]] },
  { id: 'DLV-2040', supplier: 'OfficeWorks Wholesale', truck: 'TRK-12', plate: 'OW 1204', dueDays: -1, dueHour: 10, dueMin: 0, status: 'RECEIVED',
    lines: [['OFC-2002', 40], ['OFC-2003', 120]] },
];

// [minutesAgo, sku, type, delta, balance, ref, user, note]
export const SEED_MOVEMENTS: [number, string, string, number, number, string | null, string, string][] = [
  [1700, 'OFC-2002', 'RECEIPT', 40, 106, 'DLV-2040', 'u-ana', 'Received from OfficeWorks Wholesale'],
  [1700, 'OFC-2003', 'RECEIPT', 120, 370, 'DLV-2040', 'u-ana', 'Received from OfficeWorks Wholesale'],
  [2500, 'HOM-3006', 'PICK', -8, 132, 'SO-10235', 'u-tom', 'Picked for Harbor & Vine'],
  [1200, 'OFC-2002', 'PICK', -10, 96, 'SO-10234', 'u-priya', 'Picked for Pinecrest Office Supply'],
  [1200, 'OFC-2003', 'PICK', -30, 340, 'SO-10234', 'u-priya', 'Picked for Pinecrest Office Supply'],
  [600, 'HOM-3003', 'ADJUSTMENT', -3, 12, null, 'u-jordan', 'Damaged — dropped from top shelf'],
  [250, 'APP-4002', 'PICK', -6, 34, 'SO-10231', 'u-priya', 'Picked for Northwind Outfitters'],
  [200, 'ELC-1006', 'PICK', -5, 64, 'SO-10237', 'u-priya', 'Picked for Lumen Studio'],
  [120, 'HLT-6002', 'ADJUSTMENT', 4, 19, null, 'u-jordan', 'Cycle count'],
];

// [minutesAgo, kind, user, message, refType, refId, meta]
export const SEED_ACTIVITY: [number, string, string, string, string, string, Record<string, unknown>][] = [
  [2600, 'SHIP', 'u-tom', 'Shipped SO-10235 to Harbor & Vine', 'ORDER', 'SO-10235', {}],
  [2500, 'PICK', 'u-tom', 'Picked 8 × Cotton Bath Towels 2-pack for SO-10235', 'ORDER', 'SO-10235', { skus: ['HOM-3006'] }],
  [1700, 'DELIVERY', 'u-ana', 'Received DLV-2040 from OfficeWorks Wholesale · 160 units', 'DELIVERY', 'DLV-2040', { skus: ['OFC-2002', 'OFC-2003'] }],
  [1200, 'PICK', 'u-priya', 'Picked all lines for SO-10234 (40 units)', 'ORDER', 'SO-10234', { skus: ['OFC-2002', 'OFC-2003'] }],
  [1150, 'PACK', 'u-tom', 'Packed SO-10234 for Pinecrest Office Supply', 'ORDER', 'SO-10234', {}],
  [600, 'ADJUSTMENT', 'u-jordan', 'Adjusted Non-stick Pan 28cm by −3 (Damaged)', 'ITEM', 'HOM-3003', { skus: ['HOM-3003'] }],
  [280, 'ALLOCATION', 'u-jordan', 'Released SO-10231 to picking · 20 units allocated', 'ORDER', 'SO-10231', {}],
  [250, 'PICK', 'u-priya', 'Picked 6 × Rain Shell Jacket M for SO-10231', 'ORDER', 'SO-10231', { skus: ['APP-4002'] }],
  [220, 'ALLOCATION', 'u-jordan', 'Released SO-10237 to picking · 13 units allocated', 'ORDER', 'SO-10237', {}],
  [200, 'PICK', 'u-priya', 'Picked 5 × Mechanical Keyboard TKL for SO-10237', 'ORDER', 'SO-10237', { skus: ['ELC-1006'] }],
  [120, 'ADJUSTMENT', 'u-jordan', 'Adjusted Sunscreen SPF50 200ml by +4 (Cycle count)', 'ITEM', 'HLT-6002', { skus: ['HLT-6002'] }],
  [30, 'SYSTEM', 'u-ana', 'DLV-2041 from Shenzhen Audio Ltd left the hub · in transit', 'DELIVERY', 'DLV-2041', {}],
];
