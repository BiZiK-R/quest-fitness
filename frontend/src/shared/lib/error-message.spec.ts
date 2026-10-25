import { describe, expect, it } from 'vitest';
import { errorMessageFor } from './error-message';

describe('errorMessageFor', () => {
  it('maps known API codes to human phrases', () => {
    expect(errorMessageFor('INVITE_EXPIRED')).toBe(
      'Ссылка истекла. Попросите тренера выслать новую.',
    );
    expect(errorMessageFor('CREATE_FAILED')).toBe('Не сохранилось.');
  });

  it('falls back to neutral phrase for unknown or empty code', () => {
    expect(errorMessageFor('SOMETHING_ELSE')).toBe('Что-то пошло не так. Попробуйте ещё раз.');
    expect(errorMessageFor(null)).toBe('Что-то пошло не так. Попробуйте ещё раз.');
  });
});
