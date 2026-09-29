import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { ClientMacroProgressModule } from '../client-macro-progress/client-macro-progress.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [ClientsLockModule, ClientMacroProgressModule],
  controllers: [ClientsController],
  providers: [ClientsService, RolesGuard],
})
export class ClientsModule {}
