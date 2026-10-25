import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordField } from '@/features/password-field/ui/PasswordField';
import { resolvePostLoginPath } from '@/shared/auth/resolvePostLoginPath';
import { apiClient, setCsrfToken } from '@/shared/api/client';
import { postLogin } from '@/shared/api/login';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { GuildMark } from '@/shared/ui/GuildMark';
import { PageMeta } from '@/shared/ui/PageMeta';
import { TextField } from '@/shared/ui/TextField';
import './LoginPage.css';

const LOGIN_FORM_ID = 'login-form';

/** На входе UNAUTHENTICATED — это «неверная пара», а не «сессия истекла». */
function loginErrorMessage(code: string | null | undefined): string {
  if (code === 'UNAUTHENTICATED') {
    return 'Не подошли логин или пароль.';
  }
  return errorMessageFor(code);
}

export function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText(null);
    setSubmitting(true);

    const result = await postLogin({ login, password });

    if (!result.ok) {
      setSubmitting(false);
      setErrorText(loginErrorMessage(result.error.error?.code));
      return;
    }

    setCsrfToken(result.data.csrfToken);

    const meResult = await apiClient.GET('/api/auth/me');
    setSubmitting(false);

    if (!meResult.data) {
      setErrorText(loginErrorMessage('UNAUTHENTICATED'));
      return;
    }

    navigate(resolvePostLoginPath(meResult.data.role), { replace: true });
  }

  return (
    <AppShell
      leading={
        <span className="login-page__mark-appbar" aria-hidden="true">
          <GuildMark size={28} />
        </span>
      }
      title="Вход в зал"
      bottom={
        <BottomCta
          primary={
            <Button
              type="submit"
              form={LOGIN_FORM_ID}
              variant="primary"
              fullWidth
              loading={submitting}
            >
              Войти
            </Button>
          }
        />
      }
    >
      <PageMeta title="Вход — Quest Fitness" robots="noindex,nofollow" />
      <section className="login-page" aria-label="Форма входа">
        <header className="login-page__intro">
          <p className="login-page__brand type-display">Quest Fitness</p>
          <p className="type-body type-muted">
            Логин и пароль, как выдали в зале. Одна форма — тренер, админ и клиент.
          </p>
        </header>

        <form
          id={LOGIN_FORM_ID}
          className="login-page__form"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          <TextField
            id="login"
            name="login"
            label="Логин или телефон"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={submitting}
          />
          <PasswordField
            id="password"
            name="password"
            label="Пароль"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />

          {errorText ? (
            <p className="type-meta login-page__error" role="alert">
              {errorText}
            </p>
          ) : null}
        </form>

        <p className="type-meta type-muted login-page__recovery">
          Забыли пароль — напишите тренеру, сброс только через него.
        </p>
      </section>
    </AppShell>
  );
}
