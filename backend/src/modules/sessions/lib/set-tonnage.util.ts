/**
 * Tonnage for one set: weightKg × reps when both are present; missing values count as 0.
 */
export function setTonnageKg(
  weightKg: number | null | undefined,
  reps: number | null | undefined,
): number {
  const weight = weightKg ?? 0;
  const repCount = reps ?? 0;
  return weight * repCount;
}

/**
 * Growth % vs prior completed tonnage; null when prior tonnage is zero (no meaningful ratio).
 */
export function tonnageGrowthPercent(currentKg: number, priorKg: number): number | null {
  if (priorKg === 0) {
    return null;
  }
  return Math.round(((currentKg - priorKg) / priorKg) * 1000) / 10;
}
