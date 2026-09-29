import { ApiProperty } from '@nestjs/swagger';
import { SessionExerciseSummaryDto } from './session-exercise-summary.dto';

export class SessionSummaryDto {
  @ApiProperty({ type: String })
  sessionId!: string;

  @ApiProperty({ type: Number })
  setCount!: number;

  @ApiProperty({ type: Number })
  totalTonnageKg!: number;

  @ApiProperty({ type: () => SessionExerciseSummaryDto, isArray: true })
  perExercise!: SessionExerciseSummaryDto[];
}
