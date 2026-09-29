import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolvePostLoginPath } from '@/shared/auth/resolvePostLoginPath';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { postLogin } from '@/shared/api/login';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

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

    const result = await postLogin({ login, password });

    if (!result.ok) {
      setSubmitting(false);
      const code = result.error.error?.code;
      setErrorCode(code ? (ERROR_MESSAGES[code] ?? code) : 'UNKNOWN_ERROR');
      return;
    }

    setCsrfToken(result.data.csrfToken);

    const meResult = await apiClient.GET('/api/auth/me');
    setSubmitting(false);

    if (!meResult.data) {
      setErrorCode('UNAUTHENTICATED');
      return;
    }

    navigate(resolvePostLoginPath(meResult.data.role), { replace: true });
  }

  return (
    <>
      <PageMeta title="Вход — Quest Fitness" robots="noindex,nofollow" />
      <h1>Вход</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label htmlFor="login">Логин или телефон</label>
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
        <p>
          Забыли пароль? <span>Обратитесь к тренеру</span>
        </p>
        {errorCode ? (
          <p role="alert">{errorCode}</p>
        ) : null}
        <button type="submit" disabled={submitting}>
          Войти
        </button>
      </form>
    </>
  );
}
