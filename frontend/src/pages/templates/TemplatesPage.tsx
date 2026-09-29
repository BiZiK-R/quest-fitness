import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type WorkoutTemplateDto = components['schemas']['WorkoutTemplateDto'];
type ExerciseDto = components['schemas']['ExerciseDto'];
type UpdateWorkoutTemplateRequestDto =
  components['schemas']['UpdateWorkoutTemplateRequestDto'];
type CreateWorkoutTemplateRequestDto =
  components['schemas']['CreateWorkoutTemplateRequestDto'];

type ExerciseLine = {
  key: string;
  exerciseId: string;
  plannedSets: string;
  plannedReps: string;
  plannedWeightKg: string;
  notes: string;
};

const NO_GROUPS_WARNING = 'Без групп упражнение не попадёт в статистику мышц';
const CONFLICT_MESSAGE =
  'Другой тренер изменил этот шаблон, пока вы редактировали.';

function emptyLine(key: string): ExerciseLine {
  return {
    key,
    exerciseId: '',
    plannedSets: '',
    plannedReps: '',
    plannedWeightKg: '',
    notes: '',
  };
}

function linesFromTemplate(template: WorkoutTemplateDto): ExerciseLine[] {
  return template.exercises.map((row) => ({
    key: row.id,
    exerciseId: row.exerciseId,
    plannedSets: row.plannedSets != null ? String(row.plannedSets) : '',
    plannedReps: row.plannedReps != null ? String(row.plannedReps) : '',
    plannedWeightKg:
      row.plannedWeightKg != null ? String(row.plannedWeightKg) : '',
    notes: row.notes ?? '',
  }));
}

function parseOptionalInt(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildExercisePayload(lines: ExerciseLine[]) {
  return lines
    .filter((line) => line.exerciseId)
    .map((line, index) => ({
      exerciseId: line.exerciseId,
      sortOrder: index,
      plannedSets: parseOptionalInt(line.plannedSets),
      plannedReps: parseOptionalInt(line.plannedReps),
      plannedWeightKg: parseOptionalNumber(line.plannedWeightKg),
      notes: line.notes.trim() || null,
    }));
}

export function TemplatesPage() {
  const dialogTitleId = useId();
  const [templates, setTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<ExerciseDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState('strength');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [microcycleWeeks, setMicrocycleWeeks] = useState('');
  const [lines, setLines] = useState<ExerciseLine[]>([emptyLine('line_0')]);
  const [lineSeq, setLineSeq] = useState(1);
  const [inlineExerciseName, setInlineExerciseName] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictCurrentVersion, setConflictCurrentVersion] = useState<number | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoadError(null);
    const [templatesRes, exercisesRes] = await Promise.all([
      apiClient.GET('/api/templates'),
      apiClient.GET('/api/exercises'),
    ]);
    if (templatesRes.error || exercisesRes.error) {
      setTemplates([]);
      setCatalogExercises([]);
      setLoadError(
        templatesRes.error?.error?.code ??
          exercisesRes.error?.error?.code ??
          'LOAD_FAILED',
      );
      return;
    }
    setTemplates(templatesRes.data?.templates ?? []);
    setCatalogExercises(exercisesRes.data?.exercises ?? []);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetCreateForm() {
    setEditingId(null);
    setVersion(1);
    setName('');
    setType('strength');
    setDescription('');
    setDurationMinutes('');
    setMicrocycleWeeks('');
    setLines([emptyLine('line_0')]);
    setLineSeq(1);
    setFormError(null);
    setConflictOpen(false);
    setConflictCurrentVersion(null);
  }

  function startEdit(template: WorkoutTemplateDto) {
    setEditingId(template.id);
    setVersion(template.version);
    setName(template.name);
    setType(template.type);
    setDescription(template.description ?? '');
    setDurationMinutes(
      template.durationMinutes != null ? String(template.durationMinutes) : '',
    );
    setMicrocycleWeeks(
      template.microcycleWeeks != null ? String(template.microcycleWeeks) : '',
    );
    const mapped = linesFromTemplate(template);
    setLines(mapped.length > 0 ? mapped : [emptyLine('line_0')]);
    setFormError(null);
    setConflictOpen(false);
  }

  function moveLine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= lines.length) {
      return;
    }
    setLines((prev) => {
      const next = [...prev];
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function addLine() {
    const key = `line_${lineSeq}`;
    setLineSeq((n) => n + 1);
    setLines((prev) => [...prev, emptyLine(key)]);
  }

  function updateLine(index: number, patch: Partial<ExerciseLine>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleInlineExerciseCreate() {
    const trimmed = inlineExerciseName.trim();
    if (!trimmed) {
      return;
    }
    setFormError(null);
    const { data, error } = await apiClient.POST('/api/exercises', {
      body: { name: trimmed },
    });
    if (error || !data) {
      setFormError(error?.error?.code ?? 'CREATE_EXERCISE_FAILED');
      return;
    }
    setCatalogExercises((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    const key = `line_${lineSeq}`;
    setLineSeq((n) => n + 1);
    setLines((prev) => [...prev, { ...emptyLine(key), exerciseId: data.id }]);
    setInlineExerciseName('');
  }

  function buildSaveBody():
    | CreateWorkoutTemplateRequestDto
    | UpdateWorkoutTemplateRequestDto {
    const base = {
      name: name.trim(),
      type: type.trim(),
      description: description.trim() || null,
      durationMinutes: parseOptionalInt(durationMinutes),
      microcycleWeeks: parseOptionalInt(microcycleWeeks),
      exercises: buildExercisePayload(lines),
    };
    if (editingId) {
      return { ...base, version };
    }
    return base;
  }

  async function persistTemplate(forcedVersion?: number) {
    setIsSubmitting(true);
    setFormError(null);
    const body = buildSaveBody();
    if (editingId) {
      const patchBody = body as UpdateWorkoutTemplateRequestDto;
      if (forcedVersion != null) {
        patchBody.version = forcedVersion;
      }
      const { data, error, response } = await apiClient.PATCH('/api/templates/{id}', {
        params: { path: { id: editingId } },
        body: patchBody,
      });
      setIsSubmitting(false);
      if (response.status === 409 && error?.error?.code === 'TEMPLATE_VERSION_CONFLICT') {
        const details = error.error.details as { currentVersion?: number } | undefined;
        setConflictCurrentVersion(details?.currentVersion ?? null);
        setConflictOpen(true);
        return;
      }
      if (error || !data) {
        setFormError(error?.error?.code ?? 'SAVE_FAILED');
        return;
      }
      setVersion(data.version);
      await loadData();
      startEdit(data);
      return;
    }

    const { data, error } = await apiClient.POST('/api/templates', {
      body: body as CreateWorkoutTemplateRequestDto,
    });
    setIsSubmitting(false);
    if (error || !data) {
      setFormError(error?.error?.code ?? 'SAVE_FAILED');
      return;
    }
    await loadData();
    startEdit(data);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !type.trim()) {
      return;
    }
    await persistTemplate();
  }

  async function handleConflictReload() {
    setConflictOpen(false);
    if (!editingId) {
      await loadData();
      resetCreateForm();
      return;
    }
    const { data, error } = await apiClient.GET('/api/templates/{id}', {
      params: { path: { id: editingId } },
    });
    if (error || !data) {
      setFormError(error?.error?.code ?? 'RELOAD_FAILED');
      return;
    }
    startEdit(data);
    await loadData();
  }

  async function handleConflictForceSave() {
    if (conflictCurrentVersion == null) {
      setConflictOpen(false);
      return;
    }
    setConflictOpen(false);
    setVersion(conflictCurrentVersion);
    await persistTemplate(conflictCurrentVersion);
  }

  return (
    <>
      <PageMeta title="Шаблоны тренировок — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>
      <h1>Шаблоны тренировок</h1>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {formError ? <p role="alert">{formError}</p> : null}

      <section>
        <h2>Список</h2>
        {templates.length === 0 ? (
          <p>Пока нет шаблонов</p>
        ) : (
          <ul>
            {templates.map((template) => (
              <li key={template.id}>
                <button type="button" onClick={() => startEdit(template)}>
                  {template.name}
                </button>
                <span>
                  {' '}
                  — {template.type}, v{template.version}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={resetCreateForm}>
          Новый шаблон
        </button>
      </section>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <h2>{editingId ? 'Редактирование' : 'Создание'}</h2>
        <label htmlFor="template-name">Название</label>
        <input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={128}
          required
        />

        <label htmlFor="template-type">Тип</label>
        <input
          id="template-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          maxLength={64}
          required
        />

        <label htmlFor="template-description">Описание</label>
        <textarea
          id="template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />

        <label htmlFor="template-duration">Длительность (мин)</label>
        <input
          id="template-duration"
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />

        <label htmlFor="template-microcycle">Недель в микроцикле</label>
        <input
          id="template-microcycle"
          type="number"
          min={1}
          value={microcycleWeeks}
          onChange={(e) => setMicrocycleWeeks(e.target.value)}
        />

        <h3>Упражнения</h3>
        {lines.map((line, index) => (
          <div key={line.key}>
            <label htmlFor={`exercise-${line.key}`}>Упражнение</label>
            <select
              id={`exercise-${line.key}`}
              value={line.exerciseId}
              onChange={(e) => updateLine(index, { exerciseId: e.target.value })}
            >
              <option value="">— выберите —</option>
              {catalogExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>

            <label htmlFor={`sets-${line.key}`}>Подходы</label>
            <input
              id={`sets-${line.key}`}
              type="number"
              min={1}
              value={line.plannedSets}
              onChange={(e) => updateLine(index, { plannedSets: e.target.value })}
            />

            <label htmlFor={`reps-${line.key}`}>Повторения</label>
            <input
              id={`reps-${line.key}`}
              type="number"
              min={1}
              value={line.plannedReps}
              onChange={(e) => updateLine(index, { plannedReps: e.target.value })}
            />

            <button type="button" onClick={() => moveLine(index, -1)} disabled={index === 0}>
              ↑ выше
            </button>
            <button
              type="button"
              onClick={() => moveLine(index, 1)}
              disabled={index === lines.length - 1}
            >
              ↓ ниже
            </button>
            <button type="button" onClick={() => removeLine(index)}>
              Удалить
            </button>
          </div>
        ))}

        <button type="button" onClick={addLine}>
          + строка упражнения
        </button>

        <fieldset>
          <legend>+ упражнение в каталог</legend>
          <label htmlFor="inline-exercise-name">Название нового упражнения</label>
          <input
            id="inline-exercise-name"
            value={inlineExerciseName}
            onChange={(e) => setInlineExerciseName(e.target.value)}
            maxLength={128}
          />
          <p role="status">{NO_GROUPS_WARNING}</p>
          <button
            type="button"
            onClick={() => void handleInlineExerciseCreate()}
            disabled={!inlineExerciseName.trim()}
          >
            Добавить упражнение
          </button>
        </fieldset>

        <button type="submit" disabled={isSubmitting || !name.trim()}>
          {editingId ? 'Сохранить шаблон' : 'Создать шаблон'}
        </button>
        {editingId ? <span> Версия: {version}</span> : null}
      </form>

      {conflictOpen ? (
        <div className="templates-conflict-dialog" role="dialog" aria-labelledby={dialogTitleId}>
          <h2 id={dialogTitleId}>Конфликт версий</h2>
          <p>{CONFLICT_MESSAGE}</p>
          <button type="button" onClick={() => void handleConflictReload()}>
            Открыть заново
          </button>
          <button type="button" onClick={() => void handleConflictForceSave()}>
            Сохранить поверх
          </button>
        </div>
      ) : null}
    </>
  );
}
