import * as argon2 from 'argon2';

/** Единые параметры argon2id для хешей паролей в BFF. */
export const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
};
