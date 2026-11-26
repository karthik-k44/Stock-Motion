export const paths = {
  login: '/login',
  signup: '/signup',
  invite: (token: string) => `/invite/${token}`,
  onboarding: '/onboarding',
  /** Choosing a plan and how many inventories: right after signing up, or to change plan later */
  plans: '/plans',
  /** Our payment page, for the plan, interval and inventories in the query (see billing/lib/plan-choice.ts) */
  checkout: (query: string) => `/checkout?${query}`,
  /** The public front page */
  landing: '/',
  features: '/features',
  howItWorks: '/how-it-works',
  pricing: '/pricing',
  faq: '/faq',
  contact: '/contact',
  /** Where the signed-in app starts */
  home: '/world',
  world: '/world',
  dashboard: '/dashboard',
  inventory: '/inventory',
  /** Inventory with its filters already set. The page applies these once, then clears them from the URL. */
  inventoryWith: (filters: { search?: string; status?: string }) => `/inventory?${new URLSearchParams(filters)}`,
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
  billing: '/billing',
  invoices: '/invoices',
  invoice: (id: string) => `/invoices/${encodeURIComponent(id)}`,
  activity: '/activity',
  /** The 3D world, focused on the object that holds an item (its shelf / zone). */
  locateItem: (sku: string) => `/world?focus=${encodeURIComponent(sku)}`,
} as const;
