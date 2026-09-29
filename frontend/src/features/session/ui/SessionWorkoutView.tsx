import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { components } from '@/shared/api/schema';
import { createModifier, listModifiers, type SetModifierDto } from '../api/modifiers-api';
import { deleteSessionSet, upsertSessionSet } from '../api/session-set-api';
import { hexForSetModifierToken } from '../lib/set-modifier-palette';
import { setSyncIndicatorLabel, type SetSyncState } from '../lib/set-sync-state';
import { useSessionDurationCountdown } from '../lib/use-session-duration-countdown';
import {
  computeRestEndsAt,
  exerciseIndexAfterSetConfirm,
  findExerciseIndexById,
  REST_EXTEND_SECONDS,
  shouldStartRestAfterSet,
} from '../lib/rest-after-set';
import { SessionRestTimer } from './SessionRestTimer';
import { SessionSetLogger, type SessionSetLoggerValues } from './SessionSetLogger';
import { SetModifierSheet } from './SetModifierSheet';
import './SessionWorkoutView.css';

type SessionDto = components['schemas']['SessionDto'];
type SessionExercise = components['schemas']['SessionExerciseDto'];
type SetDto = components['schemas']['SetDto'];

type Props = {
  session: SessionDto;
};

function formatTargets(exercise: SessionExercise): string {
  const parts: string[] = [];
  if (exercise.plannedSets != null) {
    parts.push(`${exercise.plannedSets}×`);
  }
  if (exercise.plannedReps != null) {
    parts.push(String(exercise.plannedReps));
  }
  if (exercise.plannedWeightKg != null) {
    parts.push(`${exercise.plannedWeightKg} кг`);
  }
  if (parts.length === 0) {
    return 'План не задан';
  }
  return parts.join(' ');
}

function loggerDefaultsForExercise(exercise: SessionExercise | undefined): SessionSetLoggerValues {
  return {
    weightKg: exercise?.plannedWeightKg ?? 0,
    reps: exercise?.plannedReps ?? 0,
    rpe: 0,
  };
}

function shortModifierLabel(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 10) {
    return trimmed;
  }
  return `${trimmed.slice(0, 9)}…`;
}

function formatSetLine(set: SetDto): string {
  const parts: string[] = [`#${set.sequenceIndex}`];
  if (set.weightKg != null) {
    parts.push(`${set.weightKg} кг`);
  }
  if (set.reps != null) {
    parts.push(`×${set.reps}`);
  }
  if (set.rpe != null) {
    parts.push(`RPE ${set.rpe}`);
  }
  return parts.join(' ');
}

export function SessionWorkoutView({ session }: Props) {
  const { label } = useSessionDurationCountdown({
    startedAtIso: session.startedAt,
    plannedDurationMinutes: session.plannedDurationMinutes,
  });

  const sortedExercises = useMemo(
    () => [...session.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
    [session.exercises],
  );

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    () => sortedExercises[0]?.id ?? '',
  );
  const [sets, setSets] = useState<SetDto[]>(() => session.sets ?? []);
  const [loggerValues, setLoggerValues] = useState<SessionSetLoggerValues>(() =>
    loggerDefaultsForExercise(sortedExercises[0]),
  );
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [pendingSetId, setPendingSetId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SetSyncState>('saved');
  const [restEndsAtMs, setRestEndsAtMs] = useState<number | null>(null);
  const [catalogModifiers, setCatalogModifiers] = useState<SetModifierDto[]>([]);
  const [modifierSheetSetId, setModifierSheetSetId] = useState<string | null>(null);
  const [modifierBusy, setModifierBusy] = useState(false);
  const inFlightRef = useRef(false);

  const isActive = session.status === 'active';
  const selectedExercise = sortedExercises.find((e) => e.id === selectedExerciseId);

  useEffect(() => {
    setSets(session.sets ?? []);
  }, [session.id, session.sets]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    void listModifiers().then(({ data }) => {
      if (data) {
        setCatalogModifiers(data);
      }
    });
  }, [isActive, session.id]);

  useEffect(() => {
    if (editingSetId) {
      return;
    }
    setLoggerValues(loggerDefaultsForExercise(selectedExercise));
  }, [selectedExercise, editingSetId]);

  const orderedSets = useMemo(
    () => [...sets].sort((a, b) => a.sequenceIndex - b.sequenceIndex),
    [sets],
  );

  const persistSet = useCallback(
    async (reuseSetId?: string) => {
      if (inFlightRef.current || !isActive || !selectedExerciseId) {
        return;
      }

      const setId =
        reuseSetId ?? pendingSetId ?? editingSetId ?? crypto.randomUUID();

      if (!reuseSetId && !pendingSetId && !editingSetId) {
        setPendingSetId(setId);
      }

      inFlightRef.current = true;
      setSyncState('saving');

      const { data, error } = await upsertSessionSet(session.id, setId, {
        sessionExerciseId: selectedExerciseId,
        weightKg: loggerValues.weightKg,
        reps: loggerValues.reps,
        rpe: loggerValues.rpe,
      });

      inFlightRef.current = false;

      if (error || !data) {
        setPendingSetId(setId);
        setSyncState('retry');
        return;
      }

      setSets((prev) => {
        const without = prev.filter((s) => s.id !== data.id);
        return [...without, data].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      });
      setPendingSetId(null);
      setEditingSetId(null);
      setSyncState('saved');

      const currentIndex = findExerciseIndexById(sortedExercises, selectedExerciseId);
      const nextIndex = exerciseIndexAfterSetConfirm(sortedExercises, currentIndex);
      if (nextIndex !== currentIndex && sortedExercises[nextIndex]) {
        setSelectedExerciseId(sortedExercises[nextIndex].id);
        setLoggerValues(loggerDefaultsForExercise(sortedExercises[nextIndex]));
      } else {
        setLoggerValues(loggerDefaultsForExercise(selectedExercise));
      }

      if (shouldStartRestAfterSet(sortedExercises, currentIndex)) {
        setRestEndsAtMs(computeRestEndsAt(Date.now()));
      }
    },
    [
      editingSetId,
      isActive,
      loggerValues,
      pendingSetId,
      selectedExercise,
      selectedExerciseId,
      session.id,
      sortedExercises,
    ],
  );

  const handleSkipRest = () => {
    setRestEndsAtMs(null);
  };

  const handleExtendRest = () => {
    setRestEndsAtMs((prev) =>
      prev != null ? prev + REST_EXTEND_SECONDS * 1000 : null,
    );
  };

  const handleConfirm = () => {
    if (inFlightRef.current) {
      return;
    }
    void persistSet();
  };

  const handleRetrySync = () => {
    if (inFlightRef.current || !pendingSetId) {
      return;
    }
    void persistSet(pendingSetId);
  };

  const handleSelectSet = (set: SetDto) => {
    if (!isActive || inFlightRef.current) {
      return;
    }
    setSelectedExerciseId(set.sessionExerciseId);
    setEditingSetId(set.id);
    setPendingSetId(null);
    setSyncState('saved');
    setLoggerValues({
      weightKg: set.weightKg ?? 0,
      reps: set.reps ?? 0,
      rpe: set.rpe ?? 0,
    });
  };

  const applyModifierToSet = useCallback(
    async (setId: string, modifierId: string | null) => {
      const target = sets.find((s) => s.id === setId);
      if (!target || !isActive || inFlightRef.current) {
        return;
      }
      setModifierBusy(true);
      const { data, error } = await upsertSessionSet(session.id, setId, {
        sessionExerciseId: target.sessionExerciseId,
        weightKg: target.weightKg,
        reps: target.reps,
        rpe: target.rpe,
        modifierId,
      });
      setModifierBusy(false);
      if (error || !data) {
        setSyncState('retry');
        return;
      }
      setSets((prev) => {
        const without = prev.filter((s) => s.id !== data.id);
        return [...without, data].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
      });
      setModifierSheetSetId(null);
      setSyncState('saved');
    },
    [isActive, session.id, sets],
  );

  const handleCreateCustomModifier = useCallback(
    async (name: string, colorToken: string) => {
      setModifierBusy(true);
      const { data, error } = await createModifier({ name, colorToken });
      setModifierBusy(false);
      if (error || !data) {
        return;
      }
      setCatalogModifiers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      if (modifierSheetSetId) {
        await applyModifierToSet(modifierSheetSetId, data.id);
      }
    },
    [applyModifierToSet, modifierSheetSetId],
  );

  const handleDeleteSet = async (setId: string) => {
    if (!isActive || inFlightRef.current) {
      return;
    }
    const { error } = await deleteSessionSet(session.id, setId);
    if (error) {
      setSyncState('retry');
      return;
    }
    setSets((prev) => prev.filter((s) => s.id !== setId));
    if (editingSetId === setId) {
      setEditingSetId(null);
      setLoggerValues(loggerDefaultsForExercise(selectedExercise));
    }
    setSyncState('saved');
  };

  const syncLabel = setSyncIndicatorLabel(syncState);

  return (
    <div className="surface-session" data-testid="session-surface">
      <header className="surface-session__header">
        <h1>Сессия</h1>
        <div className="surface-session__header-meta">
          {syncState === 'retry' ? (
            <button
              type="button"
              className="surface-session__sync surface-session__sync--retry"
              data-testid="session-set-sync-indicator"
              onClick={handleRetrySync}
            >
              {syncLabel}
            </button>
          ) : (
            <span
              className="surface-session__sync"
              data-testid="session-set-sync-indicator"
              aria-live="polite"
            >
              {syncLabel}
            </span>
          )}
          <span className="surface-session__timer" aria-live="polite" data-testid="session-duration-timer">
            {label}
          </span>
        </div>
      </header>

      <ol>
        {sortedExercises.map((exercise) => {
          const isSelected = exercise.id === selectedExerciseId;
          return (
            <li key={exercise.id}>
              <button
                type="button"
                className={`surface-session__exercise-card${isSelected ? ' surface-session__exercise-card--selected' : ''}`}
                onClick={() => {
                  if (!isActive || inFlightRef.current) {
                    return;
                  }
                  setSelectedExerciseId(exercise.id);
                  setEditingSetId(null);
                  setPendingSetId(null);
                }}
              >
                <h2 className="surface-session__exercise-name">{exercise.nameSnapshot}</h2>
                <p className="surface-session__targets">{formatTargets(exercise)}</p>
              </button>
            </li>
          );
        })}
      </ol>

      {isActive && selectedExerciseId ? (
        <SessionSetLogger
          values={loggerValues}
          disabled={syncState === 'saving'}
          onChange={setLoggerValues}
          onConfirm={handleConfirm}
        />
      ) : null}

      {isActive && restEndsAtMs != null ? (
        <SessionRestTimer
          endsAtMs={restEndsAtMs}
          onSkip={handleSkipRest}
          onExtend={handleExtendRest}
        />
      ) : null}

      {isActive && modifierSheetSetId != null ? (
        <SetModifierSheet
          modifiers={catalogModifiers}
          busy={modifierBusy}
          onPick={(modifierId) => void applyModifierToSet(modifierSheetSetId, modifierId)}
          onCreateCustom={(name, colorToken) => void handleCreateCustomModifier(name, colorToken)}
          onDismiss={() => setModifierSheetSetId(null)}
        />
      ) : null}

      {orderedSets.length > 0 ? (
        <ul className="surface-session__set-tape" data-testid="session-set-tape">
          {orderedSets.map((set) => {
            const modifier = set.modifier ?? null;
            const modifierHex =
              modifier != null ? hexForSetModifierToken(modifier.colorToken) : undefined;
            const rowAriaLabel = modifier
              ? `${formatSetLine(set)}, модификатор ${modifier.name}`
              : formatSetLine(set);
            return (
              <li key={set.id}>
                <button
                  type="button"
                  className="surface-session__set-row"
                  data-testid={`session-set-row-${set.id}`}
                  aria-label={rowAriaLabel}
                  onClick={() => handleSelectSet(set)}
                >
                  {modifier ? (
                    <span
                      className="surface-session__set-modifier"
                      data-testid={`session-set-modifier-${set.id}`}
                    >
                      <span
                        className="surface-session__set-modifier-dot"
                        style={{ backgroundColor: modifierHex ?? 'transparent' }}
                        aria-hidden
                      />
                      <span className="surface-session__set-modifier-label">
                        {shortModifierLabel(modifier.name)}
                      </span>
                    </span>
                  ) : null}
                  {formatSetLine(set)}
                </button>
                {isActive ? (
                  <>
                    <button
                      type="button"
                      className="surface-session__set-modifier-open"
                      aria-label="Модификатор подхода"
                      data-testid={`session-set-modifier-open-${set.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setModifierSheetSetId(set.id);
                      }}
                    >
                      ◆
                    </button>
                    <button
                      type="button"
                      className="surface-session__set-delete"
                      aria-label="Удалить подход"
                      data-testid={`session-set-delete-${set.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteSet(set.id);
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
