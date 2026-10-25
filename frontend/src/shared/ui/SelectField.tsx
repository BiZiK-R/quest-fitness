import { Select } from 'antd';
import {
  Children,
  isValidElement,
  type ChangeEventHandler,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from 'react';
import './Field.css';

export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'onChange' | 'value' | 'size'
> & {
  id: string;
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  ref?: Ref<HTMLSelectElement>;
};

type OptionEl = ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;

/** Достаёт value/label из `<option>`-детей — совместимость со старым API. */
function optionsFromChildren(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }
    const option = child as OptionEl;
    const value = option.props.value != null ? String(option.props.value) : '';
    return [{ value, label: option.props.children }];
  });
}

/**
 * Селект на базе antd Select; onChange эмулирует native ChangeEvent,
 * чтобы страницы с `<option>` и e.target.value не переписывать.
 */
export function SelectField({
  id,
  label,
  hideLabel = false,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled,
  children,
  required,
}: SelectFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const fieldClass = ['ui-field', 'ui-field--select', error ? 'ui-field--invalid' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClass}>
      <label htmlFor={id} className={hideLabel ? 'ui-visually-hidden' : 'ui-field__label'}>
        {label}
      </label>
      <Select
        id={id}
        size="large"
        value={value === '' ? undefined : value}
        placeholder={placeholder}
        disabled={disabled}
        status={error ? 'error' : undefined}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className="ui-field__control ui-field__select"
        options={optionsFromChildren(children)}
        virtual={false}
        listHeight={320}
        onChange={(next) => {
          const synthetic = {
            target: { value: String(next ?? ''), id },
            currentTarget: { value: String(next ?? ''), id },
          } as unknown as Parameters<ChangeEventHandler<HTMLSelectElement>>[0];
          onChange(synthetic);
        }}
        getPopupContainer={() => document.body}
      />
      {error ? (
        <p id={`${id}-error`} className="ui-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="ui-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
