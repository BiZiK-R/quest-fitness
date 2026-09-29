import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateExerciseRequestDto } from './dto/create-exercise-request.dto';
import { ExerciseDto, ExerciseListResponseDto } from './dto/exercise.dto';
import { UpdateExerciseRequestDto } from './dto/update-exercise-request.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted exercises (admin/trainer catalog)',
  })
  @ApiOkResponse({ type: ExerciseListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(
    @Query('includeArchived') includeArchived?: string,
  ): Promise<ExerciseListResponseDto> {
    const withArchived = includeArchived === 'true';
    const exercises = await this.exercisesService.listExercises(withArchived);
    return { exercises };
  }

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBody({ type: () => CreateExerciseRequestDto })
  @ApiCreatedResponse({ type: ExerciseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async create(@Body() body: CreateExerciseRequestDto): Promise<ExerciseDto> {
    return this.exercisesService.create(body);
  }

  @Patch(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: () => UpdateExerciseRequestDto })
  @ApiOkResponse({ type: ExerciseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateExerciseRequestDto,
  ): Promise<ExerciseDto> {
    return this.exercisesService.update(id, body);
  }

  @HttpCode(200)
  @Post(':id/archive')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ExerciseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async archive(@Param('id') id: string): Promise<ExerciseDto> {
    return this.exercisesService.archive(id);
  }
}
