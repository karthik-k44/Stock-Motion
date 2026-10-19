import type { UserResponseType, UserRoleTypeEnum } from '@/frontend/features/users/types';
import { crewStore, type CrewStep } from './crew-store';
import { locationCenterX, PACK_X, SHIP_DOOR_X, STAGING_X } from './layout';

/** Find the character for a role (falls back to the first user). */
export function ByRole(users: UserResponseType[], role: UserRoleTypeEnum): string | undefined {
  return (users.find((u) => u.role === role) ?? users[0])?.id;
}

const xOf = (location: string | null | undefined) => (location ? locationCenterX(location) : 1300);

/** Choreography for each kind of warehouse event. */
export const crewRoutines = {
  Inspect(userId: string, location: string | null, label: string) {
    crewStore.Run(userId, [{ k: 'say', text: label }, { k: 'walk', x: xOf(location) }, { k: 'wait', ms: 1800 }, { k: 'say', text: null }]);
  },

  Allocate(pickerId: string, orderId: string, firstLocation: string | undefined) {
    crewStore.Run(pickerId, [
      { k: 'say', text: `${orderId} released — on my way` },
      { k: 'walk', x: xOf(firstLocation) },
      { k: 'wait', ms: 1200 },
      { k: 'say', text: null },
    ]);
  },

  Pick(pickerId: string, orderId: string, skus: string[], locations: string[]) {
    const steps: CrewStep[] = [];
    skus.forEach((sku, i) => steps.push({ k: 'say', text: `Picking ${sku} · ${orderId}` }, { k: 'walk', x: xOf(locations[i]) }, { k: 'wait', ms: 1000 }));
    steps.push(
      { k: 'carry', on: true },
      { k: 'say', text: `To packing · ${orderId}` },
      { k: 'walk', x: PACK_X - 70 },
      { k: 'carry', on: false },
      { k: 'wait', ms: 500 },
      { k: 'say', text: null },
    );
    crewStore.Run(pickerId, steps);
  },

  Pack(packerId: string, orderId: string) {
    crewStore.Run(packerId, [
      { k: 'say', text: `Packing ${orderId}` },
      { k: 'walk', x: PACK_X + 40 },
      { k: 'wait', ms: 2400 },
      { k: 'say', text: `${orderId} packed ✓` },
      { k: 'wait', ms: 1400 },
      { k: 'say', text: null },
    ]);
  },

  Ship(packerId: string, orderId: string) {
    crewStore.Run(packerId, [
      { k: 'say', text: `Dispatching ${orderId}` },
      { k: 'walk', x: PACK_X + 60 },
      { k: 'carry', on: true },
      { k: 'walk', x: SHIP_DOOR_X - 30 },
      { k: 'wait', ms: 600 },
      { k: 'carry', on: false },
      { k: 'say', text: `${orderId} on its way` },
      { k: 'walk', x: 3520 },
      { k: 'say', text: null },
    ]);
  },

  Relocate(forkliftId: string, sku: string, from: string | undefined, to: string | undefined) {
    crewStore.Run(forkliftId, [
      { k: 'say', text: `Moving ${sku} → ${to}` },
      { k: 'walk', x: xOf(from) },
      { k: 'wait', ms: 600 },
      { k: 'carry', on: true },
      { k: 'walk', x: xOf(to) },
      { k: 'wait', ms: 600 },
      { k: 'carry', on: false },
      { k: 'say', text: null },
    ]);
  },

  /* ---- delivery sequence ---- */

  TruckApproach(receiverId: string, forkliftId: string, truck: string) {
    crewStore.Run(receiverId, [{ k: 'say', text: `Guiding ${truck} into Dock 1` }, { k: 'walk', x: STAGING_X - 30 }], 20000);
    crewStore.Run(forkliftId, [{ k: 'say', text: 'Standing by to unload' }, { k: 'walk', x: 900 }], 20000);
  },

  TruckParked(receiverId: string) {
    crewStore.Then(receiverId, [{ k: 'say', text: 'Opening dock door' }]);
  },

  TruckUnload(receiverId: string, forkliftId: string, deliveryId: string, lineCount: number) {
    const steps: CrewStep[] = [{ k: 'say', text: `Unloading ${deliveryId}` }];
    for (let i = 0; i < lineCount; i++) {
      steps.push({ k: 'walk', x: 704 }, { k: 'carry', on: true }, { k: 'walk', x: STAGING_X + 20 + i * 58 }, { k: 'carry', on: false });
    }
    crewStore.Run(receiverId, steps, 20000);
    crewStore.Run(forkliftId, [
      { k: 'say', text: 'Moving pallets to staging' },
      { k: 'walk', x: 730 },
      { k: 'carry', on: true },
      { k: 'walk', x: 1040 },
      { k: 'carry', on: false },
      { k: 'walk', x: 730 },
    ], 20000);
  },

  TruckReceived(receiverId: string, forkliftId: string, label: string, putAway: { sku: string; location: string | null } | null) {
    crewStore.Run(receiverId, [{ k: 'say', text: label }, { k: 'wait', ms: 2600 }, { k: 'say', text: null }]);
    if (!putAway) return;
    crewStore.Run(forkliftId, [
      { k: 'say', text: `Putting away ${putAway.sku}` },
      { k: 'walk', x: 1000 },
      { k: 'carry', on: true },
      { k: 'walk', x: xOf(putAway.location) },
      { k: 'wait', ms: 900 },
      { k: 'carry', on: false },
      { k: 'say', text: null },
      { k: 'walk', x: 940 },
    ]);
  },
};
