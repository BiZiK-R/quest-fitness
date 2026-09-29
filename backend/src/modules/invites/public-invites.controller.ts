import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { setCsrfCookie, setSessionCookie } from '../auth/cookie.util';
import { InvitePreviewDto } from './dto/invite-preview.dto';
import { InviteRegisterRequestDto } from './dto/invite-register-request.dto';
import { InvitesService } from './invites.service';

@ApiTags('invites')
@Controller('invites')
export class PublicInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get(':token')
  @SkipCsrf()
  @ApiParam({ name: 'token', type: String })
  @ApiOkResponse({ type: InvitePreviewDto })
  preview(@Param('token') token: string): Promise<InvitePreviewDto> {
    return this.invitesService.getInvitePreview(token);
  }

  @Post(':token/register')
  @HttpCode(200)
  @SkipCsrf()
  @ApiParam({ name: 'token', type: String })
  @ApiBody({ type: () => InviteRegisterRequestDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async register(
    @Param('token') token: string,
    @Body() body: InviteRegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const session = await this.invitesService.registerByToken(token, body);
    setSessionCookie(res, session.id);
    setCsrfCookie(res, session.csrfToken);
    return { csrfToken: session.csrfToken };
  }
}
