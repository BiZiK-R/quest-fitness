/** Replay window for mutating POST idempotency (AD-20). */
export const IDEMPOTENCY_REPLAY_TTL_MS = 24 * 60 * 60 * 1000;

export function assignWorkoutIdempotencyScope(clientId: string): string {
  return `POST:/api/clients/${clientId}/workouts`;
}

export function skipWorkoutIdempotencyScope(workoutId: string): string {
  return `POST:/api/workouts/${workoutId}/skip`;
}

export function cancelWorkoutIdempotencyScope(workoutId: string): string {
  return `POST:/api/workouts/${workoutId}/cancel`;
}
