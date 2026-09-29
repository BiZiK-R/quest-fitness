import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';

export type TrainerMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  showAdminTrainersLink?: boolean;
};

export function TrainerMenuSheet({
  open,
  onClose,
  showAdminTrainersLink = false,
}: TrainerMenuSheetProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="trainer-menu-sheet__backdrop" onClick={onClose}>
      <div
        className="trainer-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>Меню тренера</h2>
        {showAdminTrainersLink ? (
          <p>
            <Link to="/admin/trainers" onClick={onClose}>
              Тренеры
            </Link>
          </p>
        ) : null}
        <ul>
          <li>
            <Link to="/catalog" onClick={onClose}>
              Каталог
            </Link>
          </li>
          <li>
            <Link to="/templates" onClick={onClose}>
              Шаблоны
            </Link>
          </li>
          <li>
            <Link to="/macrocycles" onClick={onClose}>
              Макроциклы
            </Link>
          </li>
        </ul>
        <button ref={closeButtonRef} type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
