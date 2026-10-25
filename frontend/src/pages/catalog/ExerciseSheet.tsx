import { useState, type FormEvent } from 'react';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ListCard } from '@/shared/ui/ListCard';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { TextField } from '@/shared/ui/TextField';
import { ChoiceRow } from './ChoiceRow';
import { NO_GROUPS_WARNING } from './exercise-meta';

type ExerciseDto = components['schemas']['ExerciseDto'];
type MuscleGroupDto = components['schemas']['MuscleGroupDto'];

const FORM_ID = 'exercise-sheet-form';

type ExerciseSheetProps = {
  /** null — создание нового упражнения. */
  exercise: ExerciseDto | null;
  muscleGroups: MuscleGroupDto[];
  onClose: () => void;
  /** Вызывается после успешного сохранения или удаления — страница перезагружает каталог. */
  onChanged: () => void;
};

/**
 * Создание / правка Упражнения: название, основная группа (radio), дополнительные (checkbox).
 * Удаление = soft-delete (archive), история Сессий сохраняется.
 * Монтируется заново на каждое открытие — начальное состояние берётся из `exercise`.
 */
export function ExerciseSheet({ exercise, muscleGroups, onClose, onChanged }: ExerciseSheetProps) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [primaryId, setPrimaryId] = useState(exercise?.primaryMuscleGroupId ?? '');
  const [secondaryIds, setSecondaryIds] = useState<string[]>(
    exercise?.secondaryMuscleGroupIds ?? [],
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasNoGroups = !primaryId && secondaryIds.length === 0;

  function selectPrimary(groupId: string) {
    setPrimaryId(groupId);
    setSecondaryIds((prev) => prev.filter((id) => id !== groupId));
  }

  function toggleSecondary(groupId: string) {
    setSecondaryIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }

  async function saveExercise() {
    if (exercise) {
      return apiClient.PATCH('/api/exercises/{id}', {
        params: { path: { id: exercise.id } },
        body: {
          name: name.trim(),
          primaryMuscleGroupId: primaryId || null,
          secondaryMuscleGroupIds: secondaryIds,
        },
      });
    }
    return apiClient.POST('/api/exercises', {
      body: {
        name: name.trim(),
        ...(primaryId ? { primaryMuscleGroupId: primaryId } : {}),
        ...(secondaryIds.length > 0 ? { secondaryMuscleGroupIds: secondaryIds } : {}),
      },
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    setErrorCode(null);
    setIsSaving(true);
    const { error } = await saveExercise();
    setIsSaving(false);
    if (error) {
      setErrorCode(error.error?.code ?? 'CREATE_FAILED');
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!exercise) {
      return;
    }
    setIsDeleting(true);
    const { error } = await apiClient.POST('/api/exercises/{id}/archive', {
      params: { path: { id: exercise.id } },
    });
    setIsDeleting(false);
    setConfirmDeleteOpen(false);
    if (error) {
      setErrorCode(error.error?.code ?? null);
      return;
    }
    onChanged();
  }

  return (
    <>
      <BottomSheet
        open
        onClose={onClose}
        title={exercise ? 'Упражнение' : 'Новое упражнение'}
        footer={
          <>
            <Button
              type="submit"
              form={FORM_ID}
              variant="primary"
              fullWidth
              loading={isSaving}
              disabled={!name.trim()}
            >
              Сохранить
            </Button>
            {exercise ? (
              <Button variant="danger" fullWidth onClick={() => setConfirmDeleteOpen(true)}>
                Удалить
              </Button>
            ) : null}
          </>
        }
      >
        <form id={FORM_ID} className="catalog-sheet" onSubmit={(e) => void handleSubmit(e)}>
          <TextField
            label="Название"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={128}
            autoComplete="off"
            hint={hasNoGroups ? NO_GROUPS_WARNING : undefined}
          />

          <SectionTitle as="h3" id="exercise-primary-title">
            Основная группа
          </SectionTitle>
          <div role="radiogroup" aria-labelledby="exercise-primary-title">
            <ListCard>
              <ChoiceRow
                kind="radio"
                title="Без основной группы"
                checked={!primaryId}
                onToggle={() => setPrimaryId('')}
              />
              {muscleGroups.map((group) => (
                <ChoiceRow
                  key={group.id}
                  kind="radio"
                  title={group.name}
                  checked={primaryId === group.id}
                  onToggle={() => selectPrimary(group.id)}
                />
              ))}
            </ListCard>
          </div>

          <SectionTitle as="h3" id="exercise-secondary-title">
            Дополнительные группы
          </SectionTitle>
          <div role="group" aria-labelledby="exercise-secondary-title">
            <ListCard>
              {muscleGroups.map((group) => (
                <ChoiceRow
                  key={group.id}
                  kind="checkbox"
                  title={group.name}
                  checked={secondaryIds.includes(group.id)}
                  disabled={group.id === primaryId}
                  onToggle={() => toggleSecondary(group.id)}
                />
              ))}
            </ListCard>
          </div>

          {errorCode ? (
            <p className="catalog-sheet__error" role="alert">
              {errorMessageFor(errorCode)}
            </p>
          ) : null}
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Удалить упражнение?"
        body="Упражнение скроется из каталога, история сохранится."
        confirmLabel="Удалить"
        confirmVariant="danger"
        busy={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
