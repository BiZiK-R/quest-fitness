import type { components } from '@/shared/api/schema';
import { useSessionDurationCountdown } from '../lib/use-session-duration-countdown';
import './SessionWorkoutView.css';

type SessionDto = components['schemas']['SessionDto'];
type SessionExercise = components['schemas']['SessionExerciseDto'];

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

export function SessionWorkoutView({ session }: Props) {
  const { label } = useSessionDurationCountdown({
    startedAtIso: session.startedAt,
    plannedDurationMinutes: session.plannedDurationMinutes,
  });

  const sortedExercises = [...session.exercises].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="surface-session" data-testid="session-surface">
      <header className="surface-session__header">
        <h1>Сессия</h1>
        <span className="surface-session__timer" aria-live="polite" data-testid="session-duration-timer">
          {label}
        </span>
      </header>

      <ol>
        {sortedExercises.map((exercise) => (
          <li key={exercise.id} className="surface-session__exercise-card">
            <h2 className="surface-session__exercise-name">{exercise.nameSnapshot}</h2>
            <p className="surface-session__targets">{formatTargets(exercise)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
