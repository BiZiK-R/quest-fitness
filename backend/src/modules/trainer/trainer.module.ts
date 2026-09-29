import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TrainerPingController } from './trainer-ping.controller';

@Module({
  controllers: [TrainerPingController],
  providers: [RolesGuard],
})
export class TrainerModule {}
