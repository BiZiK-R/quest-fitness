import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type ExerciseDto = components['schemas']['ExerciseDto'];
type MuscleGroupDto = components['schemas']['MuscleGroupDto'];

const NO_GROUPS_WARNING = 'Без групп упражнение не попадёт в статистику мышц';

export function CatalogPage() {
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupDto[]>([]);
  const [name, setName] = useState('');
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState('');
  const [secondaryMuscleGroupIds, setSecondaryMuscleGroupIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNoGroupsWarning = useMemo(() => {
    return !primaryMuscleGroupId && secondaryMuscleGroupIds.length === 0;
  }, [primaryMuscleGroupId, secondaryMuscleGroupIds]);

  const loadCatalog = useCallback(async () => {
    setLoadError(null);
    const [exercisesRes, groupsRes] = await Promise.all([
      apiClient.GET('/api/exercises'),
      apiClient.GET('/api/muscle-groups'),
    ]);
    if (exercisesRes.error || groupsRes.error) {
      setExercises([]);
      setMuscleGroups([]);
      setLoadError(
        exercisesRes.error?.error?.code ??
          groupsRes.error?.error?.code ??
          'LOAD_FAILED',
      );
      return;
    }
    setExercises(exercisesRes.data?.exercises ?? []);
    setMuscleGroups(groupsRes.data?.muscleGroups ?? []);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  function toggleSecondary(muscleGroupId: string, checked: boolean) {
    setSecondaryMuscleGroupIds((prev) => {
      if (checked) {
        return prev.includes(muscleGroupId) ? prev : [...prev, muscleGroupId];
      }
      return prev.filter((id) => id !== muscleGroupId);
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    const body: components['schemas']['CreateExerciseRequestDto'] = {
      name: trimmed,
      ...(primaryMuscleGroupId ? { primaryMuscleGroupId } : {}),
      ...(secondaryMuscleGroupIds.length > 0
        ? { secondaryMuscleGroupIds }
        : {}),
    };

    const { error } = await apiClient.POST('/api/exercises', { body });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.error?.code ?? 'CREATE_FAILED');
      return;
    }
    setName('');
    setPrimaryMuscleGroupId('');
    setSecondaryMuscleGroupIds([]);
    await loadCatalog();
  }

  async function handleArchive(exerciseId: string) {
    setFormError(null);
    const { error } = await apiClient.POST('/api/exercises/{id}/archive', {
      params: { path: { id: exerciseId } },
    });
    if (error) {
      setFormError(error.error?.code ?? 'ARCHIVE_FAILED');
      return;
    }
    await loadCatalog();
  }

  return (
    <>
      <PageMeta title="Каталог упражнений — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>
      <h1>Каталог упражнений</h1>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {formError ? <p role="alert">{formError}</p> : null}

      <form onSubmit={(e) => void handleCreate(e)}>
        <h2>Новое упражнение</h2>
        <label htmlFor="exercise-name">Название</label>
        <input
          id="exercise-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={128}
        />

        <label htmlFor="exercise-primary">Основная группа</label>
        <select
          id="exercise-primary"
          value={primaryMuscleGroupId}
          onChange={(e) => setPrimaryMuscleGroupId(e.target.value)}
        >
          <option value="">— не выбрана —</option>
          {muscleGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <fieldset>
          <legend>Дополнительные группы</legend>
          {muscleGroups.map((group) => (
            <label key={group.id}>
              <input
                type="checkbox"
                checked={secondaryMuscleGroupIds.includes(group.id)}
                disabled={group.id === primaryMuscleGroupId}
                onChange={(e) => toggleSecondary(group.id, e.target.checked)}
              />
              {group.name}
            </label>
          ))}
        </fieldset>

        {showNoGroupsWarning ? (
          <p role="status">{NO_GROUPS_WARNING}</p>
        ) : null}

        <button type="submit" disabled={isSubmitting || !name.trim()}>
          Сохранить упражнение
        </button>
      </form>

      <h2>Упражнения зала</h2>
      {exercises.length === 0 ? (
        <p>Пока нет упражнений</p>
      ) : (
        <ul>
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <span>{exercise.name}</span>
              {exercise.missingMuscleGroupsWarning ? (
                <span> — {NO_GROUPS_WARNING}</span>
              ) : null}
              <button type="button" onClick={() => void handleArchive(exercise.id)}>
                В архив
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
