import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
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
import { CreateTrainerRequestDto } from './dto/create-trainer-request.dto';
import { StaffListResponseDto } from './dto/staff-list-response.dto';
import { StaffUserDto } from './dto/staff-user.dto';
import { UsersAdminService } from './users-admin.service';

@ApiTags('admin')
@Controller('admin/trainers')
export class AdminTrainersController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBody({ type: () => CreateTrainerRequestDto })
  @ApiCreatedResponse({ type: StaffUserDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async create(@Body() body: CreateTrainerRequestDto): Promise<StaffUserDto> {
    return this.usersAdminService.createTrainer(body.login, body.password);
  }

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOkResponse({ type: StaffListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<StaffListResponseDto> {
    const trainers = await this.usersAdminService.listStaff();
    return { trainers };
  }

  @HttpCode(200)
  @Post(':id/promote')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: StaffUserDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async promote(@Param('id') id: string): Promise<StaffUserDto> {
    return this.usersAdminService.promoteToAdmin(id);
  }
}
