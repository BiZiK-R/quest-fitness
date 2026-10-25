import { Segmented } from 'antd';
import type { ReactNode } from 'react';
import './Field.css';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  label: string;
  hideLabel?: boolean;
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
};

/**
 * Выбор из короткого набора на базе antd Segmented.
 * Без красного — красный только у CTA.
 */
export function SegmentedControl<T extends string>({
  label,
  hideLabel = false,
  value,
  options,
  onChange,
  disabled = false,
  id,
}: SegmentedControlProps<T>): ReactNode {
  const groupId = id ?? `segmented-${label}`;

  return (
    <div className="ui-field ui-field--segmented" role="group" aria-labelledby={`${groupId}-label`}>
      <span
        id={`${groupId}-label`}
        className={hideLabel ? 'ui-visually-hidden' : 'ui-field__label'}
      >
        {label}
      </span>
      <Segmented
        block
        disabled={disabled}
        value={value}
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        onChange={(next) => onChange(next as T)}
      />
    </div>
  );
}
