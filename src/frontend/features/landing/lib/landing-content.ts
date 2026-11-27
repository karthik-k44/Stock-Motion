import { Activity, Boxes, Building2, Coffee, FileSpreadsheet, RadioTower, Store, Truck, Users, Workflow, Wrench, Zap, type LucideIcon } from 'lucide-react';

/** Every word on the landing page. Only what the product really does; the one placeholder is CONTACT, marked below. */

export type UseCaseType = {
  id: string;
  icon: LucideIcon;
  /** The short name, for the jump links */
  name: string;
  title: string;
  /** One line, for the navbar's mega menu */
  text: string;
  /** The opening sentence of its row on the front page */
  lead: string;
  /** A scene from public/landing/scenarios */
  image: string;
  points: { title: string; text: string }[];
  /** What the row ends on. `steps` read as a flow, in order; otherwise they are a plain list. */
  chips: { label: string; items: string[]; steps?: boolean };
};
export type FeatureType = { icon: LucideIcon; title: string; text: string };
export type FaqType = { q: string; a: string };

export const USE_CASES: UseCaseType[] = [
  {
    id: 'retail',
    icon: Store,
    name: 'Retail',
    title: 'For Retail & E-commerce',
    text: 'Aisles, bins and pick lists. Orders picked, packed and shipped on time.',
    lead: 'Lay StockMotion out like your warehouse, down to the aisle and bin, then run every sales order from the first pick to the truck.',
    image: 'picking',
    points: [
      { title: 'Stock held for the order that needs it', text: 'Releasing an order to picking reserves its units, so two orders can’t promise the same stock.' },
      { title: 'Deliveries counted in at the dock', text: 'Receive line by line. Anything short or over is noted, and what arrived goes straight onto the shelf.' },
      { title: 'Bundles sold as one product', text: 'Group products into a bundle and see how many you can put together from what is available.' },
    ],
    chips: { label: 'Sales order flow', items: ['New', 'Picking', 'Packed', 'Shipped'], steps: true },
  },
  {
    id: 'cafes',
    icon: Coffee,
    name: 'Cafés',
    title: 'For Cafés & Restaurants',
    text: 'Recipes that use up ingredients, tickets from counter to served.',
    lead: 'Build your menu from recipes, and every ticket takes its ingredients off the fridge and pantry counts as it goes out.',
    image: 'cafe',
    points: [
      { title: 'Recipes that know what you have left', text: 'Each menu item lists its ingredients, so you can see how many more you can make right now.' },
      { title: 'Ingredients used when they really are', text: 'Starting a ticket sets its ingredients aside, and serving it takes them off the count.' },
      { title: 'Supplier drop-offs without the guesswork', text: 'Running-low ingredients are flagged, and you can reorder them all in one go, grouped by supplier.' },
    ],
    chips: { label: 'Ticket flow', items: ['New', 'Preparing', 'Served'], steps: true },
  },
  {
    id: 'trades',
    icon: Wrench,
    name: 'Trades',
    title: 'For Trades & Field Service',
    text: 'Depot, vans and job sites. Materials logged against every job.',
    lead: 'Keep the depot, every van and each site store on one map, and always know which materials went to which job.',
    image: 'trades',
    points: [
      { title: 'Stock tracked wherever it travels', text: 'Depot shelves, van racks and site stores are locations of their own, so a count means something.' },
      { title: 'Materials booked with the job', text: 'Booking a job sets its materials aside, and your crew logs what they use while they’re on site.' },
      { title: 'Job kits ready to grab', text: 'Group what a common job needs into a kit and see how many you can make up from the shelves.' },
    ],
    chips: { label: 'Job flow', items: ['Quoted', 'Scheduled', 'In progress', 'Done'], steps: true },
  },
  {
    id: 'owners',
    icon: Building2,
    name: 'Owners',
    title: 'For Multi-business Owners',
    text: 'Run every business from one login, each in its own words.',
    lead: 'Own a warehouse and a café? One login runs both, and each one keeps its own stock, team and way of working.',
    image: 'today',
    points: [
      { title: 'One account, every business', text: 'Own or join as many as you need, and switch between them in a click from the sidebar.' },
      { title: 'Each business speaks its own language', text: 'Pick a type and get the right labels, order flow, storage layout and roles from the first day.' },
      { title: 'Nothing crosses over', text: 'Stock, staff and settings stay inside their own business, however many you run.' },
    ],
    chips: { label: 'Business types', items: ['Retail / e-commerce', 'Café / restaurant', 'Trades / agency'] },
  },
  {
    id: 'teams',
    icon: Users,
    name: 'Teams',
    title: 'For Growing Teams',
    text: 'Invite staff with a role and see who did what, and when.',
    lead: 'Bring new people on with a link and a role, and keep a clear record of who did what as the team grows.',
    image: 'history',
    points: [
      { title: 'Invites that come with a role', text: 'Send a one-time link with a role from your business type, such as picker, barista or technician.' },
      { title: 'The right access for the job', text: 'Managers run the catalogue and settings, and everyone can work orders and stock.' },
      { title: 'Every change has a name on it', text: 'Counts, moves and adjustments are all written to the history with who made them and when.' },
    ],
    chips: { label: 'Roles you can give', items: ['Manager', 'Picker', 'Barista', 'Chef', 'Technician'] },
  },
  {
    id: 'operations',
    icon: Activity,
    name: 'Operations',
    title: 'For Operations Leads',
    text: 'One live view of stock, orders and deliveries as they happen.',
    lead: 'See the whole operation in one place instead of chasing updates, from what is on the shelf to what is on the road.',
    image: 'dock',
    points: [
      { title: 'A live world of your business', text: 'Every shelf, truck and ticket is drawn from your own records and moves as your team works.' },
      { title: 'Everyone looking at the same numbers', text: 'Changes reach every open screen the moment they happen, with no refresh button.' },
      { title: 'Problems raised before they cost you', text: 'Items below their reorder level are flagged straight away, and today’s numbers sit on one dashboard.' },
    ],
    chips: { label: 'Where you’ll see it', items: ['Live world', 'Dashboard', 'Activity history'] },
  },
];

/**
 * Features, pricing and FAQ are pages; `/#…` links scroll to a section of the front page from anywhere.
 * `wideOnly` links leave the bar below 1024px, where they don't fit; the footer and the phone menu still have them.
 */
export const NAV_LINKS: { label: string; href: string; wideOnly?: boolean }[] = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact us', href: '/contact', wideOnly: true },
];

/** The contact page's details and the inbox its form writes to. Placeholders: set the real ones before launch. */
export const CONTACT = {
  email: 'hello@example.com',
  phone: '+1 (555) 000-0000',
  office: 'Your office address, City',
};

export const FEATURES: FeatureType[] = [
  { icon: Boxes, title: 'A live world of your business', text: 'Every shelf, truck and ticket is drawn from your own records and moves as your team works.' },
  { icon: RadioTower, title: 'Everyone in sync', text: 'Changes reach every open screen of your business the moment they happen. No refresh button.' },
  { icon: Zap, title: 'Instant, and honest about it', text: 'Stock moves and order steps show at once. If the server says no, the screen rolls back and tells you why.' },
  { icon: Workflow, title: 'Orders that follow your flow', text: 'New → Picking → Packed → Shipped, or Quoted → Scheduled → Done. Stock is reserved and used at the right step.' },
  { icon: Truck, title: 'Deliveries and reordering', text: 'Book incoming stock, or reorder everything that is running low in one go, grouped by supplier.' },
  { icon: FileSpreadsheet, title: 'Import and a full history', text: 'Bring your catalogue in from a CSV with a row-by-row preview. Every change is logged with who made it.' },
];

export const FAQS: FaqType[] = [
  {
    q: 'Which businesses is StockMotion built for?',
    a: 'Retail and e-commerce warehouses, cafés and restaurants, and trades or field-service teams. Each gets its own vocabulary, order flow, storage layout and live world.',
  },
  { q: 'Can I run more than one business?', a: 'Yes. One account can own or join several businesses and switch between them in a click. Each business keeps its own stock, team and settings.' },
  { q: 'How do I bring my existing stock in?', a: 'Upload a CSV. You see a preview of every row — what will be created, updated or rejected and why — before anything is saved.' },
  { q: 'Does my team see changes live?', a: 'Yes. When someone picks an order, receives a delivery or adjusts stock, every open screen of that business updates straight away.' },
  { q: 'What do my staff get access to?', a: 'Owners invite staff with a one-time link and a role from your business type — picker, barista, technician and so on. Managers run the catalogue and settings; everyone works orders and stock.' },
  { q: 'Do I need to install anything?', a: 'No. StockMotion runs in the browser on desktops, tablets and phones.' },
];

export type FooterColumnType = { title: string; links: { label: string; href: string }[] };

export const FOOTER_COLUMNS: FooterColumnType[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
  { title: 'Built for', links: USE_CASES.slice(0, 4).map((u) => ({ label: u.title.replace(/^For /, ''), href: `/#${u.id}` })) },
];

/** Illustrated moments (public/landing/scenarios), each an everyday problem StockMotion handles: the hero's carousel and the features page. */
export type ScenarioType = { image: string; area: string; title: string; text: string; alt: string };

export const SCENARIOS: ScenarioType[] = [
  { image: 'shortages', area: 'Stock alerts', title: 'Shortages caught before a sale is lost', text: 'Items that drop below their reorder point are flagged the moment it happens, and everything running low can be reordered in one go, grouped by supplier.', alt: 'Illustration: a warehouse aisle with an empty bin pinned in red and a notice that a reorder has been booked.' },
  { image: 'dock', area: 'Deliveries', title: 'Every truck tracked to its dock door', text: 'Incoming deliveries line up at the dock doors in the order they are due — scheduled, in transit or arrived — so the team knows what is next.', alt: 'Illustration: a truck backed into door 1 while the next delivery is on the road, each labelled with its status.' },
  { image: 'cafe', area: 'Cafés', title: 'Tickets and ingredients kept in step', text: 'Tickets move from the counter to served, and the ingredients their recipes use come off the fridge and pantry counts as they go.', alt: 'Illustration: a café counter preparing a ticket, a fridge flagged low on oat milk, and a served-ticket notice.' },
  { image: 'trades', area: 'Trades', title: 'Materials on the van, jobs on the map', text: 'The depot, every van and every job site sit on one map, and the materials used are logged against the job they went to.', alt: 'Illustration: a van parked at a job site under scaffolding, a second van on the road, and materials logged to the job.' },
  { image: 'picking', area: 'Orders', title: 'Pick, pack and ship without paper', text: 'Orders step through your own flow, from new to shipped, with stock reserved when it is picked and used when it leaves.', alt: 'Illustration: a packer at the bench with one order being picked and another packed and ready to ship.' },
  { image: 'history', area: 'History', title: 'Every stock change — who and why', text: 'Every count, move and adjustment is written to the history with who made it and when — nothing changes without a trace.', alt: 'Illustration: a shelf count being updated beside a history panel listing each change, who made it and when.' },
  { image: 'receiving', area: 'Receiving', title: 'Deliveries counted in, line by line', text: 'Deliveries are counted in line by line. Anything short or over is noted, and what arrived goes straight onto the shelf.', alt: 'Illustration: pallets counted in at the dock door from a delivery truck, with a delivery-received notice.' },
  { image: 'today', area: 'Dashboard', title: 'Today’s numbers at a glance', text: 'The dashboard sums up the day: orders and revenue, what is low or out, and the deliveries on their way.', alt: 'Illustration: a warehouse with an order shipping, beside a panel of today’s revenue, orders, low stock and arrivals.' },
];
