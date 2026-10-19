import type { TemplateResponseType } from '@/frontend/features/businesses/types';
import type { DashboardResponseType } from '@/frontend/features/dashboard/types';
import type { LocationResponseType } from '@/frontend/features/locations/types';

/** Everything an object's stats card can read. Live: re-read whenever the data refreshes. */
export type WorldContextType = {
  dashboard: DashboardResponseType;
  locations: LocationResponseType[];
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
  model: ModelKindType;
  position: XZType;
  /** Y rotation in radians */
  rotation?: number;
  /** The storage zone this object stands for (its shelves show that zone's real stock) */
  zone?: string;
  /** A closed loop the model drives along while `moving` says so; otherwise it waits at `position`. */
  route?: XZType[];
  moving?: (ctx: WorldContextType) => boolean;
  /** How many copies to draw (tables, houses), from live data */
  count?: (ctx: WorldContextType) => number;
  stats: (ctx: WorldContextType) => WorldStatType[];
  /** A warning shown on the card, and the object pulses red */
  alert?: (ctx: WorldContextType) => string | null;
  link?: { label: string; to: string };
  color?: string;
};

export type WorldLayoutType = {
  size: XZType;
  palette: { ground: string; floor: string; wall: string; accent: string; trim: string; road: string };
  /** The building's floor slab (low cut-away walls are drawn on its back and left edges) */
  building: { center: XZType; size: XZType };
  /** People walking loops; the count follows the team size */
  walkers: XZType[][];
  road?: XZType[];
  trees: XZType[];
  objects: WorldObjectSpecType[];
};

/** Every world type under one name. */
export type TWorldType = {
  Context: WorldContextType;
  Stat: WorldStatType;
  ModelKind: ModelKindType;
  ObjectSpec: WorldObjectSpecType;
  Layout: WorldLayoutType;
};
