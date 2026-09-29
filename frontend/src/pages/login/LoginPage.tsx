import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCsrfToken } from '@/shared/api/client';
import { postTrainerLogin } from '@/shared/api/login';
import type { components } from '@/shared/api/schema';

type ErrorCode = components['schemas']['ErrorCode'];

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
};

export function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorCode(null);
    setSubmitting(true);

    const result = await postTrainerLogin({ login, password });

    setSubmitting(false);

    if (!result.ok) {
      const code = result.error.error?.code;
      setErrorCode(code ? (ERROR_MESSAGES[code] ?? code) : 'UNKNOWN_ERROR');
      return;
    }

    setCsrfToken(result.data.csrfToken);
    navigate('/pool', { replace: true });
  }

  return (
    <main>
      <h1>Вход</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
        </div>
        {errorCode ? (
          <p role="alert">{errorCode}</p>
        ) : null}
        <button type="submit" disabled={submitting}>
          Войти
        </button>
      </form>
    </main>
  );
}
