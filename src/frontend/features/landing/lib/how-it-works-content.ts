import { BellRing, Boxes, Coffee, History, Layers, RadioTower, Store, Wrench, Zap, type LucideIcon } from 'lucide-react';

/**
 * Every word on the How it works page. Each line describes what the app really does: the flows, words and roles under
 * "Your business" mirror the templates in src/backend/modules/templates/definitions, so change them together.
 */
export type SetupStepType = { icon: string; title: string; you: string; app: string };
export type JourneyStageType = { image: string; area: string; title: string; you: string; app: string; shows: string };
export type FlowStageType = { label: string; note: string };
export type BusinessFlowType = { id: string; label: string; icon: LucideIcon; order: string; flow: FlowStageType[]; words: { label: string; value: string }[] };
export type SafeguardType = { icon: LucideIcon; title: string; text: string };

export const SETUP_STEPS: SetupStepType[] = [
  {
    icon: 'launch',
    title: 'Pick your kind of business',
    you: 'Choose retail, café or trades and give your business a name.',
    app: 'Sets up your words, your order flow, your storage and your team roles.',
  },
  {
    icon: 'import',
    title: 'Add what you stock',
    you: 'Import a spreadsheet or add items by hand, and give each one a home.',
    app: 'Previews every CSV row before anything is saved: created, updated or rejected, and why.',
  },
  {
    icon: 'realtime',
    title: 'Bring your team in',
    you: 'Invite staff with a one-time link and a role, such as picker, barista or technician.',
    app: 'Gives everyone the same live numbers. Managers run the catalogue and settings; everyone works orders and stock.',
  },
];

/** `shows` is a sample of what the whole team sees at that step. */
export const JOURNEY: JourneyStageType[] = [
  {
    image: 'dock',
    area: 'Incoming',
    title: 'A delivery gets booked',
    you: 'Book incoming stock from a supplier, or reorder everything running low in one go.',
    app: 'Groups a reorder into one delivery per supplier, and allows for what is already on its way.',
    shows: 'DLV-2042 on the way · 14:30',
  },
  {
    image: 'receiving',
    area: 'Receiving',
    title: 'It arrives and gets counted in',
    you: 'Mark the delivery arrived, then count it in line by line.',
    app: 'Notes anything short or over, and puts what arrived straight onto the shelf.',
    shows: 'DLV-2041 received · 260 units',
  },
  {
    image: 'history',
    area: 'Storage',
    title: 'Every item has a home',
    you: 'Keep each item in a bin, on a fridge shelf or in a van, and log any moves or adjustments.',
    app: 'Writes every change to the history, with who made it and when.',
    shows: 'Aisle B, shelf 3 · 24 on hand',
  },
  {
    image: 'today',
    area: 'Orders',
    title: 'An order comes in and stock is held',
    you: 'Add the order, then move it to the stage where the work starts.',
    app: 'Checks the stock is available and reserves it, so the same item is not promised twice.',
    shows: 'SO-10231 · stock reserved',
  },
  {
    image: 'picking',
    area: 'Fulfilment',
    title: 'It is picked, packed and sent',
    you: 'Step the order through your flow, marking lines off as you go.',
    app: 'Takes the stock off, and counts the order towards revenue when it closes. Selling a made item uses up its parts.',
    shows: 'SO-10234 packed · ready to ship',
  },
  {
    image: 'shortages',
    area: 'Alerts',
    title: 'Running low? The loop starts again',
    you: 'Check your stock alerts and reorder what you need in one go.',
    app: 'Flags every item below its reorder point, the moment it drops there.',
    shows: 'Oat milk · 3 left',
  },
];

export const BUSINESS_FLOWS: BusinessFlowType[] = [
  {
    id: 'retail',
    label: 'Retail',
    icon: Store,
    order: 'A sales order',
    flow: [
      { label: 'New', note: 'Nothing held yet' },
      { label: 'Picking', note: 'Stock reserved, then picked line by line' },
      { label: 'Packed', note: 'Every line is done' },
      { label: 'Shipped', note: 'Counts towards revenue' },
    ],
    words: [
      { label: 'What you stock', value: 'Products' },
      { label: 'Built from parts', value: 'Bundles' },
      { label: 'The work', value: 'Sales orders' },
      { label: 'Coming in', value: 'Incoming deliveries' },
      { label: 'Bought from', value: 'Suppliers' },
      { label: 'Kept in', value: 'Aisles A to D, by shelf and bin' },
      { label: 'Your team', value: 'Owner, inventory manager, picker, packer, receiving lead, forklift operator' },
    ],
  },
  {
    id: 'cafes',
    label: 'Cafés',
    icon: Coffee,
    order: 'A ticket',
    flow: [
      { label: 'New', note: 'Nothing held yet' },
      { label: 'Preparing', note: 'Ingredients reserved' },
      { label: 'Served', note: 'Ingredients used up, recipe by recipe' },
    ],
    words: [
      { label: 'What you stock', value: 'Ingredients & stock' },
      { label: 'Built from parts', value: 'Menu items' },
      { label: 'The work', value: 'Tickets' },
      { label: 'Coming in', value: 'Supplier drop-offs' },
      { label: 'Bought from', value: 'Suppliers' },
      { label: 'Kept in', value: 'Dry store, walk-in fridge, freezer, coffee bar and front counter' },
      { label: 'Your team', value: 'Owner, manager, barista, chef, server' },
    ],
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: Wrench,
    order: 'A job',
    flow: [
      { label: 'Quoted', note: 'Nothing held yet' },
      { label: 'Scheduled', note: 'Materials reserved' },
      { label: 'In progress', note: 'Materials logged as they are used' },
      { label: 'Done', note: 'Counts towards revenue' },
    ],
    words: [
      { label: 'What you stock', value: 'Materials' },
      { label: 'Built from parts', value: 'Job kits' },
      { label: 'The work', value: 'Jobs' },
      { label: 'Coming in', value: 'Purchase orders' },
      { label: 'Bought from', value: 'Merchants' },
      { label: 'Kept in', value: 'Depot shelves, vans and the site store' },
      { label: 'Your team', value: 'Owner, office manager, technician, apprentice' },
    ],
  },
];

export const SAFEGUARDS: SafeguardType[] = [
  { icon: RadioTower, title: 'Live on every screen', text: 'When someone picks an order, receives a delivery or adjusts stock, every open screen of that business updates straight away. There is no refresh button.' },
  { icon: Layers, title: 'Held stock stays held', text: 'Reserving keeps stock on the shelf but takes it out of what is available, so what you can still promise is always clear.' },
  { icon: Zap, title: 'Instant, and honest about it', text: 'Changes show at once. If the server says no, the screen rolls back and tells you why, so nothing looks saved when it isn’t.' },
  { icon: History, title: 'A trail for every change', text: 'Every count, move and adjustment is written to the history with who made it and when. Nothing changes without a trace.' },
  { icon: BellRing, title: 'Problems flagged early', text: 'Low shelves, trucks on their way and orders mid-flow all sit in one tracker, so you see them before a customer does.' },
  { icon: Boxes, title: 'A live world of your business', text: 'A drawing of your business made only from your own records: racks, trucks at the dock doors, orders on the bench and one person per team member.' },
];
