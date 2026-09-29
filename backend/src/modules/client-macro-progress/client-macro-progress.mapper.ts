import { computeStagesExhausted } from './client-macro-progress.util';
import { ClientMacroProgressSummaryDto } from './dto/client-macro-progress-summary.dto';

export type MacroProgressMacrocycleRow = {
  name: string;
  stages: { id: string; sortOrder: number }[];
};

export type MacroProgressRow = {
  macrocycleId: string;
  currentStageId: string | null;
  macrocycle: MacroProgressMacrocycleRow;
};

export function buildMacroProgressSummaryFromRow(
  row: MacroProgressRow,
): ClientMacroProgressSummaryDto {
  const stages = row.macrocycle.stages;
  const currentStage = row.currentStageId
    ? stages.find((s) => s.id === row.currentStageId)
    : undefined;

  return {
    macrocycleId: row.macrocycleId,
    currentStageId: row.currentStageId,
    stagesExhausted: computeStagesExhausted(stages, row.currentStageId),
    macrocycleName: row.macrocycle.name,
    currentStageSortOrder: currentStage?.sortOrder ?? null,
    stageCount: stages.length,
  };
}
