import { useMemo, useState } from 'react';
import { useInterval } from '@/shared/lib/use-interval';
import {
  computeSessionEndsAt,
  remainingMsUntilEndsAt,
} from './compute-session-ends-at';
import { formatSessionCountdown } from './format-session-countdown';

const TICK_MS = 1000;

type Args = {
  startedAtIso: string;
  plannedDurationMinutes: number;
};

/**
 * Countdown anchored to absolute endsAt derived once from startedAt + duration (AD-8).
 */
export function useSessionDurationCountdown({ startedAtIso, plannedDurationMinutes }: Args) {
  const endsAtMs = useMemo(
    () => computeSessionEndsAt(startedAtIso, plannedDurationMinutes),
    [startedAtIso, plannedDurationMinutes],
  );

  const [nowMs, setNowMs] = useState(() => Date.now());

  useInterval(() => {
    setNowMs(Date.now());
  }, TICK_MS);

  const remainingMs = remainingMsUntilEndsAt(endsAtMs, nowMs);
  const label = formatSessionCountdown(remainingMs);

  return { endsAtMs, remainingMs, label };
}
