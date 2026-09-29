/**
 * Absolute session end time from server start anchor (AD-8).
 */
export function computeSessionEndsAt(startedAtIso: string, plannedDurationMinutes: number): number {
  const startedMs = new Date(startedAtIso).getTime();
  return startedMs + plannedDurationMinutes * 60_000;
}

/**
 * Remaining milliseconds until endsAt from a fixed wall-clock instant.
 */
export function remainingMsUntilEndsAt(endsAtMs: number, nowMs: number): number {
  return Math.max(0, endsAtMs - nowMs);
}
