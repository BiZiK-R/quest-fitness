import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import { BackIcon, SearchIcon } from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { TextField } from '@/shared/ui/TextField';
import { ExerciseSheet } from './ExerciseSheet';
import { exerciseMeta } from './exercise-meta';
import './CatalogPage.css';

type ExerciseDto = components['schemas']['ExerciseDto'];
type MuscleGroupDto = components['schemas']['MuscleGroupDto'];

type LoadState = { status: 'loading' } | { status: 'error'; code: string } | { status: 'ready' };

/** Открытая шторка: exercise = null — создание. */
type SheetState = { exercise: ExerciseDto | null } | null;

export function CatalogPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupDto[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sheet, setSheet] = useState<SheetState>(null);

  const loadCatalog = useCallback(async () => {
    const [exercisesRes, groupsRes] = await Promise.all([
      apiClient.GET('/api/exercises', { params: { query: { includeArchived: true } } }),
      apiClient.GET('/api/muscle-groups'),
    ]);
    if (exercisesRes.error || groupsRes.error) {
      setLoadState({
        status: 'error',
        code: exercisesRes.error?.error?.code ?? groupsRes.error?.error?.code ?? 'LOAD_FAILED',
      });
      return;
    }
    setExercises(exercisesRes.data?.exercises ?? []);
    setMuscleGroups(groupsRes.data?.muscleGroups ?? []);
    setLoadState({ status: 'ready' });
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const groupNameById = useMemo(
    () => new Map(muscleGroups.map((group) => [group.id, group.name])),
    [muscleGroups],
  );

  const filteredExercises = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return exercises;
    }
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(query));
  }, [exercises, searchQuery]);

  const activeExercises = filteredExercises.filter((exercise) => !exercise.archivedAt);
  const hiddenExercises = filteredExercises.filter((exercise) => exercise.archivedAt);

  function retryLoad() {
    setLoadState({ status: 'loading' });
    void loadCatalog();
  }

  function handleSheetChanged() {
    setSheet(null);
    void loadCatalog();
  }

  function renderContent() {
    if (loadState.status === 'loading') {
      return <PageState status="loading" />;
    }
    if (loadState.status === 'error') {
      return <PageState status="error" errorCode={loadState.code} onRetry={retryLoad} />;
    }
    if (exercises.length === 0) {
      return (
        <EmptyState
          title="Каталог пуст"
          description="Добавьте первое упражнение — оно появится в списке для шаблонов."
          action={
            <Button variant="primary" fullWidth onClick={() => setSheet({ exercise: null })}>
              Добавить упражнение
            </Button>
          }
        />
      );
    }
    return (
      <>
        <TextField
          variant="search"
          type="search"
          label="Найти упражнение по названию"
          hideLabel
          placeholder="Найти упражнение по названию"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          leadingIcon={<SearchIcon />}
        />

        {filteredExercises.length === 0 ? (
          <EmptyState
            size="title"
            title="Ничего не нашли"
            description="Сбросьте поиск или добавьте упражнение с таким названием."
            action={
              <Button variant="secondary" fullWidth onClick={() => setSearchQuery('')}>
                Очистить поиск
              </Button>
            }
          />
        ) : null}

        {activeExercises.length > 0 ? (
          <ListCard label="Упражнения зала" className="catalog-page__list">
            {activeExercises.map((exercise) => (
              <ListRow
                key={exercise.id}
                title={exercise.name}
                meta={exerciseMeta(exercise, groupNameById)}
                metaPlacement="below"
                onClick={() => setSheet({ exercise })}
              />
            ))}
          </ListCard>
        ) : null}

        {hiddenExercises.length > 0 ? (
          <>
            <SectionTitle>Скрытые</SectionTitle>
            <ListCard label="Скрытые упражнения">
              {hiddenExercises.map((exercise) => (
                <ListRow
                  key={exercise.id}
                  title={exercise.name}
                  meta="Скрыто — нажмите, чтобы открыть"
                  onClick={() => setSheet({ exercise })}
                />
              ))}
            </ListCard>
          </>
        ) : null}
      </>
    );
  }

  return (
    <>
      <PageMeta title="Каталог упражнений — Quest Fitness" robots="noindex,nofollow" />
      <AppShell
        title="Каталог упражнений"
        leading={
          <IconButton label="Назад" onClick={() => navigate('/pool')}>
            <BackIcon />
          </IconButton>
        }
        action={<TrainerMenuAction />}
        bottom={
          loadState.status === 'ready' && exercises.length > 0 ? (
            <BottomCta
              primary={
                <Button variant="primary" fullWidth onClick={() => setSheet({ exercise: null })}>
                  Добавить упражнение
                </Button>
              }
            />
          ) : undefined
        }
      >
        <div className="catalog-page">{renderContent()}</div>
      </AppShell>

      {sheet ? (
        <ExerciseSheet
          exercise={sheet.exercise}
          muscleGroups={muscleGroups}
          onClose={() => setSheet(null)}
          onChanged={handleSheetChanged}
        />
      ) : null}
    </>
  );
}
