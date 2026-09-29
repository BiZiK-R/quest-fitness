import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
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
import { DiaryService } from './diary.service';
import { DiarySessionDetailDto } from './dto/diary-session-detail.dto';

@ApiTags('diary')
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get('sessions/:sessionId')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN, UserRole.CLIENT)
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ type: DiarySessionDetailDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async getSessionDetail(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ): Promise<DiarySessionDetailDto> {
    return this.diaryService.getSessionDetail(sessionId, req.user!.id, req.user!.role);
  }
}
