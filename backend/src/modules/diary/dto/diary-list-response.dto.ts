import { ApiProperty } from '@nestjs/swagger';
import { DiaryEntryDto } from './diary-entry.dto';

export class DiaryListResponseDto {
  @ApiProperty({ type: () => DiaryEntryDto, isArray: true })
  entries!: DiaryEntryDto[];
}
