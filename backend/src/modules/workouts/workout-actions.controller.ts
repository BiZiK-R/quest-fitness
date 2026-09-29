import { Body, Controller, Headers, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RescheduleWorkoutRequestDto } from './dto/reschedule-workout-request.dto';
import { WorkoutDto } from './dto/workout.dto';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@Controller('workouts')
export class WorkoutActionsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post(':id/skip')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Workout id' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: WorkoutDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async skip(
    @Param('id') workoutId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ): Promise<WorkoutDto> {
    return this.workoutsService.skip(workoutId, req.user!.id, idempotencyKey);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Workout id' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: WorkoutDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async cancel(
    @Param('id') workoutId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ): Promise<WorkoutDto> {
    return this.workoutsService.cancel(workoutId, req.user!.id, idempotencyKey);
  }

  @Patch(':id')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Workout id' })
  @ApiBody({ type: () => RescheduleWorkoutRequestDto })
  @ApiOkResponse({ type: WorkoutDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async reschedule(
    @Param('id') workoutId: string,
    @Body() body: RescheduleWorkoutRequestDto,
    @Req() req: Request,
  ): Promise<WorkoutDto> {
    return this.workoutsService.reschedule(workoutId, req.user!.id, body);
  }
}
