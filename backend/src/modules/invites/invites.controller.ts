import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
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
import { ActiveInviteStatusDto } from './dto/active-invite-status.dto';
import { IssueInviteResponseDto } from './dto/issue-invite-response.dto';
import { InvitesService } from './invites.service';

@ApiTags('invites')
@Controller('clients/:clientId/invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'clientId', type: String })
  @ApiCreatedResponse({ type: IssueInviteResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async issue(
    @Param('clientId') clientId: string,
    @Req() req: Request,
  ): Promise<IssueInviteResponseDto> {
    return this.invitesService.issue(clientId, req.user!.id);
  }

  @Get('active')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'clientId', type: String })
  @ApiOkResponse({ type: ActiveInviteStatusDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async activeStatus(
    @Param('clientId') clientId: string,
  ): Promise<ActiveInviteStatusDto> {
    return this.invitesService.getActiveStatus(clientId);
  }
}
