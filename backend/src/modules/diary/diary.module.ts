import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClientDiaryController } from './client-diary.controller';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

@Module({
  controllers: [ClientDiaryController, DiaryController],
  providers: [DiaryService, RolesGuard],
})
export class DiaryModule {}
