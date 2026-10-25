import { useNavigate } from 'react-router-dom';
import { LockBadge } from '@/shared/ui/LockBadge';
import './ClientRow.css';

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
  const hasRightColumn = Boolean(nextWorkoutMeta || lockHolderLabel);

  return (
    <button
      type="button"
      className="client-row"
      aria-label={displayName}
      onClick={() => navigate(`/clients/${id}`)}
    >
      <span className="client-row__name">{displayName}</span>
      {hasRightColumn ? (
        <span className="client-row__right">
          {lockHolderLabel ? <LockBadge holderName={lockHolderLabel} /> : null}
          {nextWorkoutMeta ? (
            <span className="client-row__workout-meta">{nextWorkoutMeta}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
