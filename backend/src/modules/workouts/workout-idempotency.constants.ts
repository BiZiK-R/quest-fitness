/** Replay window for mutating POST idempotency (AD-20). */
export const IDEMPOTENCY_REPLAY_TTL_MS = 24 * 60 * 60 * 1000;

export function assignWorkoutIdempotencyScope(clientId: string): string {
  return `POST:/api/clients/${clientId}/workouts`;
}
