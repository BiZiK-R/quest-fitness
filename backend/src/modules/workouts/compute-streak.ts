import { WorkoutStatus } from '@prisma/client';

export type WorkoutStreakInput = {
  id: string;
  scheduledAt: Date | string;
  status: WorkoutStatus;
};

/**
 * Derives client workout streak from ordered history (AD-16 / FR-20).
 * `pending` is transparent; `skipped`/`cancelled` reset to 0; attended ramps 0→2→+1 after reset.
 */
export function computeStreak(workouts: WorkoutStreakInput[]): number {
  const sorted = [...workouts].sort((a, b) => {
    const ta = new Date(a.scheduledAt).getTime();
    const tb = new Date(b.scheduledAt).getTime();
    if (ta !== tb) {
      return ta - tb;
    }
    return a.id.localeCompare(b.id);
  });

  let streak = 0;
  let needsRamp = false;
  let rampStep = 0;

  for (const workout of sorted) {
    switch (workout.status) {
      case WorkoutStatus.pending:
        break;
      case WorkoutStatus.skipped:
      case WorkoutStatus.cancelled:
        streak = 0;
        needsRamp = true;
        rampStep = 0;
        break;
      case WorkoutStatus.attended:
        if (needsRamp) {
          if (rampStep === 0) {
            streak = 0;
            rampStep = 1;
          } else if (rampStep === 1) {
            streak = 2;
            rampStep = 2;
            needsRamp = false;
          } else {
            streak += 1;
          }
        } else {
          streak += 1;
        }
        break;
      default:
        break;
    }
  }

  return streak;
}
