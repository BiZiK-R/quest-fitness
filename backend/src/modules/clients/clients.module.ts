import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [ClientsLockModule],
  controllers: [ClientsController],
  providers: [ClientsService, RolesGuard],
})
export class ClientsModule {}
