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

export type XZType = [number, number];

export type WorldObjectSpecType = {
  id: string;
  label: string;
  /** Short name on the scene tag (Aisle "A", "Door 1") */
  short: string;
  /** What kind of place it is, above its name in the inspector */
  kind: string;
  icon: IconName;
  /** The storage zone this object stands for (its shelves show that zone's real stock) */
  zone?: string;
  /** Records of this kind belong to this object: selecting one highlights it */
  handles?: 'deliveries' | 'orders';
  /** Tracker tabs this object matters to; its tag stays bright while one of them is open */
  tabs?: WorldTrackerTabType[];
  tag: (ctx: WorldContextType) => WorldTagType;
  stats: (ctx: WorldContextType) => WorldStatType[];
  /** A warning shown in the inspector, and a dashed red ring around the object */
  alert?: (ctx: WorldContextType) => string | null;
  link?: { label: string; to: string };
};

/** One business type's world: its clickable objects and the scene drawn from its data. */
export type WorldLayoutType = {
  objects: WorldObjectSpecType[];
  scene: (ctx: WorldContextType, team: string[]) => IsoSceneType;
};

/** One axis-aligned box: footprint x..x+w by z..z+d on the floor, from height y up by h. */
export type BoxType = { x: number; z: number; w: number; d: number; h: number; c: string; y: number };

/** Boxes drawn together; `id` makes them a clickable object. */
export type IsoGroupType = { id: string | null; parts: BoxType[] };

/** Which way a vehicle or person faces on the floor. */
export type DirType = 'x+' | 'x-' | 'z+' | 'z-';

export type SlotStatusType = 'ok' | 'low' | 'out' | 'empty';

/** Something that moves along a path: a truck on the road, a person at work. */
export type IsoMoverType = {
  key: string;
  /** Floor waypoints, axis-aligned segments */
  path: XZType[];
  /** Units per second */
  speed: number;
  /** `wrap`: drives off one end and comes back at the start (vehicles); `bounce` (default): there and back (people) */
  mode?: 'wrap' | 'bounce';
  /** Where along the path it starts, 0..1 */
  offset: number;
  /** Boxes for each heading, centred on the origin */
  build: (dir: DirType) => BoxType[];
  /** Selecting it opens this record; its tag shows `tag` */
  select?: WorldSelectionType;
  tag?: { short: string; text: string; tone: WorldToneType };
  /** Height of the tag above the floor */
  tagY?: number;
};

/** A clickable place: its floor rectangle (for the ring) and where its tag floats. */
export type IsoHotspotType = { id: string; rect: [number, number, number, number]; tagAt: [number, number, number] };

/** A map pin over something that needs someone: an empty bin, the door the next truck is heading for. */
export type IsoPinType = { key: string; at: [number, number, number]; tone: 'critical' | 'primary'; tab: WorldTrackerTabType };

/** Everything the scene draws, built from the business's records. */
export type IsoSceneType = {
  size: XZType;
  label: string;
  ground: BoxType[];
  groups: IsoGroupType[];
  movers: IsoMoverType[];
  hotspots: IsoHotspotType[];
  pins: IsoPinType[];
  /** Objects that stand for one record (a door with its delivery): clicking opens the record */
  links: Record<string, WorldSelectionType>;
  /** The object that holds a record (`delivery:DLV-2041` → `door-1`), for the highlight ring */
  owners: Record<string, string>;
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

/** How the scene is viewed: zoom 1 = whole world, quarter turns, pan in px at that zoom. */
export type ViewType = { zoom: number; turns: number; pan: XZType };

export type CameraCommandType = 'zoomIn' | 'zoomOut' | 'rotateLeft' | 'rotateRight' | 'reset';

/** Space the floating panels cover on each side of the scene, in px. */
export type InsetsType = { top: number; right: number; bottom: number; left: number };
