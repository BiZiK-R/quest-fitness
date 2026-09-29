import { useNavigate } from 'react-router-dom';
import { LockBadge } from './LockBadge';

export type ClientRowProps = {
  id: string;
  displayName: string;
  lockHolderLabel?: string | null;
};

export function ClientRow({
  id,
  displayName,
  lockHolderLabel,
}: ClientRowProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="client-row"
      onClick={() => navigate(`/clients/${id}`)}
    >
      <span className="client-row__name">{displayName}</span>
      {lockHolderLabel ? <LockBadge holderLabel={lockHolderLabel} /> : null}
    </button>
  );
}
