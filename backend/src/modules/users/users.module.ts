import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminTrainersController } from './admin-trainers.controller';
import { UsersAdminService } from './users-admin.service';

@Module({
  controllers: [AdminTrainersController],
  providers: [UsersAdminService, RolesGuard],
})
export class UsersModule {}
