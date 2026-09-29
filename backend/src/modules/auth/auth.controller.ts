import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { SESSION_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import {
  clearCsrfCookie,
  clearSessionCookie,
  setCsrfCookie,
  setSessionCookie,
} from './cookie.util';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { MeResponseDto } from './dto/me-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @SkipCsrf()
  @ApiBody({ type: () => LoginRequestDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ type: () => ErrorEnvelopeDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const session = await this.authService.login(body.login, body.password);
    setSessionCookie(res, session.id);
    setCsrfCookie(res, session.csrfToken);
    return { csrfToken: session.csrfToken };
  }

  @Post('logout')
  @HttpCode(200)
  @RequireSession()
  @ApiOkResponse({ type: LogoutResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const sessionId = req.session?.id ?? req.cookies?.[SESSION_COOKIE_NAME];
    if (typeof sessionId === 'string') {
      await this.authService.logout(sessionId);
    }
    clearSessionCookie(res);
    clearCsrfCookie(res);
    return { ok: true };
  }

  @Get('me')
  @RequireSession()
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  me(@Req() req: Request): MeResponseDto {
    const user = req.user!;
    return { id: user.id, login: user.login, role: user.role };
  }
}
