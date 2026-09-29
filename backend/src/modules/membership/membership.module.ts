import { Module } from '@nestjs/common';
import { MembershipDebitHookService } from './membership-debit-hook.service';

/** Stage 2 extension stub (AD-9); exports debit hook for Epic 6 wiring only. */
@Module({
  providers: [MembershipDebitHookService],
  exports: [MembershipDebitHookService],
})
export class MembershipModule {}
