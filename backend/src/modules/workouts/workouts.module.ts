import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { MembershipModule } from '../membership/membership.module';
import { WorkoutIdempotencyService } from './workout-idempotency.service';
import { WorkoutActionsController } from './workout-actions.controller';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [ClientsLockModule, MembershipModule],
  controllers: [WorkoutsController, WorkoutActionsController],
  providers: [WorkoutsService, WorkoutIdempotencyService, RolesGuard],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
