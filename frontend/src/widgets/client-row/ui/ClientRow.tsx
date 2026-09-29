import { useNavigate } from 'react-router-dom';
import { LockBadge } from './LockBadge';

export type ClientRowProps = {
  id: string;
  displayName: string;
  lockHolderLabel?: string | null;
  nextWorkoutMeta?: string | null;
};

export function ClientRow({
  id,
  displayName,
  lockHolderLabel,
  nextWorkoutMeta,
}: ClientRowProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="client-row"
      aria-label={displayName}
      onClick={() => navigate(`/clients/${id}`)}
    >
      <span className="client-row__name">{displayName}</span>
      {nextWorkoutMeta ? (
        <span className="client-row__workout-meta">{nextWorkoutMeta}</span>
      ) : null}
      {lockHolderLabel ? <LockBadge holderLabel={lockHolderLabel} /> : null}
    </button>
  );
}
