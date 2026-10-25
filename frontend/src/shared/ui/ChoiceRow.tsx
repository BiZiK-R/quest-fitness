import { CheckIcon } from './icons';
import './ChoiceRow.css';

export type ChoiceRowProps = {
  title: string;
  /** radio — одна основная группа, checkbox — дополнительные. */
  kind: 'radio' | 'checkbox';
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

/** Строка выбора 56px: галочка справа у выбранной (DESIGN → ListRow + Choice). */
export function ChoiceRow({ title, kind, checked, disabled = false, onToggle }: ChoiceRowProps) {
  return (
    <li className="ui-list-row__item">
      <button
        type="button"
        role={kind}
        aria-checked={checked}
        disabled={disabled}
        className={[
          'ui-list-row',
          'ui-list-row--interactive',
          'ui-choice-row',
          checked ? 'ui-choice-row--checked' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onToggle}
      >
        <span className="ui-list-row__main">
          <span className="ui-list-row__title">{title}</span>
        </span>
        {checked ? (
          <span className="ui-list-row__trailing ui-choice-row__check" aria-hidden="true">
            <CheckIcon />
          </span>
        ) : (
          <span className="ui-choice-row__slot" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}
