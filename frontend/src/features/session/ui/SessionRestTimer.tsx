import { useEffect, useMemo, useState } from 'react';
import { useInterval } from '@/shared/lib/use-interval';
import {
  formatRestCountdown,
  remainingMsUntilEndsAt,
  REST_EXTEND_SECONDS,
} from '../lib/rest-after-set';
import './SessionRestTimer.css';

const TICK_MS = 1000;

type Props = {
  endsAtMs: number;
  onSkip: () => void;
  onExtend: () => void;
};

function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPrefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Inline rest countdown (does not overlay set logger — UX-DR13).
 */
export function SessionRestTimer({ endsAtMs, onSkip, onExtend }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [vibrated, setVibrated] = useState(false);

  useInterval(() => {
    setNowMs(Date.now());
  }, TICK_MS);

  const remainingMs = useMemo(
    () => remainingMsUntilEndsAt(endsAtMs, nowMs),
    [endsAtMs, nowMs],
  );

  useEffect(() => {
    if (remainingMs > 0) {
      setFinished(false);
      setVibrated(false);
      return;
    }
    setFinished(true);
    if (!vibrated && typeof navigator.vibrate === 'function') {
      navigator.vibrate(80);
      setVibrated(true);
    }
  }, [remainingMs, vibrated]);

  const label = finished ? 'Отдых закончен' : formatRestCountdown(remainingMs);

  return (
    <section
      className={`session-rest-timer${prefersReducedMotion ? ' session-rest-timer--reduced-motion' : ''}`}
      data-testid="session-rest-timer"
      aria-live="polite"
    >
      <p className="session-rest-timer__label" data-testid="session-rest-timer-label">
        {label}
      </p>
      {!finished ? (
        <div className="session-rest-timer__actions">
          <button
            type="button"
            className="session-rest-timer__btn"
            data-testid="session-rest-skip"
            onClick={onSkip}
          >
            Пропустить
          </button>
          <button
            type="button"
            className="session-rest-timer__btn"
            data-testid="session-rest-extend"
            onClick={onExtend}
          >
            +{REST_EXTEND_SECONDS} с
          </button>
        </div>
      ) : null}
    </section>
  );
}
