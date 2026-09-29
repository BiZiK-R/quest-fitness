import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TrainerPingResponseDto } from './dto/trainer-ping-response.dto';

@ApiTags('trainer')
@Controller('trainer')
export class TrainerPingController {
  @Get('ping')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: TrainerPingResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  ping(): TrainerPingResponseDto {
    return { ok: true };
  }
}
