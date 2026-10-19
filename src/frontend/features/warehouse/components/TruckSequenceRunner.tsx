import { useEffect, useRef } from 'react';
import { deliveriesService } from '@/frontend/features/deliveries/services';
import { usersService } from '@/frontend/features/users/services';
import { UserRoleTypeEnum } from '@/frontend/features/users/types';
import { useMotion } from '@/frontend/hooks/use-motion';
import { ByRole, crewRoutines } from '../lib/crew-routines';
import { truckStore, useTruck } from '../lib/truck-store';

const TIMINGS = {
  full: { approach: 3000, park: 1500, perLine: 1300, received: 2600, depart: 2600 },
  reduced: { approach: 500, park: 400, perLine: 450, received: 2000, depart: 300 },
};

/**
 * Drives the Dock 1 sequence: approach → park → unload (marks the delivery
 * Unloading) → receive (stock increases on the server) → depart. Mounted once
 * at the app root so it keeps running when you change screens.
 */
export function TruckSequenceRunner() {
  const truck = useTruck();
  const { reduced } = useMotion();
  const { data: users = [] } = usersService.useUsers();
  const startUnloading = deliveriesService.useStartUnloadingMutation();
  const receive = deliveriesService.useReceiveDeliveryMutation();
  const deps = useRef({ users, reduced, startUnloading, receive });
  deps.current = { users, reduced, startUnloading, receive };

  useEffect(() => {
    const { phase, delivery, replay, quantities } = truckStore.Get();
    if (phase === 'IDLE' || !delivery) return;
    const { users, reduced, startUnloading, receive } = deps.current;
    const t = reduced ? TIMINGS.reduced : TIMINGS.full;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const receiver = ByRole(users, UserRoleTypeEnum.RECEIVING_LEAD);
    const forklift = ByRole(users, UserRoleTypeEnum.FORKLIFT_OPERATOR);
    const lineCount = Math.min(6, delivery.lines.length);

    switch (phase) {
      case 'APPROACHING':
        if (receiver && forklift) crewRoutines.TruckApproach(receiver, forklift, delivery.truck);
        later(t.approach, () => truckStore.SetPhase('PARKING'));
        break;
      case 'PARKING':
        if (receiver) crewRoutines.TruckParked(receiver);
        later(t.park, () => truckStore.SetPhase('UNLOADING'));
        break;
      case 'UNLOADING':
        if (!replay) later(0, () => startUnloading.mutate(delivery.id));
        if (receiver && forklift) crewRoutines.TruckUnload(receiver, forklift, delivery.id, lineCount);
        for (let i = 1; i <= lineCount; i++) later(t.perLine * i, () => truckStore.SetUnloaded(i));
        later(t.perLine * lineCount + 400, () => {
          if (replay) return truckStore.SetPhase('RECEIVED');
          receive
            .mutateAsync({ id: delivery.id, input: { lines: quantities } })
            .then((d) => {
              truckStore.SetDelivery(d);
              truckStore.SetPhase('RECEIVED');
            })
            .catch(() => truckStore.Fail());
        });
        break;
      case 'RECEIVED': {
        const first = delivery.lines[0];
        if (receiver && forklift) {
          crewRoutines.TruckReceived(
            receiver,
            forklift,
            replay ? 'Replay finished — dock clear' : `${delivery.id} received ✓`,
            replay || !first ? null : { sku: first.sku, location: first.location },
          );
        }
        later(t.received, () => truckStore.SetPhase('DEPARTING'));
        break;
      }
      case 'DEPARTING':
        later(t.depart, () => truckStore.SetPhase('IDLE'));
        break;
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [truck.phase, truck.runId]);

  return null;
}
