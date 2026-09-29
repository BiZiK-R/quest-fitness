import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
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
import { ClientsService } from './clients.service';
import { ClientListResponseDto } from './dto/client-list-response.dto';
import { ClientProfileDto } from './dto/client-profile.dto';
import { CreateClientRequestDto } from './dto/create-client-request.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBody({ type: () => CreateClientRequestDto })
  @ApiCreatedResponse({ type: ClientProfileDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async create(@Body() body: CreateClientRequestDto): Promise<ClientProfileDto> {
    return this.clientsService.create(body.displayName);
  }

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: ClientListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<ClientListResponseDto> {
    const clients = await this.clientsService.listPool();
    return { clients };
  }
}
