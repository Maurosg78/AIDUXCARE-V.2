import type { EncounterLongitudinalSnapshot } from '@/core/longitudinal/encounterLongitudinalSnapshot';
import { encountersRepo } from '@/repositories/encountersRepo';

export async function persistLongitudinalSnapshot(
  encounterId: string,
  snapshot: EncounterLongitudinalSnapshot
): Promise<void> {
  if (!encounterId) {
    return;
  }

  await encountersRepo.updateEncounter(encounterId, {
    longitudinalSnapshot: snapshot,
  });
}
