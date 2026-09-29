import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from './common/guards/csrf.guard';
import { SessionGuard } from './common/guards/session.guard';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ClientsLockModule } from './modules/clients-lock/clients-lock.module';
import { InvitesModule } from './modules/invites/invites.module';
import { TrainerModule } from './modules/trainer/trainer.module';
import { UsersModule } from './modules/users/users.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    TrainerModule,
    ClientsModule,
    ClientsLockModule,
    InvitesModule,
    UsersModule,
    ExercisesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
