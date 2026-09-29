import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { MuscleGroupsController } from './muscle-groups.controller';

@Module({
  controllers: [ExercisesController, MuscleGroupsController],
  providers: [ExercisesService, RolesGuard],
  exports: [ExercisesService],
})
export class ExercisesModule {}
