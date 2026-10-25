import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { Button } from '@/shared/ui/Button';
import { SelectField } from '@/shared/ui/SelectField';
import './ClientMacroProgressPanel.css';

type Macrocycle = components['schemas']['MacrocycleDto'];
type MacroProgressSummary = components['schemas']['ClientMacroProgressSummaryDto'];

type Props = {
  clientId: string;
  initialProgress: MacroProgressSummary | null | undefined;
  mutationsDisabled: boolean;
  onProgressChange: (progress: MacroProgressSummary | null) => void;
};

/**
 * Назначение программы (макроцикла) и сдвиг этапа.
 * Без ложных disabled-полей: формы только когда клиент взят и есть что назначить.
 */
export function ClientMacroProgressPanel({
  clientId,
  initialProgress,
  mutationsDisabled,
  onProgressChange,
}: Props) {
  const navigate = useNavigate();
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState('');
  const [progress, setProgress] = useState<MacroProgressSummary | null>(
    initialProgress ?? null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [macrosLoaded, setMacrosLoaded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProgress(initialProgress ?? null);
  }, [initialProgress]);

  useEffect(() => {
    void apiClient.GET('/api/macrocycles').then(({ data, error }) => {
      if (error || !data?.macrocycles) {
        setLoadError(error?.error?.code ?? 'MACRO_LOAD_FAILED');
        setMacrosLoaded(true);
        return;
      }
      setMacrocycles(data.macrocycles);
      if (data.macrocycles.length > 0) {
        setSelectedMacroId((prev) => prev || data.macrocycles[0]!.id);
      }
      setMacrosLoaded(true);
    });
  }, []);

  const assignedMacro = useMemo(() => {
    if (!progress?.macrocycleId) {
      return null;
    }
    return macrocycles.find((m) => m.id === progress.macrocycleId) ?? null;
  }, [macrocycles, progress?.macrocycleId]);

  const stageOptions = assignedMacro?.stages ?? [];

  const handleAssign = useCallback(async () => {
    if (!selectedMacroId || mutationsDisabled) {
      return;
    }
    setActionError(null);
    setBusy(true);
    const { data, error } = await apiClient.PUT('/api/clients/{id}/macro-progress', {
      params: { path: { id: clientId } },
      body: { macrocycleId: selectedMacroId },
    });
    setBusy(false);
    if (error || !data) {
      setActionError(error?.error?.code ?? 'ASSIGN_FAILED');
      return;
    }
    setProgress(data);
    onProgressChange(data);
  }, [clientId, mutationsDisabled, onProgressChange, selectedMacroId]);

  const handleStageOverride = useCallback(
    async (currentStageId: string) => {
      if (mutationsDisabled || !currentStageId) {
        return;
      }
      setActionError(null);
      setBusy(true);
      const { data, error } = await apiClient.PATCH('/api/clients/{id}/macro-progress', {
        params: { path: { id: clientId } },
        body: { currentStageId },
      });
      setBusy(false);
      if (error || !data) {
        setActionError(error?.error?.code ?? 'OVERRIDE_FAILED');
        return;
      }
      setProgress(data);
      onProgressChange(data);
    },
    [clientId, mutationsDisabled, onProgressChange],
  );

  if (mutationsDisabled && !progress) {
    return (
      <p className="type-meta type-muted" role="status">
        Программу можно назначить после «Взять клиента».
      </p>
    );
  }

  return (
    <div className="client-macro-progress">
      {loadError ? (
        <p className="type-meta client-macro-progress__error" role="alert">
          {errorMessageFor(loadError)}
        </p>
      ) : null}
      {actionError ? (
        <p className="type-meta client-macro-progress__error" role="alert">
          {errorMessageFor(actionError)}
        </p>
      ) : null}

      {progress ? (
        <p className="type-body client-macro-progress__current">
          Сейчас: <strong>{progress.macrocycleName ?? 'Программа'}</strong>
        </p>
      ) : null}

      {macrosLoaded && macrocycles.length === 0 && !loadError ? (
        <p className="type-meta type-muted" role="status">
          Программ пока нет — достаточно шаблона в расписании.{' '}
          <button
            type="button"
            className="client-macro-progress__inline-link"
            onClick={() => navigate('/macrocycles')}
          >
            Открыть программы
          </button>
        </p>
      ) : null}

      {macrosLoaded && macrocycles.length > 0 && !mutationsDisabled ? (
        <>
          {!progress ? (
            <p className="type-meta type-muted">Необязательно: программа задаёт этапы автоматически.</p>
          ) : null}
          <SelectField
            id="macro-select"
            label="Программа"
            value={selectedMacroId}
            disabled={busy}
            onChange={(e) => setSelectedMacroId(e.target.value)}
          >
            {macrocycles.map((macro) => (
              <option key={macro.id} value={macro.id}>
                {macro.name}
              </option>
            ))}
          </SelectField>

          <Button
            variant="secondary"
            fullWidth
            loading={busy}
            disabled={!selectedMacroId}
            onClick={() => void handleAssign()}
          >
            {progress ? 'Сменить программу' : 'Назначить программу'}
          </Button>
        </>
      ) : null}

      {progress && stageOptions.length > 0 && !mutationsDisabled ? (
        <SelectField
          id="stage-override"
          label="Текущий этап"
          value={progress.currentStageId ?? ''}
          disabled={busy}
          onChange={(e) => void handleStageOverride(e.target.value)}
        >
          {stageOptions.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.templateName ?? `Этап ${stage.sortOrder + 1}`}
            </option>
          ))}
        </SelectField>
      ) : null}

      {progress?.stagesExhausted ? (
        <p className="type-meta client-macro-progress__error" role="alert">
          Этапы кончились — продлите программу или выберите шаблон вручную в расписании.
        </p>
      ) : null}
    </div>
  );
}
