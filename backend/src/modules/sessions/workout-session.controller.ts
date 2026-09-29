import { Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
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
import { SessionDto } from './dto/session.dto';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@Controller('workouts')
export class WorkoutSessionController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post(':id/session')
  @HttpCode(201)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Workout id' })
  @ApiCreatedResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async start(@Param('id') workoutId: string, @Req() req: Request): Promise<SessionDto> {
    return this.sessionsService.startFromWorkout(workoutId, req.user!.id);
  }
}
