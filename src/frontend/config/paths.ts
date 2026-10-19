export const paths = {
  home: '/',
  warehouse: '/warehouse',
  dashboard: '/dashboard',
  inventory: '/inventory',
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
  deliveries: '/deliveries',
  delivery: (id: string) => `/deliveries/${id}`,
  locations: '/locations',
  activity: '/activity',
  /** The warehouse scene, panned to and highlighting an item's bin. */
  locateItem: (sku: string) => `/warehouse?focus=${encodeURIComponent(sku)}`,
  /** The warehouse scene, panned to a zone (yard, receiving, A–D, packing). */
  locateZone: (zone: string) => `/warehouse?zone=${encodeURIComponent(zone)}`,
} as const;
