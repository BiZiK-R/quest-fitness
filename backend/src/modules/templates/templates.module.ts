import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, RolesGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}
