import { Injectable } from '@nestjs/common';
import { ExerciseMuscleRole, Prisma } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateExerciseRequestDto } from './dto/create-exercise-request.dto';
import { ExerciseDto } from './dto/exercise.dto';
import { MuscleGroupDto } from './dto/muscle-group.dto';
import { UpdateExerciseRequestDto } from './dto/update-exercise-request.dto';
import { toExerciseDto } from './exercise.mapper';

const exerciseInclude = { muscles: true } satisfies Prisma.ExerciseInclude;

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMuscleGroups(): Promise<MuscleGroupDto[]> {
    const rows = await this.prisma.muscleGroup.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
    }));
  }

  async listExercises(includeArchived: boolean): Promise<ExerciseDto[]> {
    const where: Prisma.ExerciseWhereInput = includeArchived
      ? {}
      : { archivedAt: null };

    const rows = await this.prisma.exercise.findMany({
      where,
      include: exerciseInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map(toExerciseDto);
  }

  async create(body: CreateExerciseRequestDto): Promise<ExerciseDto> {
    await this.assertMuscleGroupsExist(
      body.primaryMuscleGroupId,
      body.secondaryMuscleGroupIds ?? [],
    );

    const row = await this.prisma.$transaction(async (tx) => {
      const exercise = await tx.exercise.create({
        data: { name: body.name },
      });
      await this.replaceMuscles(tx, exercise.id, {
        primaryMuscleGroupId: body.primaryMuscleGroupId ?? null,
        secondaryMuscleGroupIds: body.secondaryMuscleGroupIds ?? [],
      });
      return tx.exercise.findUniqueOrThrow({
        where: { id: exercise.id },
        include: exerciseInclude,
      });
    });

    return toExerciseDto(row);
  }

  async update(id: string, body: UpdateExerciseRequestDto): Promise<ExerciseDto> {
    const existing = await this.prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Exercise not found', 404);
    }

    const touchesMuscles =
      body.primaryMuscleGroupId !== undefined ||
      body.secondaryMuscleGroupIds !== undefined;

    if (touchesMuscles) {
      await this.assertMuscleGroupsExist(
        body.primaryMuscleGroupId ?? null,
        body.secondaryMuscleGroupIds ?? [],
      );
    }

    const row = await this.prisma.$transaction(async (tx) => {
      if (body.name !== undefined) {
        await tx.exercise.update({
          where: { id },
          data: { name: body.name },
        });
      }
      if (touchesMuscles) {
        await this.replaceMuscles(tx, id, {
          primaryMuscleGroupId: body.primaryMuscleGroupId ?? null,
          secondaryMuscleGroupIds: body.secondaryMuscleGroupIds ?? [],
        });
      }
      return tx.exercise.findUniqueOrThrow({
        where: { id },
        include: exerciseInclude,
      });
    });

    return toExerciseDto(row);
  }

  async archive(id: string): Promise<ExerciseDto> {
    const existing = await this.prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Exercise not found', 404);
    }

    const row = await this.prisma.exercise.update({
      where: { id },
      data: { archivedAt: new Date() },
      include: exerciseInclude,
    });
    return toExerciseDto(row);
  }

  private async assertMuscleGroupsExist(
    primaryMuscleGroupId: string | null | undefined,
    secondaryMuscleGroupIds: string[],
  ): Promise<void> {
    const ids = new Set<string>();
    if (primaryMuscleGroupId) {
      ids.add(primaryMuscleGroupId);
    }
    for (const id of secondaryMuscleGroupIds) {
      ids.add(id);
    }
    if (ids.size === 0) {
      return;
    }

    const found = await this.prisma.muscleGroup.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true },
    });
    if (found.length !== ids.size) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Muscle group not found', 404);
    }
  }

  private async replaceMuscles(
    tx: Prisma.TransactionClient,
    exerciseId: string,
    groups: {
      primaryMuscleGroupId: string | null;
      secondaryMuscleGroupIds: string[];
    },
  ): Promise<void> {
    const secondarySet = new Set(
      groups.secondaryMuscleGroupIds.filter(
        (id) => id !== groups.primaryMuscleGroupId,
      ),
    );

    await tx.exerciseMuscle.deleteMany({ where: { exerciseId } });

    const rows: Prisma.ExerciseMuscleCreateManyInput[] = [];
    if (groups.primaryMuscleGroupId) {
      rows.push({
        exerciseId,
        muscleGroupId: groups.primaryMuscleGroupId,
        role: ExerciseMuscleRole.PRIMARY,
      });
    }
    for (const muscleGroupId of secondarySet) {
      rows.push({
        exerciseId,
        muscleGroupId,
        role: ExerciseMuscleRole.SECONDARY,
      });
    }

    if (rows.length > 0) {
      await tx.exerciseMuscle.createMany({ data: rows });
    }
  }
}
