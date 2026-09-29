import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockController } from './clients-lock.controller';
import { ClientsLockService } from './clients-lock.service';

@Module({
  controllers: [ClientsLockController],
  providers: [ClientsLockService, RolesGuard],
  exports: [ClientsLockService],
})
export class ClientsLockModule {}
