import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import {
  WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE,
  WorkoutSkipCancelConfirmDialog,
} from './WorkoutSkipCancelConfirmDialog';
import { WorkoutRescheduleSheet } from './WorkoutRescheduleSheet';
import { WorkoutScheduleRow } from './WorkoutScheduleRow';

type Workout = components['schemas']['WorkoutDto'];
type WorkoutTemplate = components['schemas']['WorkoutTemplateDto'];
type MacroProgressSummary = components['schemas']['ClientMacroProgressSummaryDto'];

type Props = {
  clientId: string;
  macroProgress: MacroProgressSummary | null | undefined;
  mutationsDisabled: boolean;
};

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Converts native datetime-local value to UTC ISO string for the BFF. */
function datetimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}

function formatScheduledAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export function ClientWorkoutSchedulePanel({
  clientId,
  macroProgress,
  mutationsDisabled,
}: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [manualTemplateId, setManualTemplateId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    workoutId: string;
    action: 'skip' | 'cancel';
  } | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    workoutId: string;
    scheduledAt: string;
  } | null>(null);

  const stagesExhausted = Boolean(macroProgress?.stagesExhausted);
  const requireManualTemplate = stagesExhausted || !macroProgress?.currentStageId;

  const sortedWorkouts = useMemo(
    () =>
      [...workouts].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [workouts],
  );

  const loadWorkouts = useCallback(async () => {
    setLoadError(null);
    const { data, error } = await apiClient.GET('/api/clients/{id}/workouts', {
      params: { path: { id: clientId } },
    });
    if (error || !data) {
      setLoadError(error?.error?.code ?? 'WORKOUTS_LOAD_FAILED');
      return;
    }
    setWorkouts(data.workouts);
  }, [clientId]);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    if (!requireManualTemplate) {
      setTemplates([]);
      setManualTemplateId('');
      return;
    }
    void apiClient.GET('/api/templates').then(({ data, error }) => {
      if (error || !data?.templates) {
        setLoadError(error?.error?.code ?? 'TEMPLATES_LOAD_FAILED');
        return;
      }
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setManualTemplateId((prev) => prev || data.templates[0].id);
      }
    });
  }, [requireManualTemplate]);

  const openRescheduleForWorkout = useCallback(
    (workoutId: string) => {
      const workout = workouts.find((w) => w.id === workoutId);
      if (!workout) {
        return;
      }
      setConfirmTarget(null);
      setRescheduleTarget({ workoutId, scheduledAt: workout.scheduledAt });
    },
    [workouts],
  );

  const executeReschedule = useCallback(
    async (workoutId: string, scheduledAtIso: string) => {
      setActionError(null);
      setBusy(true);

      const { data, error } = await apiClient.PATCH('/api/workouts/{id}', {
        params: { path: { id: workoutId } },
        body: { scheduledAt: scheduledAtIso },
      });

      setBusy(false);

      if (error || !data) {
        setActionError(error?.error?.code ?? 'WORKOUT_RESCHEDULE_FAILED');
        return;
      }

      setRescheduleTarget(null);
      await loadWorkouts();
    },
    [loadWorkouts],
  );

  const executeSkipOrCancel = useCallback(
    async (workoutId: string, action: 'skip' | 'cancel') => {
      setActionError(null);
      setBusy(true);

      const path =
        action === 'skip' ? '/api/workouts/{id}/skip' : '/api/workouts/{id}/cancel';

      const { data, error } = await apiClient.POST(path, {
        params: {
          path: { id: workoutId },
          header: { 'Idempotency-Key': newIdempotencyKey() },
        },
      });

      setBusy(false);

      if (error || !data) {
        setActionError(error?.error?.code ?? 'WORKOUT_STATUS_CHANGE_FAILED');
        return;
      }

      setConfirmTarget(null);
      await loadWorkouts();
    },
    [loadWorkouts],
  );

  const handleAssign = useCallback(async () => {
    if (mutationsDisabled || !scheduledLocal) {
      return;
    }
    if (requireManualTemplate && !manualTemplateId) {
      setActionError('VALIDATION_FAILED');
      return;
    }

    setActionError(null);
    setBusy(true);

    const body: { scheduledAt: string; templateId?: string } = {
      scheduledAt: datetimeLocalToIso(scheduledLocal),
    };
    if (requireManualTemplate) {
      body.templateId = manualTemplateId;
    }

    const { data, error } = await apiClient.POST('/api/clients/{id}/workouts', {
      params: {
        path: { id: clientId },
        header: { 'Idempotency-Key': newIdempotencyKey() },
      },
      body,
    });

    setBusy(false);

    if (error || !data) {
      setActionError(error?.error?.code ?? 'ASSIGN_WORKOUT_FAILED');
      return;
    }

    setScheduledLocal('');
    await loadWorkouts();
  }, [
    clientId,
    loadWorkouts,
    manualTemplateId,
    mutationsDisabled,
    requireManualTemplate,
    scheduledLocal,
  ]);

  return (
    <section aria-labelledby="client-workout-schedule-heading">
      <h2 id="client-workout-schedule-heading">Расписание тренировок</h2>

      {loadError ? <p role="alert">{loadError}</p> : null}
      {actionError ? <p role="alert">{actionError}</p> : null}

      {stagesExhausted ? (
        <p role="status">
          Этапы кончились — продлите цикл или выберите шаблон тренировки вручную.
        </p>
      ) : null}

      {!macroProgress && !mutationsDisabled ? (
        <p role="status">Назначьте макроцикл или выберите шаблон вручную для тренировки.</p>
      ) : null}

      <ul>
        {sortedWorkouts.map((w) => (
          <WorkoutScheduleRow
            key={w.id}
            workout={w}
            formattedScheduledAt={formatScheduledAt(w.scheduledAt)}
            showStartStub={w.status === 'pending' && !mutationsDisabled}
            showPendingActions={w.status === 'pending' && !mutationsDisabled}
            busy={busy}
            onReschedule={() => openRescheduleForWorkout(w.id)}
            onSkip={() => setConfirmTarget({ workoutId: w.id, action: 'skip' })}
            onCancel={() => setConfirmTarget({ workoutId: w.id, action: 'cancel' })}
          />
        ))}
      </ul>
      {sortedWorkouts.length === 0 ? <p>Нет тренировок в расписании.</p> : null}

      <div>
        <label htmlFor="workout-scheduled-at">Дата и время</label>
        <input
          id="workout-scheduled-at"
          type="datetime-local"
          value={scheduledLocal}
          disabled={mutationsDisabled || busy}
          onChange={(e) => setScheduledLocal(e.target.value)}
        />
      </div>

      {requireManualTemplate ? (
        <div>
          <label htmlFor="workout-manual-template">Шаблон</label>
          <select
            id="workout-manual-template"
            value={manualTemplateId}
            disabled={mutationsDisabled || busy || templates.length === 0}
            onChange={(e) => setManualTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="button"
        disabled={mutationsDisabled || busy || !scheduledLocal}
        onClick={() => void handleAssign()}
      >
        Назначить тренировку
      </button>

      {confirmTarget ? (
        <WorkoutSkipCancelConfirmDialog
          action={confirmTarget.action}
          onConfirm={() => void executeSkipOrCancel(confirmTarget.workoutId, confirmTarget.action)}
          onReschedule={() => openRescheduleForWorkout(confirmTarget.workoutId)}
          onDismiss={() => setConfirmTarget(null)}
        />
      ) : null}

      {rescheduleTarget ? (
        <WorkoutRescheduleSheet
          initialScheduledAtIso={rescheduleTarget.scheduledAt}
          busy={busy}
          onSubmit={(iso) => void executeReschedule(rescheduleTarget.workoutId, iso)}
          onDismiss={() => setRescheduleTarget(null)}
        />
      ) : null}
    </section>
  );
}

export { WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE };
