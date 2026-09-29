import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateWorkoutTemplateRequestDto } from './dto/create-workout-template-request.dto';
import { UpdateWorkoutTemplateRequestDto } from './dto/update-workout-template-request.dto';
import { WorkoutTemplateDto } from './dto/workout-template.dto';
import { toWorkoutTemplateDto } from './template.mapper';

const templateInclude = {
  exercises: {
    orderBy: { sortOrder: 'asc' as const },
    include: { exercise: { select: { name: true } } },
  },
} satisfies Prisma.WorkoutTemplateInclude;

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(): Promise<WorkoutTemplateDto[]> {
    const rows = await this.prisma.workoutTemplate.findMany({
      where: { archivedAt: null },
      include: templateInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map(toWorkoutTemplateDto);
  }

  async getTemplate(id: string): Promise<WorkoutTemplateDto> {
    const row = await this.prisma.workoutTemplate.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!row) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout template not found', 404);
    }
    return toWorkoutTemplateDto(row);
  }

  async createTemplate(body: CreateWorkoutTemplateRequestDto): Promise<WorkoutTemplateDto> {
    await this.assertExercisesExist(body.exercises.map((e) => e.exerciseId));

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workoutTemplate.create({
        data: {
          name: body.name,
          type: body.type,
          description: body.description ?? null,
          durationMinutes: body.durationMinutes ?? null,
          microcycleWeeks: body.microcycleWeeks ?? null,
        },
      });
      if (body.exercises.length > 0) {
        await tx.templateExercise.createMany({
          data: body.exercises.map((item) => ({
            templateId: created.id,
            ...this.exerciseCreateManyFields(item),
          })),
        });
      }
      return tx.workoutTemplate.findUniqueOrThrow({
        where: { id: created.id },
        include: templateInclude,
      });
    });

    return toWorkoutTemplateDto(row);
  }

  async updateTemplate(
    id: string,
    body: UpdateWorkoutTemplateRequestDto,
  ): Promise<WorkoutTemplateDto> {
    const existing = await this.prisma.workoutTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Workout template not found', 404);
    }
    if (existing.version !== body.version) {
      throw new AppException(
        ErrorCode.TEMPLATE_VERSION_CONFLICT,
        'Workout template was modified by another user',
        409,
        { currentVersion: existing.version },
      );
    }

    await this.assertExercisesExist(body.exercises.map((e) => e.exerciseId));

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.templateExercise.deleteMany({ where: { templateId: id } });
      if (body.exercises.length > 0) {
        await tx.templateExercise.createMany({
          data: body.exercises.map((item) => ({
            templateId: id,
            ...this.exerciseCreateManyFields(item),
          })),
        });
      }
      await tx.workoutTemplate.update({
        where: { id },
        data: {
          name: body.name,
          type: body.type,
          description: body.description ?? null,
          durationMinutes: body.durationMinutes ?? null,
          microcycleWeeks: body.microcycleWeeks ?? null,
          version: { increment: 1 },
        },
      });
      return tx.workoutTemplate.findUniqueOrThrow({
        where: { id },
        include: templateInclude,
      });
    });

    return toWorkoutTemplateDto(row);
  }

  private exerciseCreateManyFields(
    item:
      | CreateWorkoutTemplateRequestDto['exercises'][number]
      | UpdateWorkoutTemplateRequestDto['exercises'][number],
  ): Omit<Prisma.TemplateExerciseCreateManyInput, 'templateId'> {
    return {
      exerciseId: item.exerciseId,
      sortOrder: item.sortOrder,
      plannedSets: item.plannedSets ?? null,
      plannedReps: item.plannedReps ?? null,
      plannedWeightKg: item.plannedWeightKg ?? null,
      notes: item.notes ?? null,
    };
  }

  private async assertExercisesExist(exerciseIds: string[]): Promise<void> {
    const unique = [...new Set(exerciseIds)];
    if (unique.length === 0) {
      return;
    }
    const found = await this.prisma.exercise.findMany({
      where: { id: { in: unique }, archivedAt: null },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Exercise not found', 404);
    }
  }
}
