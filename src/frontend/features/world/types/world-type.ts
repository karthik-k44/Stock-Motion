import type { BadgeTone } from '@/frontend/components/badge';
import type { IconName } from '@/frontend/components/icon';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import type { DashboardResponseType } from '@/frontend/features/dashboard/types';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';
import type { ItemResponseType, StockStatusTypeEnum } from '@/frontend/features/inventory/types';
import type { LocationResponseType } from '@/frontend/features/locations/types';
import type { OrderResponseType } from '@/frontend/features/orders/types';

/** Everything the world can read: the business's own records, nothing else. Live: re-read whenever the data refreshes. */
export type WorldContextType = {
  dashboard: DashboardResponseType;
  locations: LocationResponseType[];
  /** Open orders, newest first */
  orders: OrderResponseType[];
  /** Deliveries not yet received, soonest first */
  deliveries: DeliveryResponseType[];
  /** Every active item */
  items: ItemResponseType[];
  template: TemplateResponseType;
  currency: string;
};

/** One line on a stats card. Numbers animate when they change. */
export type WorldStatType = {
  label: string;
  value: number;
  format?: 'number' | 'money';
  /** Shown after the number, e.g. "units" */
  suffix?: string;
  tone?: 'good' | 'warning' | 'critical';
};

export type WorldToneType = BadgeTone;

/** The pill floating above an object in the scene. */
export type WorldTagType = { text: string; tone: WorldToneType };

/** What is selected: an object in the scene, or one record (shown in the inspector, its object highlighted). */
export type WorldSelectionType =
  | { kind: 'object'; id: string }
  | { kind: 'delivery'; number: string }
  | { kind: 'order'; number: string }
  | { kind: 'item'; sku: string };

export type ModelKindType =
  | 'rack'
  | 'shelf'
  | 'fridge'
  | 'freezer'
  | 'display'
  | 'pallets'
  | 'truck'
  | 'van'
  | 'bench'
  | 'office'
  | 'counter'
  | 'till'
  | 'coffee'
  | 'tables'
  | 'houses';

export type XZType = [number, number];

export type WorldObjectSpecType = {
  id: string;
  label: string;
  /** Short name on the scene tag (Aisle "A", "Till") */
  short: string;
  /** What kind of place it is, above its name in the inspector */
  kind: string;
  icon: IconName;
  model: ModelKindType;
  position: XZType;
  /** Y rotation in radians */
  rotation?: number;
  /** The storage zone this object stands for (its shelves show that zone's real stock) */
  zone?: string;
  /** Records of this kind belong to this object: selecting one highlights it */
  handles?: 'deliveries' | 'orders';
  /** A closed loop the model drives along while `moving` says so; otherwise it waits at `position`. */
  route?: XZType[];
  moving?: (ctx: WorldContextType) => boolean;
  /** Vehicles are only drawn when there is a record for them; otherwise just their marked bay */
  present?: (ctx: WorldContextType) => boolean;
  /** How many copies to draw (houses), from live data */
  count?: (ctx: WorldContextType) => number;
  tag: (ctx: WorldContextType) => WorldTagType;
  stats: (ctx: WorldContextType) => WorldStatType[];
  /** A warning shown in the inspector, and the object pulses red */
  alert?: (ctx: WorldContextType) => string | null;
  link?: { label: string; to: string };
  color?: string;
};

export type WorldLayoutType = {
  size: XZType;
  palette: { ground: string; floor: string; wall: string; accent: string; trim: string; road: string };
  /** The building's floor slab (low cut-away walls are drawn on its back and left edges) */
  building: { center: XZType; size: XZType };
  /** People walking loops: one per team member, up to the number of loops */
  walkers: XZType[][];
  road?: XZType[];
  trees: XZType[];
  objects: WorldObjectSpecType[];
};

/** A storage slot in the inspector's shelf map. */
export type WorldBinType = { code: string; status: StockStatusTypeEnum | 'EMPTY'; label: string };

/** A labelled value in the inspector. `select` makes it a link to that record. */
export type WorldFactType = { key: string; label: string; value: string; tone?: WorldToneType; select?: WorldSelectionType };

/** A button at the foot of the inspector: a page to open, or an item's detail drawer. */
export type WorldActionType = { label: string; primary?: boolean } & ({ to: string } | { item: string });

/** Everything the inspector shows for the selection. Built from records only. */
export type WorldInspectorType = {
  icon: IconName;
  eyebrow: string;
  title: string;
  subtitle: string;
  status: { label: string; tone: WorldToneType; note?: string } | null;
  progress: { value: number; max: number; label: string } | null;
  bins: { columns: number; cells: WorldBinType[] } | null;
  alert: string | null;
  stats: WorldStatType[];
  facts: WorldFactType[];
  /** Shown when `facts` is empty */
  emptyFacts?: string;
  actions: WorldActionType[];
};

/** One headline number above the scene. */
export type WorldKpiType = {
  key: string;
  label: string;
  value: number;
  format: 'number' | 'money';
  icon: IconName;
  tone: WorldToneType;
  chip: { text: string; tone: WorldToneType } | null;
  sub: string;
};

export type WorldTrackerTabType = 'deliveries' | 'orders' | 'alerts';

/** One row of the tracker list under the scene. */
export type WorldRowType = {
  key: string;
  select: WorldSelectionType;
  id: string;
  where: string;
  text: string;
  status: { label: string; tone: WorldToneType };
  /** Right-hand column: progress or timing ("6 / 20 picked", "Today 2:30 PM") */
  note: string;
  /** A bar above the note, when there is something to measure */
  progress: { value: number; max: number } | null;
};

export type CameraCommandType = { kind: 'zoomIn' | 'zoomOut' | 'rotateLeft' | 'rotateRight'; n: number };

/** Space the floating panels cover on each side of the scene, in px. */
export type InsetsType = { top: number; right: number; bottom: number; left: number };

/** Every world type under one name. */
export type TWorldType = {
  Context: WorldContextType;
  Stat: WorldStatType;
  Tone: WorldToneType;
  Tag: WorldTagType;
  Selection: WorldSelectionType;
  ModelKind: ModelKindType;
  ObjectSpec: WorldObjectSpecType;
  Layout: WorldLayoutType;
  Bin: WorldBinType;
  Fact: WorldFactType;
  Action: WorldActionType;
  Inspector: WorldInspectorType;
  Kpi: WorldKpiType;
  TrackerTab: WorldTrackerTabType;
  Row: WorldRowType;
  CameraCommand: CameraCommandType;
  Insets: InsetsType;
};
