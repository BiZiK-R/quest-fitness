import type { ReactNode } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import './ConfirmDialog.css';

export type ConfirmDialogProps = {
  open: boolean;
  /** Вопрос по делу: «Отменить тренировку?», «Освободить клиента?». */
  title: string;
  /** Последствие действия: «Стрик сбросится…». */
  body?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  /** Esc, фон и крестик = отмена. */
  onCancel: () => void;
  /** danger — для «Отменить» / «Освободить»; primary — остальное. */
  confirmVariant?: 'primary' | 'danger';
  /** Альтернатива вместо простого «Закрыть», например «Перенести». */
  alternativeLabel?: string;
  onAlternative?: () => void;
  /** Подпись второй кнопки, если альтернативы нет. */
  cancelLabel?: string;
  busy?: boolean;
};

/**
 * Подтверждение поверх BottomSheet (DESIGN → confirm-dialog).
 * Раскладка: confirm сверху, secondary (альтернатива или «Закрыть») под ним.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  alternativeLabel,
  onAlternative,
  cancelLabel = 'Закрыть',
  busy = false,
}: ConfirmDialogProps) {
  const hasAlternative = Boolean(alternativeLabel && onAlternative);

  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      className="ui-confirm"
      footer={
        <>
          <Button
            variant={confirmVariant}
            size="lg"
            fullWidth
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={hasAlternative ? onAlternative : onCancel}
          >
            {hasAlternative ? alternativeLabel : cancelLabel}
          </Button>
        </>
      }
    >
      {body ? <div className="ui-confirm__body">{body}</div> : null}
    </BottomSheet>
  );
}
