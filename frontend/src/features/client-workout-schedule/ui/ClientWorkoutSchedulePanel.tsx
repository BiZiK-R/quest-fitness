import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SelectField } from '@/shared/ui/SelectField';
import { TextField } from '@/shared/ui/TextField';
import {
  WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE,
  WorkoutSkipCancelConfirmDialog,
} from './WorkoutSkipCancelConfirmDialog';
import { WorkoutRescheduleSheet } from './WorkoutRescheduleSheet';
import { WorkoutScheduleRow } from './WorkoutScheduleRow';
import './ClientWorkoutSchedulePanel.css';

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
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
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
  const needsTemplateCatalog = requireManualTemplate;
  const noTemplatesReady = templatesLoaded && needsTemplateCatalog && templates.length === 0;
  const canShowAssignForm =
    !mutationsDisabled && !noTemplatesReady && (!needsTemplateCatalog || templatesLoaded);

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
      setTemplatesLoaded(true);
      return;
    }
    setTemplatesLoaded(false);
    void apiClient.GET('/api/templates').then(({ data, error }) => {
      if (error || !data?.templates) {
        setLoadError(error?.error?.code ?? 'TEMPLATES_LOAD_FAILED');
        setTemplates([]);
        setTemplatesLoaded(true);
        return;
      }
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setManualTemplateId((prev) => prev || data.templates[0].id);
      } else {
        setManualTemplateId('');
      }
      setTemplatesLoaded(true);
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

  const handleStartSession = useCallback(
    async (workoutId: string) => {
      setActionError(null);
      setBusy(true);

      const { data, error } = await apiClient.POST('/api/workouts/{id}/session', {
        params: { path: { id: workoutId } },
      });

      setBusy(false);

      if (error || !data) {
        setActionError(error?.error?.code ?? 'SESSION_START_FAILED');
        return;
      }

      navigate(`/sessions/${data.id}`);
    },
    [navigate],
  );

  const handleAssign = useCallback(async () => {
    if (mutationsDisabled || !scheduledLocal || !canShowAssignForm) {
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
    canShowAssignForm,
    clientId,
    loadWorkouts,
    manualTemplateId,
    mutationsDisabled,
    requireManualTemplate,
    scheduledLocal,
  ]);

  return (
    <div className="client-schedule">
      {loadError ? (
        <p className="type-meta client-schedule__error" role="alert">
          {errorMessageFor(loadError)}
        </p>
      ) : null}
      {actionError ? (
        <p className="type-meta client-schedule__error" role="alert">
          {errorMessageFor(actionError)}
        </p>
      ) : null}

      {stagesExhausted && canShowAssignForm ? (
        <p className="type-meta type-muted" role="status">
          Этапы кончились — выберите шаблон вручную.
        </p>
      ) : null}

      {!macroProgress && canShowAssignForm ? (
        <p className="type-meta type-muted" role="status">
          Можно назначить шаблон вручную или сначала выбрать программу в блоке «Программа».
        </p>
      ) : null}

      {sortedWorkouts.length === 0 && !noTemplatesReady && !mutationsDisabled ? (
        <p className="type-meta type-muted" role="status">
          Ближайших тренировок нет — назначьте первую ниже.
        </p>
      ) : null}

      {sortedWorkouts.length === 0 && mutationsDisabled ? (
        <p className="type-meta type-muted" role="status">
          Расписание откроется после «Взять клиента».
        </p>
      ) : null}

      {noTemplatesReady && !mutationsDisabled ? (
        <EmptyState
          size="title"
          title="Нужен шаблон тренировки"
          description="Соберите шаблон из упражнений — потом вернётесь сюда и назначите дату."
          action={
            <Button variant="primary" fullWidth onClick={() => navigate('/templates')}>
              К шаблонам
            </Button>
          }
        />
      ) : null}

      {sortedWorkouts.length > 0 ? (
        <ul className="client-schedule__list" aria-label="Расписание клиента">
          {sortedWorkouts.map((w) => (
            <WorkoutScheduleRow
              key={w.id}
              workout={w}
              formattedScheduledAt={formatScheduledAt(w.scheduledAt)}
              showStartAction={w.status === 'pending' && !mutationsDisabled}
              showPendingActions={w.status === 'pending' && !mutationsDisabled}
              busy={busy}
              onStart={() => void handleStartSession(w.id)}
              onReschedule={() => openRescheduleForWorkout(w.id)}
              onSkip={() => setConfirmTarget({ workoutId: w.id, action: 'skip' })}
              onCancel={() => setConfirmTarget({ workoutId: w.id, action: 'cancel' })}
            />
          ))}
        </ul>
      ) : null}

      {canShowAssignForm ? (
        <div className="client-schedule__assign">
          <TextField
            id="workout-scheduled-at"
            label="Дата и время"
            type="datetime-local"
            value={scheduledLocal}
            disabled={busy}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />

          {requireManualTemplate ? (
            <SelectField
              id="workout-manual-template"
              label="Шаблон"
              value={manualTemplateId}
              disabled={busy || templates.length === 0}
              placeholder="Выберите шаблон"
              onChange={(e) => setManualTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
          ) : null}

          <Button
            variant="primary"
            fullWidth
            loading={busy}
            disabled={!scheduledLocal || (requireManualTemplate && !manualTemplateId)}
            onClick={() => void handleAssign()}
          >
            Назначить тренировку
          </Button>
        </div>
      ) : null}

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
    </div>
  );
}

export { WORKOUT_SKIP_CANCEL_CONFIRM_MESSAGE };
