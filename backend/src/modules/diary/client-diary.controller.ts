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
import { DiaryListResponseDto } from './dto/diary-list-response.dto';

@ApiTags('diary')
@Controller('clients')
export class ClientDiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get(':clientId/diary')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN, UserRole.CLIENT)
  @ApiParam({ name: 'clientId', type: String, description: 'Client profile id' })
  @ApiOkResponse({ type: DiaryListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async listForClient(
    @Param('clientId') clientId: string,
    @Req() req: Request,
  ): Promise<DiaryListResponseDto> {
    return this.diaryService.listForClient(clientId, req.user!.id, req.user!.role);
  }
}
