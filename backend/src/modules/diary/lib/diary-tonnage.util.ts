import { Prisma } from '@prisma/client';
import { setTonnageKg } from '../../sessions/lib/set-tonnage.util';

type SetWeightRow = {
  weightKg: Prisma.Decimal | null;
  reps: number | null;
};

/**
 * Aggregates set count and total tonnage for diary list/detail (read-only).
 */
export function aggregateSetTonnage(sets: SetWeightRow[]): {
  setCount: number;
  totalTonnageKg: number;
} {
  let totalTonnageKg = 0;
  for (const set of sets) {
    const weight = set.weightKg?.toNumber() ?? null;
    totalTonnageKg += setTonnageKg(weight, set.reps);
  }
  return { setCount: sets.length, totalTonnageKg };
}
