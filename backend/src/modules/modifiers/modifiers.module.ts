import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ModifiersController } from './modifiers.controller';
import { ModifiersService } from './modifiers.service';

@Module({
  controllers: [ModifiersController],
  providers: [ModifiersService, RolesGuard],
  exports: [ModifiersService],
})
export class ModifiersModule {}
