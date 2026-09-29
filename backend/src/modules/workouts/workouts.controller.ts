import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { AssignWorkoutRequestDto } from './dto/assign-workout-request.dto';
import { WorkoutDto, WorkoutListResponseDto } from './dto/workout.dto';
import { WorkoutsService } from './workouts.service';

@ApiTags('workouts')
@Controller('clients/:id/workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Client profile id' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({ type: () => AssignWorkoutRequestDto })
  @ApiCreatedResponse({ type: WorkoutDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async assign(
    @Param('id') clientId: string,
    @Body() body: AssignWorkoutRequestDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request,
  ): Promise<WorkoutDto> {
    return this.workoutsService.assign(clientId, req.user!.id, idempotencyKey, body);
  }

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Client profile id' })
  @ApiOkResponse({ type: WorkoutListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async list(@Param('id') clientId: string): Promise<WorkoutListResponseDto> {
    const workouts = await this.workoutsService.listForClient(clientId);
    return { workouts };
  }
}
