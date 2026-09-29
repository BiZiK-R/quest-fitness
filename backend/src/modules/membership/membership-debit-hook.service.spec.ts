import { describe, expect, it } from 'vitest';
import { MembershipDebitHookService } from './membership-debit-hook.service';

describe('MembershipDebitHookService (Stage 2 no-op)', () => {
  const hook = new MembershipDebitHookService();

  it('onWorkoutStarted resolves without side effects', async () => {
    await expect(hook.onWorkoutStarted('client_1', 'wo_1')).resolves.toBeUndefined();
  });

  it('onWorkoutSkipped resolves without side effects', async () => {
    await expect(hook.onWorkoutSkipped('client_1', 'wo_1')).resolves.toBeUndefined();
  });
});
