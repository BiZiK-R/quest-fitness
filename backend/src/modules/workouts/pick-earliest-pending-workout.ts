import { WorkoutStatus } from '@prisma/client';

export type PendingWorkoutCandidate = {
  clientProfileId: string;
  scheduledAt: Date;
  status: WorkoutStatus;
};

/**
 * Earliest pending workout per client (by scheduledAt, then stable by caller order).
 */
export function pickEarliestPendingByClient<T extends PendingWorkoutCandidate>(
  rows: T[],
): Map<string, T> {
  const byClient = new Map<string, T>();
  for (const row of rows) {
    if (row.status !== WorkoutStatus.pending) {
      continue;
    }
    const existing = byClient.get(row.clientProfileId);
    if (!existing || row.scheduledAt.getTime() < existing.scheduledAt.getTime()) {
      byClient.set(row.clientProfileId, row);
    }
  }
  return byClient;
}
