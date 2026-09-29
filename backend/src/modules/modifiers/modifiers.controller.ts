import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
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
import { CreateSetModifierRequestDto } from './dto/create-set-modifier-request.dto';
import { SetModifierDto, SetModifierListResponseDto } from './dto/set-modifier.dto';
import { ModifiersService } from './modifiers.service';

@ApiTags('modifiers')
@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: SetModifierListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<SetModifierListResponseDto> {
    const modifiers = await this.modifiersService.listActive();
    return { modifiers };
  }

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBody({ type: () => CreateSetModifierRequestDto })
  @ApiCreatedResponse({ type: SetModifierDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async create(
    @Body() body: CreateSetModifierRequestDto,
    @Req() req: Request,
  ): Promise<SetModifierDto> {
    return this.modifiersService.createCustom(req.user!.id, body);
  }

  @Post(':id/archive')
  @HttpCode(200)
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: SetModifierDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async archive(@Param('id') id: string): Promise<SetModifierDto> {
    return this.modifiersService.archive(id);
  }
}
