import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { RequireSession } from '../../common/decorators/require-session.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorEnvelopeDto } from '../../common/errors/dto/error-envelope.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMacrocycleRequestDto } from './dto/create-macrocycle-request.dto';
import { MacrocycleDto, MacrocycleListResponseDto } from './dto/macrocycle.dto';
import { UpdateMacrocycleRequestDto } from './dto/update-macrocycle-request.dto';
import { MacrocyclesService } from './macrocycles.service';

@ApiTags('macrocycles')
@Controller('macrocycles')
export class MacrocyclesController {
  constructor(private readonly macrocyclesService: MacrocyclesService) {}

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: MacrocycleListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<MacrocycleListResponseDto> {
    const macrocycles = await this.macrocyclesService.listMacrocycles();
    return { macrocycles };
  }

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBody({ type: () => CreateMacrocycleRequestDto })
  @ApiCreatedResponse({ type: MacrocycleDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async create(@Body() body: CreateMacrocycleRequestDto): Promise<MacrocycleDto> {
    return this.macrocyclesService.createMacrocycle(body);
  }

  @Get(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: MacrocycleDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async getById(@Param('id') id: string): Promise<MacrocycleDto> {
    return this.macrocyclesService.getMacrocycle(id);
  }

  @Patch(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: () => UpdateMacrocycleRequestDto })
  @ApiOkResponse({ type: MacrocycleDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMacrocycleRequestDto,
  ): Promise<MacrocycleDto> {
    return this.macrocyclesService.updateMacrocycle(id, body);
  }
}
