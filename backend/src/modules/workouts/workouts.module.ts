import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { WorkoutIdempotencyService } from './workout-idempotency.service';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [ClientsLockModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutIdempotencyService, RolesGuard],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
