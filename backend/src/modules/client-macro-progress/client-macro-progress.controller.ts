import { Body, Controller, Param, Patch, Put, Req, UseGuards } from '@nestjs/common';
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
import { ClientMacroProgressService } from './client-macro-progress.service';
import { AssignClientMacroProgressRequestDto } from './dto/assign-client-macro-progress-request.dto';
import { ClientMacroProgressSummaryDto } from './dto/client-macro-progress-summary.dto';
import { PatchClientMacroProgressRequestDto } from './dto/patch-client-macro-progress-request.dto';

@ApiTags('client-macro-progress')
@Controller('clients/:id/macro-progress')
export class ClientMacroProgressController {
  constructor(private readonly clientMacroProgressService: ClientMacroProgressService) {}

  @Put()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Client profile id' })
  @ApiBody({ type: () => AssignClientMacroProgressRequestDto })
  @ApiOkResponse({ type: ClientMacroProgressSummaryDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async assign(
    @Param('id') clientId: string,
    @Body() body: AssignClientMacroProgressRequestDto,
    @Req() req: Request,
  ): Promise<ClientMacroProgressSummaryDto> {
    return this.clientMacroProgressService.assign(clientId, req.user!.id, body);
  }

  @Patch()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String, description: 'Client profile id' })
  @ApiBody({ type: () => PatchClientMacroProgressRequestDto })
  @ApiOkResponse({ type: ClientMacroProgressSummaryDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async overrideStage(
    @Param('id') clientId: string,
    @Body() body: PatchClientMacroProgressRequestDto,
    @Req() req: Request,
  ): Promise<ClientMacroProgressSummaryDto> {
    return this.clientMacroProgressService.overrideStage(
      clientId,
      req.user!.id,
      body.currentStageId,
    );
  }
}
