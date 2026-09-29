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
  ApiConflictResponse,
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
import { CreateWorkoutTemplateRequestDto } from './dto/create-workout-template-request.dto';
import { UpdateWorkoutTemplateRequestDto } from './dto/update-workout-template-request.dto';
import {
  WorkoutTemplateDto,
  WorkoutTemplateListResponseDto,
} from './dto/workout-template.dto';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiOkResponse({ type: WorkoutTemplateListResponseDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  async list(): Promise<WorkoutTemplateListResponseDto> {
    const templates = await this.templatesService.listTemplates();
    return { templates };
  }

  @Post()
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBody({ type: () => CreateWorkoutTemplateRequestDto })
  @ApiCreatedResponse({ type: WorkoutTemplateDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async create(@Body() body: CreateWorkoutTemplateRequestDto): Promise<WorkoutTemplateDto> {
    return this.templatesService.createTemplate(body);
  }

  @Get(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: WorkoutTemplateDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  async getById(@Param('id') id: string): Promise<WorkoutTemplateDto> {
    return this.templatesService.getTemplate(id);
  }

  @Patch(':id')
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: () => UpdateWorkoutTemplateRequestDto })
  @ApiOkResponse({ type: WorkoutTemplateDto })
  @ApiUnauthorizedResponse({ type: () => ErrorEnvelopeDto })
  @ApiForbiddenResponse({ type: () => ErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: () => ErrorEnvelopeDto })
  @ApiConflictResponse({ type: () => ErrorEnvelopeDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateWorkoutTemplateRequestDto,
  ): Promise<WorkoutTemplateDto> {
    return this.templatesService.updateTemplate(id, body);
  }
}
