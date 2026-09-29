type MacroStageRef = { id: string; sortOrder: number };

/**
 * Whether the client has no further macro stages to advance to (Story 3.4 UI flag).
 */
export function computeStagesExhausted(
  stages: MacroStageRef[],
  currentStageId: string | null,
): boolean {
  if (currentStageId === null) {
    return true;
  }
  if (stages.length === 0) {
    return false;
  }
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const last = ordered[ordered.length - 1];
  return last.id === currentStageId;
}
