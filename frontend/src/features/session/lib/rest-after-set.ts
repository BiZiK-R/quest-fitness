/** Default rest between sets / superset rounds (seconds). */
export const DEFAULT_REST_SECONDS = 90;

export const REST_EXTEND_SECONDS = 30;

export type RestTimerExercise = {
  id: string;
  sortOrder: number;
  supersetGroupId?: string | null;
};

function sortedByOrder(exercises: RestTimerExercise[]): RestTimerExercise[] {
  return [...exercises].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Whether to start rest after a confirmed set on the exercise at sorted index.
 */
export function shouldStartRestAfterSet(exercises: RestTimerExercise[], currentIndex: number): boolean {
  const sorted = sortedByOrder(exercises);
  const current = sorted[currentIndex];
  if (!current) {
    return true;
  }
  const groupId = current.supersetGroupId;
  if (!groupId) {
    return true;
  }
  const next = sorted[currentIndex + 1];
  if (!next) {
    return true;
  }
  return next.supersetGroupId !== groupId;
}

/**
 * Next exercise index after set confirm (auto-advance within superset).
 */
export function exerciseIndexAfterSetConfirm(
  exercises: RestTimerExercise[],
  currentIndex: number,
): number {
  if (shouldStartRestAfterSet(exercises, currentIndex)) {
    return currentIndex;
  }
  return currentIndex + 1;
}

export function findExerciseIndexById(exercises: RestTimerExercise[], exerciseId: string): number {
  const sorted = sortedByOrder(exercises);
  return sorted.findIndex((e) => e.id === exerciseId);
}

/**
 * Absolute rest end from wall-clock now (AD-8 client-owned endsAt).
 */
export function computeRestEndsAt(nowMs: number, restSeconds: number = DEFAULT_REST_SECONDS): number {
  return nowMs + restSeconds * 1000;
}

export function remainingMsUntilEndsAt(endsAtMs: number, nowMs: number): number {
  return Math.max(0, endsAtMs - nowMs);
}

/** Formats remaining rest as M:SS. */
export function formatRestCountdown(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
