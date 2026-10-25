import type { components } from '@/shared/api/schema';

type WorkoutTemplateDto = components['schemas']['WorkoutTemplateDto'];
type CreateWorkoutTemplateRequestDto = components['schemas']['CreateWorkoutTemplateRequestDto'];

/** Строка Упражнения в черновике: числа держим строками, как их вводят в поля. */
export type ExerciseLine = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  plannedSets: string;
  plannedReps: string;
  plannedWeightKg: string;
  notes: string;
};

export type TemplateDraft = {
  name: string;
  type: string;
  description: string;
  durationMinutes: string;
  microcycleWeeks: string;
  lines: ExerciseLine[];
};

/** Тип Шаблона — свободная строка в API; в UI предлагаем устойчивый набор. */
export const TEMPLATE_TYPES = [
  { value: 'strength', label: 'Силовая' },
  { value: 'cardio', label: 'Кардио' },
  { value: 'functional', label: 'Функциональная' },
  { value: 'mobility', label: 'Мобильность' },
] as const;

export function templateTypeLabel(type: string): string {
  return TEMPLATE_TYPES.find((option) => option.value === type)?.label ?? type;
}

function toFieldValue(value: number | null | undefined): string {
  return value != null ? String(value) : '';
}

export function emptyDraft(): TemplateDraft {
  return {
    name: '',
    type: 'strength',
    description: '',
    durationMinutes: '',
    microcycleWeeks: '',
    lines: [],
  };
}

export function draftFromTemplate(template: WorkoutTemplateDto): TemplateDraft {
  return {
    name: template.name,
    type: template.type,
    description: template.description ?? '',
    durationMinutes: toFieldValue(template.durationMinutes),
    microcycleWeeks: toFieldValue(template.microcycleWeeks),
    lines: template.exercises.map((row) => ({
      key: row.id,
      exerciseId: row.exerciseId,
      exerciseName: row.exerciseName ?? '',
      plannedSets: toFieldValue(row.plannedSets),
      plannedReps: toFieldValue(row.plannedReps),
      plannedWeightKg: toFieldValue(row.plannedWeightKg),
      notes: row.notes ?? '',
    })),
  };
}

function parseOptionalInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value: string): number | null {
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Тело POST/PATCH без `version` — её добавляет вызывающий код для PATCH. */
export function buildTemplateBody(draft: TemplateDraft): CreateWorkoutTemplateRequestDto {
  return {
    name: draft.name.trim(),
    type: draft.type.trim(),
    description: draft.description.trim() || null,
    durationMinutes: parseOptionalInt(draft.durationMinutes),
    microcycleWeeks: parseOptionalInt(draft.microcycleWeeks),
    exercises: draft.lines.map((line, index) => ({
      exerciseId: line.exerciseId,
      sortOrder: index,
      plannedSets: parseOptionalInt(line.plannedSets),
      plannedReps: parseOptionalInt(line.plannedReps),
      plannedWeightKg: parseOptionalNumber(line.plannedWeightKg),
      notes: line.notes.trim() || null,
    })),
  };
}

/** «3 подхода · 10 повт. · 40 кг» — или подсказка, что план не задан. */
export function lineMeta(line: ExerciseLine): string {
  const parts: string[] = [];
  if (line.plannedSets.trim()) {
    parts.push(`${line.plannedSets.trim()} ${pluralSets(Number(line.plannedSets))}`);
  }
  if (line.plannedReps.trim()) {
    parts.push(`${line.plannedReps.trim()} повт.`);
  }
  if (line.plannedWeightKg.trim()) {
    parts.push(`${line.plannedWeightKg.trim()} кг`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'План подходов не задан';
}

function pluralSets(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'подход';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'подхода';
  }
  return 'подходов';
}

/** Мета строки списка Шаблонов: «Силовая · 5 упражнений · 60 мин». */
export function templateListMeta(template: WorkoutTemplateDto): string {
  const parts = [templateTypeLabel(template.type), `упражнений: ${template.exercises.length}`];
  if (template.durationMinutes) {
    parts.push(`${template.durationMinutes} мин`);
  }
  return parts.join(' · ');
}
