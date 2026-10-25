import { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import {
  BackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  PlusIcon,
} from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { TextArea } from '@/shared/ui/TextArea';
import { TextField } from '@/shared/ui/TextField';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import { PlannedSetsSheet } from './PlannedSetsSheet';
import {
  TEMPLATE_TYPES,
  buildTemplateBody,
  draftFromTemplate,
  emptyDraft,
  lineMeta,
  templateListMeta,
  type ExerciseLine,
  type TemplateDraft,
} from './template-draft';
import './TemplatesPage.css';

type WorkoutTemplateDto = components['schemas']['WorkoutTemplateDto'];
type ExerciseDto = components['schemas']['ExerciseDto'];

const CONFLICT_MESSAGE =
  'Другой тренер изменил этот шаблон, пока вы редактировали.';

const FORM_ID = 'template-editor-form';

type Mode = 'list' | 'editor';

export function TemplatesPage() {
  const navigate = useNavigate();
  const dialogTitleId = useId();
  const [mode, setMode] = useState<Mode>('list');
  const [templates, setTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<ExerciseDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft);
  const [lineSeq, setLineSeq] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictCurrentVersion, setConflictCurrentVersion] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [plannedIndex, setPlannedIndex] = useState<number | null>(null);

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

  function openCreate() {
    setEditingId(null);
    setVersion(1);
    setDraft(emptyDraft());
    setLineSeq(1);
    setFormError(null);
    setConflictOpen(false);
    setMode('editor');
  }

  function openEdit(template: WorkoutTemplateDto) {
    setEditingId(template.id);
    setVersion(template.version);
    setDraft(draftFromTemplate(template));
    setFormError(null);
    setConflictOpen(false);
    setMode('editor');
  }

  function backToList() {
    setMode('list');
    setFormError(null);
    setPickerOpen(false);
    setPlannedIndex(null);
  }

  function patchDraft(patch: Partial<TemplateDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function moveLine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.lines.length) {
      return;
    }
    setDraft((prev) => {
      const next = [...prev.lines];
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return { ...prev, lines: next };
    });
  }

  function updateLine(index: number, patch: Partial<ExerciseLine>) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  }

  function removeLine(index: number) {
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }

  function pickExercise(exercise: ExerciseDto) {
    const key = `line_${lineSeq}`;
    setLineSeq((n) => n + 1);
    setDraft((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          key,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          plannedSets: '',
          plannedReps: '',
          plannedWeightKg: '',
          notes: '',
        },
      ],
    }));
    setPickerOpen(false);
  }

  async function persistTemplate(forcedVersion?: number) {
    if (!draft.name.trim() || !draft.type.trim()) {
      setFormError('Впишите название шаблона.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    const body = buildTemplateBody(draft);

    if (editingId) {
      const { data, error, response } = await apiClient.PATCH('/api/templates/{id}', {
        params: { path: { id: editingId } },
        body: { ...body, version: forcedVersion ?? version },
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
      await loadData();
      backToList();
      return;
    }

    const { data, error } = await apiClient.POST('/api/templates', { body });
    setIsSubmitting(false);
    if (error || !data) {
      setFormError(error?.error?.code ?? 'SAVE_FAILED');
      return;
    }
    await loadData();
    backToList();
  }

  async function handleConflictReload() {
    setConflictOpen(false);
    if (!editingId) {
      await loadData();
      openCreate();
      return;
    }
    const { data, error } = await apiClient.GET('/api/templates/{id}', {
      params: { path: { id: editingId } },
    });
    if (error || !data) {
      setFormError(error?.error?.code ?? 'RELOAD_FAILED');
      return;
    }
    openEdit(data);
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

  if (mode === 'list') {
    return (
      <>
        <PageMeta title="Шаблоны тренировок — Quest Fitness" robots="noindex,nofollow" />
        <AppShell
          title="Шаблоны тренировки"
          leading={
            <IconButton label="Назад" onClick={() => navigate('/pool')}>
              <BackIcon />
            </IconButton>
          }
          action={<TrainerMenuAction />}
          bottom={
            !loadError && templates.length > 0 ? (
              <BottomCta
                primary={
                  <Button variant="primary" fullWidth onClick={openCreate}>
                    Новый шаблон
                  </Button>
                }
              />
            ) : undefined
          }
        >
          {loadError ? (
            <PageState
              status="error"
              errorCode={loadError}
              onRetry={() => void loadData()}
            />
          ) : templates.length === 0 ? (
            <EmptyState
              title="Шаблонов пока нет"
              description="Соберите тренировку из упражнений — её можно назначать клиентам."
              action={
                <Button variant="primary" fullWidth onClick={openCreate}>
                  Новый шаблон
                </Button>
              }
            />
          ) : (
            <ListCard label="Шаблоны зала">
              {templates.map((template) => (
                <ListRow
                  key={template.id}
                  title={template.name}
                  meta={templateListMeta(template)}
                  metaPlacement="below"
                  onClick={() => openEdit(template)}
                />
              ))}
            </ListCard>
          )}
        </AppShell>
      </>
    );
  }

  const plannedLine = plannedIndex != null ? draft.lines[plannedIndex] : null;

  return (
    <>
      <PageMeta title="Шаблоны тренировок — Quest Fitness" robots="noindex,nofollow" />
      <AppShell
        title={editingId ? draft.name || 'Шаблон' : 'Новый шаблон'}
        leading={
          <IconButton label="К списку" onClick={backToList}>
            <BackIcon />
          </IconButton>
        }
        bottom={
          <BottomCta
            primary={
              <Button
                type="submit"
                form={FORM_ID}
                variant="primary"
                fullWidth
                loading={isSubmitting}
                disabled={!draft.name.trim()}
              >
                {editingId ? 'Сохранить' : 'Создать шаблон'}
              </Button>
            }
          />
        }
      >
        <form
          id={FORM_ID}
          className="templates-editor"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void persistTemplate();
          }}
        >
          {formError ? (
            <p className="type-meta templates-editor__error" role="alert">
              {errorMessageFor(formError)}
            </p>
          ) : null}

          <TextField
            id="template-name"
            label="Название"
            value={draft.name}
            onChange={(e) => patchDraft({ name: e.target.value })}
            maxLength={128}
            autoComplete="off"
            required
          />

          <SegmentedControl
            label="Тип"
            value={
              (TEMPLATE_TYPES.some((t) => t.value === draft.type)
                ? draft.type
                : 'strength') as (typeof TEMPLATE_TYPES)[number]['value']
            }
            options={TEMPLATE_TYPES}
            onChange={(value) => patchDraft({ type: value })}
          />

          <TextArea
            id="template-description"
            label="Описание"
            value={draft.description}
            onChange={(e) => patchDraft({ description: e.target.value })}
            maxLength={2000}
            rows={3}
            hint="Необязательно"
          />

          <div className="templates-editor__pair">
            <TextField
              id="template-duration"
              label="Длительность"
              inputMode="numeric"
              value={draft.durationMinutes}
              onChange={(e) =>
                patchDraft({ durationMinutes: e.target.value.replace(/\D/g, '') })
              }
              trailing={<span className="templates-sheet__unit">мин</span>}
              autoComplete="off"
            />
            <TextField
              id="template-microcycle"
              label="Микроцикл"
              inputMode="numeric"
              value={draft.microcycleWeeks}
              onChange={(e) =>
                patchDraft({ microcycleWeeks: e.target.value.replace(/\D/g, '') })
              }
              trailing={<span className="templates-sheet__unit">нед</span>}
              autoComplete="off"
            />
          </div>

          <SectionTitle
            action={
              <Button variant="secondary" onClick={() => setPickerOpen(true)}>
                <PlusIcon size={20} />
                Добавить
              </Button>
            }
          >
            Упражнения
          </SectionTitle>

          {draft.lines.length === 0 ? (
            <EmptyState
              size="title"
              title="Упражнений в шаблоне нет"
              description="Добавьте упражнения из каталога."
              action={
                <Button variant="primary" fullWidth onClick={() => setPickerOpen(true)}>
                  Добавить упражнение
                </Button>
              }
            />
          ) : (
            <ul className="templates-editor__lines" aria-label="Упражнения шаблона">
              {draft.lines.map((line, index) => (
                <li key={line.key} className="templates-editor__line">
                  <button
                    type="button"
                    className="templates-editor__line-main"
                    aria-label={`Настроить подходы: ${line.exerciseName || 'Упражнение'}`}
                    onClick={() => setPlannedIndex(index)}
                  >
                    <span className="templates-editor__line-text">
                      <span className="templates-editor__line-title">
                        {line.exerciseName || 'Упражнение'}
                      </span>
                      <span className="templates-editor__line-meta type-meta type-muted">
                        {lineMeta(line)}
                      </span>
                    </span>
                    <ChevronRightIcon className="templates-editor__line-chevron" />
                  </button>
                  <div className="templates-editor__row-actions">
                    <IconButton
                      label="Выше"
                      disabled={index === 0}
                      onClick={() => moveLine(index, -1)}
                    >
                      <ChevronUpIcon />
                    </IconButton>
                    <IconButton
                      label="Ниже"
                      disabled={index === draft.lines.length - 1}
                      onClick={() => moveLine(index, 1)}
                    >
                      <ChevronDownIcon />
                    </IconButton>
                    <IconButton label="Удалить" onClick={() => removeLine(index)}>
                      <CloseIcon />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {editingId ? (
            <p className="type-meta type-muted">Версия {version}</p>
          ) : null}
        </form>
      </AppShell>

      {pickerOpen ? (
        <ExercisePickerSheet
          catalog={catalogExercises}
          onPick={pickExercise}
          onCreated={(exercise) => {
            setCatalogExercises((prev) =>
              [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)),
            );
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      {plannedLine != null && plannedIndex != null ? (
        <PlannedSetsSheet
          line={plannedLine}
          onApply={(patch) => {
            updateLine(plannedIndex, patch);
            setPlannedIndex(null);
          }}
          onClose={() => setPlannedIndex(null)}
        />
      ) : null}

      <ConfirmDialog
        open={conflictOpen}
        title="Конфликт версий"
        body={CONFLICT_MESSAGE}
        confirmLabel="Сохранить поверх"
        confirmVariant="danger"
        alternativeLabel="Открыть заново"
        onAlternative={() => void handleConflictReload()}
        onConfirm={() => void handleConflictForceSave()}
        onCancel={() => setConflictOpen(false)}
        busy={isSubmitting}
      />
      <span id={dialogTitleId} className="ui-visually-hidden">
        Конфликт версий
      </span>
    </>
  );
}
