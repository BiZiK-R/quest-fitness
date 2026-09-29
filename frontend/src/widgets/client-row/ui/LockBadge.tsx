export type LockBadgeProps = {
  holderLabel: string;
};

/**
 * Decorative lock indicator in pool rows (non-interactive until Story 2.5).
 */
export function LockBadge({ holderLabel }: LockBadgeProps) {
  return (
    <span className="lock-badge" aria-hidden="true">
      {holderLabel}
    </span>
  );
}
