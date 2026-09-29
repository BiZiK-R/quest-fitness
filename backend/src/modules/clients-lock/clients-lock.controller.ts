import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
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
import { Request } from 'express';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientsLockService } from './clients-lock.service';
import { ClientLockResponseDto } from './dto/client-lock-response.dto';

@ApiTags('clients-lock')
@Controller('clients')
export class ClientsLockController {
  constructor(private readonly clientsLockService: ClientsLockService) {}

  @Post(':id/lock')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiCreatedResponse({ type: ClientLockResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async acquire(
    @Param('id') clientId: string,
    @Req() req: Request,
  ): Promise<ClientLockResponseDto> {
    return this.clientsLockService.acquire(clientId, req.user!.id);
  }

  @Post(':id/lock/heartbeat')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: ClientLockResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async heartbeat(
    @Param('id') clientId: string,
    @Req() req: Request,
  ): Promise<ClientLockResponseDto> {
    return this.clientsLockService.heartbeat(clientId, req.user!.id);
  }

  @Delete(':id/lock')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Lock released' })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async release(
    @Param('id') clientId: string,
    @Query('force') forceQuery: string | undefined,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    const force = forceQuery === 'true' || forceQuery === '1';
    await this.clientsLockService.release(
      clientId,
      req.user!.id,
      req.user!.role,
      force,
    );
    return { ok: true };
  }
}
