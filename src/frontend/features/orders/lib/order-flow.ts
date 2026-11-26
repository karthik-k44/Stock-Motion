import type { BadgeTone } from '@/frontend/components/badge';
import type { IconName } from '@/frontend/components/icon';
import type { OrderStageType } from '@/frontend/features/businesses/types';
import { OrderStatusTypeEnum, type OrderResponseType, type OrderShortageType } from '../types';

export const StageOf = (flow: OrderStageType[], status: string) => flow.find((s) => s.status === status);

export const NextStage = (flow: OrderStageType[], status: string): OrderStageType | undefined =>
  flow[flow.findIndex((s) => s.status === status) + 1];

export const StatusLabel = (flow: OrderStageType[], status: string): string => {
  if (status === OrderStatusTypeEnum.CANCELLED) return 'Cancelled';
  return StageOf(flow, status)?.label ?? status;
};

/** Badge tone and icon derived from what the stage does, so every template reads the same way. */
export const StatusLook = (flow: OrderStageType[], status: string): { tone: BadgeTone; icon: IconName } => {
  if (status === OrderStatusTypeEnum.CANCELLED) return { tone: 'neutral', icon: 'x' };
  const stage = StageOf(flow, status);
  if (!stage) return { tone: 'neutral', icon: 'orders' };
  if (stage.closed) return { tone: 'good', icon: 'check' };
  if (stage.consumeLines) return { tone: 'reserved', icon: 'box' };
  if (stage.reserves) return { tone: 'incoming', icon: 'clock' };
  if (flow.indexOf(stage) === 0) return { tone: 'info', icon: 'orders' };
  return { tone: 'warning', icon: 'package' };
};

/** Lines that count as work (services don't need picking before a stage that needs everything done). */
export const OpenLines = (o: OrderResponseType) => o.lines.filter((l) => l.kind !== 'SERVICE' && l.done < l.qty);

export const OpenUnits = (o: OrderResponseType) => o.lines.reduce((s, l) => s + l.qty - l.done, 0);

/** The order as it will look after moving to `stage` — used for the optimistic update. */
export const PredictAdvance = (o: OrderResponseType, stage: OrderStageType): OrderResponseType => {
  const lines = stage.consumeOnEnter ? o.lines.map((l) => ({ ...l, done: l.qty })) : o.lines;
  return {
    ...o,
    status: stage.status,
    reserves: stage.reserves,
    closed: stage.closed,
    closedAt: stage.closed ? new Date().toISOString() : null,
    lines,
    doneUnits: lines.reduce((s, l) => s + l.done, 0),
  };
};

/** The order after using `qty` of one line (or every open line when `sku` is omitted). */
export const PredictConsume = (o: OrderResponseType, sku?: string, qty?: number): OrderResponseType => {
  const lines = o.lines.map((l) => {
    if (sku ? l.sku !== sku : l.done >= l.qty) return l;
    return { ...l, done: Math.min(l.qty, l.done + (qty ?? l.qty - l.done)) };
  });
  return { ...o, lines, doneUnits: lines.reduce((s, l) => s + l.done, 0) };
};

/** Shortages attached to a 409 from the server, if any. */
export const ShortagesFromError = (details: unknown): OrderShortageType[] => {
  if (details && typeof details === 'object' && 'shortages' in details && Array.isArray((details as { shortages: unknown }).shortages)) {
    return (details as { shortages: OrderShortageType[] }).shortages;
  }
  return [];
};
