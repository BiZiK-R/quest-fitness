import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockModule } from '../clients-lock/clients-lock.module';
import { ClientMacroProgressController } from './client-macro-progress.controller';
import { ClientMacroProgressService } from './client-macro-progress.service';

@Module({
  imports: [ClientsLockModule],
  controllers: [ClientMacroProgressController],
  providers: [ClientMacroProgressService, RolesGuard],
  exports: [ClientMacroProgressService],
})
export class ClientMacroProgressModule {}
