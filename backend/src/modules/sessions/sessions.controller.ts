import { Body, Controller, Delete, Get, HttpCode, Param, Put, Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
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
import { SessionDto } from './dto/session.dto';
import { SetDto } from './dto/set.dto';
import { UpsertSetRequestDto } from './dto/upsert-set-request.dto';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Session id' })
  @ApiOkResponse({ type: SessionDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async getById(@Param('id') sessionId: string, @Req() req: Request): Promise<SessionDto> {
    return this.sessionsService.getById(sessionId, req.user!.id);
  }

  @Put(':sessionId/sets/:setId')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'setId', type: String, description: 'Client-generated UUID' })
  @ApiBody({ type: () => UpsertSetRequestDto })
  @ApiOkResponse({ type: SetDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async upsertSet(
    @Param('sessionId') sessionId: string,
    @Param('setId') setId: string,
    @Body() body: UpsertSetRequestDto,
    @Req() req: Request,
  ): Promise<SetDto> {
    return this.sessionsService.upsertSet(sessionId, setId, req.user!.id, body);
  }

  @Delete(':sessionId/sets/:setId')
  @HttpCode(204)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'sessionId', type: String })
  @ApiParam({ name: 'setId', type: String })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async deleteSet(
    @Param('sessionId') sessionId: string,
    @Param('setId') setId: string,
    @Req() req: Request,
  ): Promise<void> {
    await this.sessionsService.deleteSet(sessionId, setId, req.user!.id);
  }
}
