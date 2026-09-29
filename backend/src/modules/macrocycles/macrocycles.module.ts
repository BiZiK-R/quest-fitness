import { Module } from '@nestjs/common';
import { MacrocyclesController } from './macrocycles.controller';
import { MacrocyclesService } from './macrocycles.service';

@Module({
  controllers: [MacrocyclesController],
  providers: [MacrocyclesService],
})
export class MacrocyclesModule {}
