import { useMemo, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PlusIcon, SearchIcon } from '@/shared/ui/icons';
import { TextField } from '@/shared/ui/TextField';

type ExerciseDto = components['schemas']['ExerciseDto'];

const NO_GROUPS_WARNING = 'Без групп упражнение не попадёт в статистику мышц';

type ExercisePickerSheetProps = {
  catalog: ExerciseDto[];
  onPick: (exercise: ExerciseDto) => void;
  /** Упражнение создано инлайн — страница добавляет его в свой каталог. */
  onCreated: (exercise: ExerciseDto) => void;
  onClose: () => void;
};

/**
 * Выбор Упражнения из каталога с поиском. Если нужного нет — инлайн-создание по введённому
 * названию, без ухода из конструктора (EXPERIENCE → «Нет Упражнений в каталоге»).
 */
export function ExercisePickerSheet({ catalog, onPick, onCreated, onClose }: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const matches = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    if (!needle) {
      return catalog;
    }
    return catalog.filter((exercise) => exercise.name.toLowerCase().includes(needle));
  }, [catalog, trimmedQuery]);

  const hasExactMatch = catalog.some(
    (exercise) => exercise.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const isCatalogEmpty = catalog.length === 0 && !trimmedQuery;
  const isSearchMiss = trimmedQuery !== '' && matches.length === 0 && catalog.length > 0;

  async function handleCreate() {
    setErrorCode(null);
    setIsCreating(true);
    const { data, error } = await apiClient.POST('/api/exercises', { body: { name: trimmedQuery } });
    setIsCreating(false);
    if (error || !data) {
      setErrorCode(error?.error?.code ?? 'CREATE_FAILED');
      return;
    }
    onCreated(data);
    onPick(data);
  }

  return (
    <BottomSheet open onClose={onClose} title="Добавить упражнение">
      <div className="templates-sheet">
        <TextField
          variant="search"
          type="search"
          label="Поиск по каталогу"
          hideLabel
          placeholder="Поиск по каталогу"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          leadingIcon={<SearchIcon />}
        />

        {isCatalogEmpty ? (
          <EmptyState
            size="title"
            title="Каталог пуст"
            description="Введите название ниже — создадим упражнение."
          />
        ) : null}

        {isSearchMiss ? (
          <EmptyState
            size="title"
            title="Ничего не нашли"
            description="Сбросьте поиск или создайте упражнение с таким названием."
            action={
              <Button variant="secondary" fullWidth onClick={() => setQuery('')}>
                Очистить поиск
              </Button>
            }
          />
        ) : null}

        {matches.length > 0 ? (
          <ListCard label="Упражнения каталога">
            {matches.map((exercise) => (
              <ListRow
                key={exercise.id}
                title={exercise.name}
                meta={exercise.missingMuscleGroupsWarning ? 'Без мышечных групп' : undefined}
                metaPlacement="below"
                trailing={<PlusIcon />}
                onClick={() => onPick(exercise)}
              />
            ))}
          </ListCard>
        ) : null}

        {trimmedQuery && !hasExactMatch ? (
          <div className="templates-sheet__create">
            <Button fullWidth loading={isCreating} onClick={() => void handleCreate()}>
              Создать «{trimmedQuery}»
            </Button>
            <p className="templates-sheet__muted">{NO_GROUPS_WARNING}</p>
          </div>
        ) : null}

        {errorCode ? (
          <p className="templates-sheet__error" role="alert">
            {errorMessageFor(errorCode)}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
