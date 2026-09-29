import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { MembershipModule } from '../membership/membership.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { WorkoutSessionController } from './workout-session.controller';

@Module({
  imports: [ClientsLockModule, WorkoutsModule, MembershipModule],
  controllers: [SessionsController, WorkoutSessionController],
  providers: [SessionsService, RolesGuard],
  exports: [SessionsService],
})
export class SessionsModule {}
