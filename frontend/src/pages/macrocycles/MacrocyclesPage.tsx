import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type MacrocycleDto = components['schemas']['MacrocycleDto'];
type WorkoutTemplateDto = components['schemas']['WorkoutTemplateDto'];
type CreateMacrocycleRequestDto = components['schemas']['CreateMacrocycleRequestDto'];
type UpdateMacrocycleRequestDto = components['schemas']['UpdateMacrocycleRequestDto'];

type StageLine = {
  key: string;
  id?: string;
  templateId: string;
};

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

export function MacrocyclesPage() {
  const [macrocycles, setMacrocycles] = useState<MacrocycleDto[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplateDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [periodicityNote, setPeriodicityNote] = useState('');
  const [stageLines, setStageLines] = useState<StageLine[]>([emptyStage('stage_0')]);
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
      setMacrocycles([]);
      setTemplates([]);
      setLoadError(
        macrosRes.error?.error?.code ??
          templatesRes.error?.error?.code ??
          'LOAD_FAILED',
      );
      return;
    }
    setMacrocycles(macrosRes.data?.macrocycles ?? []);
    setTemplates(templatesRes.data?.templates ?? []);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetCreateForm() {
    setEditingId(null);
    setName('');
    setPeriodicityNote('');
    setStageLines([emptyStage('stage_0')]);
    setStageSeq(1);
    setFormError(null);
  }

  function startEdit(macro: MacrocycleDto) {
    setEditingId(macro.id);
    setName(macro.name);
    setPeriodicityNote(macro.periodicityNote ?? '');
    const lines = stagesFromMacro(macro);
    setStageLines(lines.length > 0 ? lines : [emptyStage('stage_0')]);
    setFormError(null);
  }

  function addStageLine() {
    const key = `stage_${stageSeq}`;
    setStageSeq((n) => n + 1);
    setStageLines((prev) => [...prev, emptyStage(key)]);
  }

  function removeStageLine(index: number) {
    setStageLines((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStageLine(index: number, direction: -1 | 1) {
    const target = index + direction;
    setStageLines((prev) => {
      if (target < 0 || target >= prev.length) {
        return prev;
      }
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const stages = buildStagesPayload(stageLines);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('NAME_REQUIRED');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        const body: UpdateMacrocycleRequestDto = {
          name: trimmedName,
          periodicityNote: periodicityNote.trim() || null,
          stages,
        };
        const { error } = await apiClient.PATCH('/api/macrocycles/{id}', {
          params: { path: { id: editingId } },
          body,
        });
        if (error) {
          setFormError(error.error?.code ?? 'SAVE_FAILED');
          return;
        }
      } else {
        const body: CreateMacrocycleRequestDto = {
          name: trimmedName,
          periodicityNote: periodicityNote.trim() || null,
          stages,
        };
        const { error } = await apiClient.POST('/api/macrocycles', { body });
        if (error) {
          setFormError(error.error?.code ?? 'SAVE_FAILED');
          return;
        }
      }
      await loadData();
      resetCreateForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageMeta title="Макроциклы — Quest Fitness" robots="noindex,nofollow" />
      <p>
        <Link to="/pool">← Пул клиентов</Link>
      </p>
      <h1>Макроциклы</h1>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {formError ? <p role="alert">{formError}</p> : null}

      <section>
        <h2>Список</h2>
        {macrocycles.length === 0 ? (
          <p>Пока нет макроциклов</p>
        ) : (
          <ul>
            {macrocycles.map((macro) => (
              <li key={macro.id}>
                <button type="button" onClick={() => startEdit(macro)}>
                  {macro.name}
                </button>
                <span> — этапов: {macro.stages.length}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={resetCreateForm}>
          Новый макроцикл
        </button>
      </section>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <h2>{editingId ? 'Редактирование' : 'Создание'}</h2>
        <label htmlFor="macro-name">Название</label>
        <input
          id="macro-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={128}
          required
        />

        <label htmlFor="macro-periodicity">Примечание по периодичности</label>
        <textarea
          id="macro-periodicity"
          value={periodicityNote}
          onChange={(e) => setPeriodicityNote(e.target.value)}
          maxLength={2000}
        />

        <h3>Этапы (шаблоны)</h3>
        {stageLines.map((line, index) => (
          <div key={line.key}>
            <label htmlFor={`macro-stage-${line.key}`}>Шаблон этапа {index + 1}</label>
            <select
              id={`macro-stage-${line.key}`}
              value={line.templateId}
              onChange={(e) => updateStageLine(index, { templateId: e.target.value })}
            >
              <option value="">— выберите шаблон —</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label={`Поднять этап ${index + 1}`}
              disabled={index === 0}
              onClick={() => moveStageLine(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Опустить этап ${index + 1}`}
              disabled={index === stageLines.length - 1}
              onClick={() => moveStageLine(index, 1)}
            >
              ↓
            </button>
            <button type="button" onClick={() => removeStageLine(index)}>
              Удалить этап
            </button>
          </div>
        ))}
        <button type="button" onClick={addStageLine}>
          Добавить этап
        </button>

        <p>
          <button type="submit" disabled={isSubmitting}>
            {editingId ? 'Сохранить макроцикл' : 'Создать макроцикл'}
          </button>
        </p>
      </form>
    </>
  );
}
