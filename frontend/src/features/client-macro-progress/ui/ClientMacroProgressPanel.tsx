import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';

type Macrocycle = components['schemas']['MacrocycleDto'];
type MacroProgressSummary = components['schemas']['ClientMacroProgressSummaryDto'];

type Props = {
  clientId: string;
  initialProgress: MacroProgressSummary | null | undefined;
  mutationsDisabled: boolean;
  onProgressChange: (progress: MacroProgressSummary | null) => void;
};

export function ClientMacroProgressPanel({
  clientId,
  initialProgress,
  mutationsDisabled,
  onProgressChange,
}: Props) {
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState('');
  const [progress, setProgress] = useState<MacroProgressSummary | null>(
    initialProgress ?? null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProgress(initialProgress ?? null);
  }, [initialProgress]);

  useEffect(() => {
    void apiClient.GET('/api/macrocycles').then(({ data, error }) => {
      if (error || !data?.macrocycles) {
        setLoadError(error?.error?.code ?? 'MACRO_LOAD_FAILED');
        return;
      }
      setMacrocycles(data.macrocycles);
      if (data.macrocycles.length > 0) {
        setSelectedMacroId((prev) => prev || data.macrocycles[0].id);
      }
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
      if (mutationsDisabled) {
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

  return (
    <section aria-labelledby="client-macro-progress-heading" className="client-macro-progress">
      <h2 id="client-macro-progress-heading">Макроцикл</h2>
      {loadError ? <p role="alert">{loadError}</p> : null}
      {actionError ? <p role="alert">{actionError}</p> : null}

      <label htmlFor="macro-select">Макроцикл</label>
      <select
        id="macro-select"
        value={selectedMacroId}
        disabled={mutationsDisabled || busy}
        onChange={(e) => setSelectedMacroId(e.target.value)}
      >
        {macrocycles.map((macro) => (
          <option key={macro.id} value={macro.id}>
            {macro.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={mutationsDisabled || busy || !selectedMacroId}
        onClick={() => void handleAssign()}
      >
        Назначить макроцикл
      </button>

      {progress ? (
        <>
          <p>
            Текущий макроцикл: <strong>{progress.macrocycleName ?? progress.macrocycleId}</strong>
          </p>
          <label htmlFor="stage-override">Этап</label>
          <select
            id="stage-override"
            value={progress.currentStageId ?? ''}
            disabled={mutationsDisabled || busy || stageOptions.length === 0}
            onChange={(e) => void handleStageOverride(e.target.value)}
          >
            {stageOptions.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.templateName ?? stage.id} (порядок {stage.sortOrder})
              </option>
            ))}
          </select>
          {progress.stagesExhausted ? (
            <p role="alert">
              Этапы кончились — продлите цикл или выберите шаблон тренировки вручную.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
