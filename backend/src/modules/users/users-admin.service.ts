import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { ErrorCode } from '../../common/errors/error-code.enum';
import { ARGON2_OPTIONS } from '../../shared/password/argon2-options';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StaffUserDto } from './dto/staff-user.dto';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Создаёт пользователя с ролью TRAINER (логин уже lowercase). */
  async createTrainer(login: string, password: string): Promise<StaffUserDto> {
    const loginNormalized = login.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { login: loginNormalized },
    });
    if (existing) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Validation failed', 400, {
        login: ['Login already taken'],
      });
    }

    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    const user = await this.prisma.user.create({
      data: {
        login: loginNormalized,
        passwordHash,
        role: UserRole.TRAINER,
      },
      select: { id: true, login: true, role: true },
    });

    return user;
  }

  /** Список тренеров и админов пула. */
  async listStaff(): Promise<StaffUserDto[]> {
    return this.prisma.user.findMany({
      where: { role: { in: [UserRole.TRAINER, UserRole.ADMIN] } },
      select: { id: true, login: true, role: true },
      orderBy: { login: 'asc' },
    });
  }

  /** Повышает TRAINER до ADMIN. */
  async promoteToAdmin(userId: string): Promise<StaffUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(ErrorCode.NOT_FOUND, 'User not found', 404);
    }
    if (user.role !== UserRole.TRAINER) {
      throw new AppException(ErrorCode.VALIDATION_FAILED, 'Validation failed', 400, {
        role: ['Only trainers can be promoted'],
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.ADMIN },
      select: { id: true, login: true, role: true },
    });
  }
}
