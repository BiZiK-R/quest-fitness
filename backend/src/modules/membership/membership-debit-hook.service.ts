import { Injectable } from '@nestjs/common';

/**
 * Stage 2 membership debit extension point (AD-9).
 * Intentional no-op until billing FR-21+ is implemented.
 */
@Injectable()
export class MembershipDebitHookService {
  /** Called when a training session starts from a pending workout. */
  async onWorkoutStarted(_clientProfileId: string, _workoutId: string): Promise<void> {
    return Promise.resolve();
  }

  /** Called when a pending workout is skipped (not cancelled). */
  async onWorkoutSkipped(_clientProfileId: string, _workoutId: string): Promise<void> {
    return Promise.resolve();
  }
}
