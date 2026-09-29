import { useId, useState } from 'react';
import type { SetModifierDto } from '../api/modifiers-api';
import { SET_MODIFIER_PALETTE } from '../lib/set-modifier-palette';
import './SetModifierSheet.css';

type Props = {
  modifiers: SetModifierDto[];
  busy: boolean;
  onPick: (modifierId: string | null) => void;
  onCreateCustom: (name: string, colorToken: string) => void;
  onDismiss: () => void;
};

export function SetModifierSheet({
  modifiers,
  busy,
  onPick,
  onCreateCustom,
  onDismiss,
}: Props) {
  const titleId = useId();
  const nameInputId = useId();
  const [mode, setMode] = useState<'pick' | 'create'>('pick');
  const [customName, setCustomName] = useState('');
  const [selectedToken, setSelectedToken] = useState(SET_MODIFIER_PALETTE[0]?.id ?? 'mod-amber');

  return (
    <section
      className="set-modifier-sheet"
      role="region"
      aria-labelledby={titleId}
      data-testid="set-modifier-sheet"
    >
      <header className="set-modifier-sheet__header">
        <h3 id={titleId}>Модификатор подхода</h3>
        <button type="button" disabled={busy} onClick={onDismiss}>
          Закрыть
        </button>
      </header>

      {mode === 'pick' ? (
        <>
          <ul className="set-modifier-sheet__list">
            {modifiers.map((modifier) => {
              const hex = SET_MODIFIER_PALETTE.find((p) => p.id === modifier.colorToken)?.hex;
              return (
                <li key={modifier.id}>
                  <button
                    type="button"
                    className="set-modifier-sheet__pick"
                    disabled={busy}
                    data-testid={`set-modifier-pick-${modifier.id}`}
                    onClick={() => onPick(modifier.id)}
                  >
                    <span
                      className="set-modifier-sheet__dot"
                      style={{ backgroundColor: hex ?? 'transparent' }}
                      aria-hidden
                    />
                    {modifier.name}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="set-modifier-sheet__clear"
            disabled={busy}
            data-testid="set-modifier-clear"
            onClick={() => onPick(null)}
          >
            Без модификатора
          </button>
          <button
            type="button"
            disabled={busy}
            data-testid="set-modifier-create-mode"
            onClick={() => setMode('create')}
          >
            Создать свой
          </button>
        </>
      ) : (
        <div className="set-modifier-sheet__create">
          <label htmlFor={nameInputId}>Название</label>
          <input
            id={nameInputId}
            type="text"
            value={customName}
            disabled={busy}
            data-testid="set-modifier-custom-name"
            onChange={(e) => setCustomName(e.target.value)}
          />
          <p>Цвет</p>
          <div className="set-modifier-sheet__palette" role="list">
            {SET_MODIFIER_PALETTE.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="listitem"
                className={`set-modifier-sheet__swatch${selectedToken === entry.id ? ' set-modifier-sheet__swatch--selected' : ''}`}
                style={{ backgroundColor: entry.hex }}
                disabled={busy}
                aria-label={entry.id}
                aria-pressed={selectedToken === entry.id}
                data-testid={`set-modifier-swatch-${entry.id}`}
                onClick={() => setSelectedToken(entry.id)}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={busy || !customName.trim()}
            data-testid="set-modifier-create-submit"
            onClick={() => onCreateCustom(customName.trim(), selectedToken)}
          >
            Сохранить
          </button>
          <button type="button" disabled={busy} onClick={() => setMode('pick')}>
            Назад
          </button>
        </div>
      )}
    </section>
  );
}
