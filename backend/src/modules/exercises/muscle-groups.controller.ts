import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MuscleGroupListResponseDto } from './dto/muscle-group.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('exercises')
@Controller('muscle-groups')
export class MuscleGroupsController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: MuscleGroupListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<MuscleGroupListResponseDto> {
    const muscleGroups = await this.exercisesService.listMuscleGroups();
    return { muscleGroups };
  }
}
