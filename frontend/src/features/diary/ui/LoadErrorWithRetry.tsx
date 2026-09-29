type LoadErrorWithRetryProps = {
  message: string;
  onRetry: () => void;
};

/** Inline load error with retry — no toasts (Story 5.6). */
export function LoadErrorWithRetry({ message, onRetry }: LoadErrorWithRetryProps) {
  return (
    <div>
      <p role="alert">{message}</p>
      <button type="button" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
