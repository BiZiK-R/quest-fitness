import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainerMenuAction } from '@/features/trainer-menu-action/ui/TrainerMenuAction';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';
import {
  BackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  PlusIcon,
} from '@/shared/ui/icons';
import { ListCard } from '@/shared/ui/ListCard';
import { ListRow } from '@/shared/ui/ListRow';
import { PageMeta } from '@/shared/ui/PageMeta';
import { PageState } from '@/shared/ui/PageState';
import { SectionTitle } from '@/shared/ui/SectionTitle';
import { SelectField } from '@/shared/ui/SelectField';
import { TextArea } from '@/shared/ui/TextArea';
import { TextField } from '@/shared/ui/TextField';
import './MacrocyclesPage.css';

type MacrocycleDto = components['schemas']['MacrocycleDto'];
type WorkoutTemplateDto = components['schemas']['WorkoutTemplateDto'];

type StageLine = {
  key: string;
  id?: string;
  templateId: string;
};

type Mode = 'list' | 'editor';

const FORM_ID = 'macrocycle-editor-form';

function emptyStage(key: string): StageLine {
  return { key, templateId: '' };
}

function stagesFromMacro(macro: MacrocycleDto): StageLine[] {
  return macro.stages.map((stage) => ({
    key: stage.id,
    id: stage.id,
    templateId: stage.templateId,
  }));
}

function buildStagesPayload(lines: StageLine[]) {
  return lines
    .filter((line) => line.templateId)
    .map((line, index) => ({
      ...(line.id ? { id: line.id } : {}),
      templateId: line.templateId,
      sortOrder: index,
    }));
}

function templateNameById(
  templates: WorkoutTemplateDto[],
  templateId: string,
): string {
  return templates.find((t) => t.id === templateId)?.name ?? 'Шаблон';
}

export function MacrocyclesPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('list');
  const [macrocycles, setMacrocycles] = useState<MacrocycleDto[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [periodicityNote, setPeriodicityNote] = useState('');
  const [stageLines, setStageLines] = useState<StageLine[]>([]);
  const [stageSeq, setStageSeq] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError(null);
    const [macrosRes, templatesRes] = await Promise.all([
      apiClient.GET('/api/macrocycles'),
      apiClient.GET('/api/templates'),
    ]);
    if (macrosRes.error || templatesRes.error) {
      setLoadError(
        macrosRes.error?.error?.code ?? templatesRes.error?.error?.code ?? 'LOAD_FAILED',
      );
      return;
    }
    setMacrocycles(macrosRes.data?.macrocycles ?? []);
    setTemplates(templatesRes.data?.templates ?? []);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setPeriodicityNote('');
    setStageLines([emptyStage('stage_0')]);
    setStageSeq(1);
    setFormError(null);
    setMode('editor');
  }

  function openEdit(macro: MacrocycleDto) {
    setEditingId(macro.id);
    setName(macro.name);
    setPeriodicityNote(macro.periodicityNote ?? '');
    setStageLines(stagesFromMacro(macro));
    setFormError(null);
    setMode('editor');
  }

  function backToList() {
    setMode('list');
    setFormError(null);
  }

  function moveStageLine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stageLines.length) {
      return;
    }
    setStageLines((prev) => {
      const next = [...prev];
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function updateStageLine(index: number, patch: Partial<StageLine>) {
    setStageLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function removeStageLine(index: number) {
    setStageLines((prev) => prev.filter((_, i) => i !== index));
  }

  function addStageLine() {
    const key = `stage_${stageSeq}`;
    setStageSeq((n) => n + 1);
    setStageLines((prev) => [...prev, emptyStage(key)]);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Впишите название.');
      return;
    }
    const stages = buildStagesPayload(stageLines);
    if (stages.length === 0) {
      setFormError('Добавьте хотя бы один этап с шаблоном.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        const { error } = await apiClient.PATCH('/api/macrocycles/{id}', {
          params: { path: { id: editingId } },
          body: {
            name: trimmedName,
            periodicityNote: periodicityNote.trim() || null,
            stages,
          },
        });
        if (error) {
          setFormError(error.error?.code ?? 'SAVE_FAILED');
          return;
        }
      } else {
        const { error } = await apiClient.POST('/api/macrocycles', {
          body: {
            name: trimmedName,
            periodicityNote: periodicityNote.trim() || null,
            stages,
          },
        });
        if (error) {
          setFormError(error.error?.code ?? 'SAVE_FAILED');
          return;
        }
      }
      await loadData();
      backToList();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === 'list') {
    return (
      <>
        <PageMeta title="Макроциклы — Quest Fitness" robots="noindex,nofollow" />
        <AppShell
          title="Макроциклы"
          leading={
            <IconButton label="Назад" onClick={() => navigate('/pool')}>
              <BackIcon />
            </IconButton>
          }
          action={<TrainerMenuAction />}
          bottom={
            !loadError && macrocycles.length > 0 ? (
              <BottomCta
                primary={
                  <Button variant="primary" fullWidth onClick={openCreate}>
                    Новый макроцикл
                  </Button>
                }
              />
            ) : undefined
          }
        >
          {loadError ? (
            <PageState status="error" errorCode={loadError} onRetry={() => void loadData()} />
          ) : macrocycles.length === 0 ? (
            <EmptyState
              title="Макроциклов пока нет"
              description="Соберите программу из шаблонов — её можно назначать клиентам."
              action={
                <Button variant="primary" fullWidth onClick={openCreate}>
                  Новый макроцикл
                </Button>
              }
            />
          ) : (
            <ListCard label="Макроциклы зала">
              {macrocycles.map((macro) => (
                <ListRow
                  key={macro.id}
                  title={macro.name}
                  meta={`этапов: ${macro.stages.length}`}
                  onClick={() => openEdit(macro)}
                />
              ))}
            </ListCard>
          )}
        </AppShell>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Макроциклы — Quest Fitness" robots="noindex,nofollow" />
      <AppShell
        title={editingId ? name || 'Макроцикл' : 'Новый макроцикл'}
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
                disabled={!name.trim()}
              >
                {editingId ? 'Сохранить' : 'Создать макроцикл'}
              </Button>
            }
          />
        }
      >
        <form
          id={FORM_ID}
          className="macro-editor"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          {formError ? (
            <p className="type-meta macro-editor__error" role="alert">
              {errorMessageFor(formError)}
            </p>
          ) : null}

          <TextField
            id="macro-name"
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={128}
            autoComplete="off"
            required
          />

          <TextArea
            id="macro-periodicity"
            label="Периодичность"
            value={periodicityNote}
            onChange={(e) => setPeriodicityNote(e.target.value)}
            maxLength={2000}
            rows={2}
            hint="Необязательно — подсказка для тренера"
          />

          <SectionTitle
            action={
              <Button variant="secondary" onClick={addStageLine}>
                <PlusIcon size={20} />
                Этап
              </Button>
            }
          >
            Этапы
          </SectionTitle>

          {stageLines.length === 0 ? (
            <EmptyState
              size="title"
              title="Этапов пока нет"
              description="Добавьте этап и выберите шаблон для каждого."
              action={
                <Button variant="primary" fullWidth onClick={addStageLine}>
                  Добавить этап
                </Button>
              }
            />
          ) : (
            <div className="macro-editor__stages">
              {stageLines.map((line, index) => (
                <div key={line.key} className="macro-editor__stage">
                  <SelectField
                    id={`macro-stage-${line.key}`}
                    label={`Этап ${index + 1}`}
                    value={line.templateId}
                    placeholder="Выберите шаблон"
                    onChange={(e) => updateStageLine(index, { templateId: e.target.value })}
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </SelectField>
                  <div className="macro-editor__stage-actions">
                    <IconButton
                      label="Выше"
                      disabled={index === 0}
                      onClick={() => moveStageLine(index, -1)}
                    >
                      <ChevronUpIcon />
                    </IconButton>
                    <IconButton
                      label="Ниже"
                      disabled={index === stageLines.length - 1}
                      onClick={() => moveStageLine(index, 1)}
                    >
                      <ChevronDownIcon />
                    </IconButton>
                    <IconButton label="Удалить этап" onClick={() => removeStageLine(index)}>
                      <CloseIcon />
                    </IconButton>
                  </div>
                  {line.templateId ? (
                    <p className="type-meta type-muted macro-editor__stage-hint">
                      {templateNameById(templates, line.templateId)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </form>
      </AppShell>
    </>
  );
}
