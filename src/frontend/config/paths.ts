export const paths = {
  login: '/login',
  signup: '/signup',
  invite: (token: string) => `/invite/${token}`,
  onboarding: '/onboarding',
  /** The public front page */
  landing: '/',
  features: '/features',
  pricing: '/pricing',
  faq: '/faq',
  /** Where the signed-in app starts */
  home: '/world',
  world: '/world',
  dashboard: '/dashboard',
  inventory: '/inventory',
  orders: '/orders',
  order: (number: string) => `/orders/${encodeURIComponent(number)}`,
  deliveries: '/deliveries',
  delivery: (number: string) => `/deliveries/${encodeURIComponent(number)}`,
  locations: '/locations',
  customers: '/customers',
  customer: (id: string) => `/customers/${id}`,
  suppliers: '/suppliers',
  team: '/team',
  settings: '/settings',
  activity: '/activity',
  /** The 3D world, focused on the object that holds an item (its shelf / zone). */
  locateItem: (sku: string) => `/world?focus=${encodeURIComponent(sku)}`,
} as const;
