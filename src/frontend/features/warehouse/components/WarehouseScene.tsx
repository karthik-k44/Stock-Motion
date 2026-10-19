import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inventoryService } from '@/frontend/features/inventory/services';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { ordersService } from '@/frontend/features/orders/services';
import { usersService } from '@/frontend/features/users/services';
import { useActingUser } from '@/frontend/hooks/use-acting-user';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { useMediaQuery } from '@/frontend/hooks/use-media-query';
import { useMotion } from '@/frontend/hooks/use-motion';
import { crewRoutines } from '../lib/crew-routines';
import { AISLES, aisleX, locationCenterX, zoneAt, zoneCenter } from '../lib/layout';
import { useTruck } from '../lib/truck-store';
import { BinTooltip, type TooltipState } from './BinTooltip';
import { SceneLegend } from './SceneLegend';
import { SceneStage, type SceneStageHandle } from './SceneStage';
import { SceneWorld } from './SceneWorld';
import { TruckPanel } from './TruckPanel';
import { ZoneNav } from './ZoneNav';

/** The interactive warehouse: camera + world + HUD, wired to live inventory. */
export function WarehouseScene({ focusSku, focusZone }: { focusSku: string | null; focusZone: string | null }) {
  const native = useMediaQuery('(max-width: 760px)');
  const { reduced } = useMotion();
  const stage = useRef<SceneStageHandle>(null);
  const truck = useTruck();
  const drawer = useItemDrawer();
  const { id: actingUserId } = useActingUser();
  const { data: items = [] } = inventoryService.useItems();
  const { data: packedOrders = [] } = ordersService.useOrders({ status: 'PACKED' });
  const { data: users = [] } = usersService.useUsers();

  const [zone, setZone] = useState('yard');
  const [revealed, setRevealed] = useState(0);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const hovered = useRef<{ item: ItemResponseType; el: HTMLElement } | null>(null);

  const byLocation = useMemo(() => new Map(items.filter((i) => i.location).map((i) => [i.location!, i])), [items]);
  const packed = useMemo(() => packedOrders.map((o) => o.id), [packedOrders]);

  const placeTip = useCallback(() => {
    const vp = stage.current?.viewport();
    const h = hovered.current;
    if (!vp || !h) return setTip(null);
    const v = vp.getBoundingClientRect();
    const r = h.el.getBoundingClientRect();
    const below = r.top - v.top < 190;
    const x = Math.min(Math.max(r.left - v.left + r.width / 2, 130), v.width - 130);
    setTip({ item: h.item, x, y: below ? r.bottom - v.top + 8 : r.top - v.top - 8, below });
  }, []);

  const onCamera = useCallback(
    (cam: number, viewW: number) => {
      setZone(zoneAt(cam + viewW / 2).id);
      const n = AISLES.filter((a) => aisleX(a) < cam + viewW - 60).length;
      setRevealed((prev) => Math.max(prev, n));
      if (hovered.current) placeTip();
    },
    [placeTip],
  );

  const onHover = useCallback(
    (item: ItemResponseType | null, el: HTMLElement | null) => {
      hovered.current = item && el ? { item, el } : null;
      // Keyboard focus on an off-screen bin pans the camera to it.
      const vp = stage.current?.viewport()?.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      if (item?.location && vp && r && (r.left < vp.left || r.right > vp.right)) stage.current?.jumpTo(locationCenterX(item.location));
      placeTip();
    },
    [placeTip],
  );

  const openItem = drawer.open;
  const onSelect = useCallback(
    (item: ItemResponseType) => {
      openItem(item.sku);
      crewRoutines.Inspect(actingUserId, item.location, `Checking ${item.location ?? item.sku}`);
    },
    [openItem, actingUserId],
  );

  // "Show in warehouse": pan to the item's bin and spotlight it.
  const focusLocation = items.find((i) => i.sku === focusSku)?.location ?? null;
  useEffect(() => {
    if (!focusSku || !focusLocation) return;
    stage.current?.jumpTo(locationCenterX(focusLocation));
    setHighlight(focusSku);
    const t = window.setTimeout(() => setHighlight(null), 6000);
    return () => window.clearTimeout(t);
  }, [focusSku, focusLocation]);

  useEffect(() => {
    if (focusZone) stage.current?.jumpTo(zoneCenter(focusZone));
  }, [focusZone]);

  // A starting delivery pulls the camera back to the loading bay.
  useEffect(() => {
    if (truck.phase === 'APPROACHING') stage.current?.jumpTo(zoneCenter('yard'));
  }, [truck.phase, truck.runId]);

  return (
    <SceneStage
      ref={stage}
      native={native}
      reduced={reduced}
      onCamera={onCamera}
      hudTop={
        <>
          <ZoneNav zone={zone} onJump={(x) => stage.current?.jumpTo(x)} />
          <TruckPanel />
        </>
      }
      hudBottom={
        <>
          <SceneLegend />
          {!native && zone === 'yard' && truck.phase === 'IDLE' && (
            <p className="scroll-hint" aria-hidden>
              Scroll to walk into the warehouse ↓
            </p>
          )}
        </>
      }
      overlay={<BinTooltip state={tip} />}
    >
      <SceneWorld
        truck={truck}
        byLocation={byLocation}
        revealed={reduced ? AISLES.length : revealed}
        highlightSku={highlight}
        packed={packed}
        users={users}
        actingUserId={actingUserId}
        onHover={onHover}
        onSelect={onSelect}
      />
    </SceneStage>
  );
}
