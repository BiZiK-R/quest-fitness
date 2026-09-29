import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { PublicInvitesController } from './public-invites.controller';

@Module({
  imports: [AuthModule],
  controllers: [InvitesController, PublicInvitesController],
  providers: [InvitesService, RolesGuard],
})
export class InvitesModule {}
