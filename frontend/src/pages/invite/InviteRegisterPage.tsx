import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PasswordField } from '@/features/password-field/ui/PasswordField';
import { setCsrfToken } from '@/shared/api/client';
import { postInviteRegister } from '@/shared/api/invite-register';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { AppShell } from '@/shared/ui/AppShell';
import { BottomCta } from '@/shared/ui/BottomCta';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageMeta } from '@/shared/ui/PageMeta';
import { TextField } from '@/shared/ui/TextField';
import './InviteRegisterPage.css';

type ErrorCode = components['schemas']['ErrorCode'];
type InviteLinkErrorCode = Extract<ErrorCode, 'INVITE_EXPIRED' | 'INVITE_ALREADY_CONSUMED'>;

const REGISTER_FORM_ID = 'invite-register-form';

function isInviteLinkError(code: ErrorCode | undefined): code is InviteLinkErrorCode {
  return code === 'INVITE_EXPIRED' || code === 'INVITE_ALREADY_CONSUMED';
}

function fieldError(errors: Record<string, string[]>, field: string): string | null {
  const messages = errors[field];
  return messages?.length ? messages.join('; ') : null;
}

export function InviteRegisterPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [inviteLinkError, setInviteLinkError] = useState<InviteLinkErrorCode | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    const result = await postInviteRegister(token, { name, phone, login, password });

    setSubmitting(false);

    if (result.ok) {
      setCsrfToken(result.data.csrfToken);
      navigate('/cabinet/workouts', { replace: true });
      return;
    }

    const code = result.error.error?.code;
    if (isInviteLinkError(code)) {
      setInviteLinkError(code);
      return;
    }
    const details = result.error.error?.details;
    if (code === 'VALIDATION_FAILED' && details && typeof details === 'object' && !Array.isArray(details)) {
      setFieldErrors(details as Record<string, string[]>);
      return;
    }
    setFieldErrors({ _form: [errorMessageFor(code)] });
  }

  if (inviteLinkError) {
    return (
      <AppShell>
        <PageMeta title="Регистрация — Quest Fitness" robots="noindex,nofollow" />
        <div className="invite-register">
          <EmptyState
            headingLevel={1}
            title="Ссылка не сработала"
            description={<span role="alert">{errorMessageFor(inviteLinkError)}</span>}
            action={
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {inviteLinkError === 'INVITE_ALREADY_CONSUMED' ? 'Войти' : 'На вход'}
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const formError = fieldError(fieldErrors, '_form');

  return (
    <AppShell
      bottom={
        <BottomCta
          primary={
            <Button
              type="submit"
              form={REGISTER_FORM_ID}
              variant="primary"
              fullWidth
              loading={submitting}
            >
              Зарегистрироваться
            </Button>
          }
        />
      }
    >
      <PageMeta title="Регистрация — Quest Fitness" robots="noindex,nofollow" />
      <div className="invite-register">
        <EmptyState
          headingLevel={1}
          title="Добро пожаловать в Гильдию"
          description="Заполните анкету — и тренер увидит вас в зале."
        />

        <form
          id={REGISTER_FORM_ID}
          className="invite-register__form"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          <TextField
            id="name"
            name="name"
            label="Имя"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={submitting}
            error={fieldError(fieldErrors, 'name')}
          />
          <TextField
            id="phone"
            name="phone"
            label="Телефон"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={submitting}
            error={fieldError(fieldErrors, 'phone')}
          />
          <TextField
            id="login"
            name="login"
            label="Логин"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={submitting}
            hint="Латиница, цифры, «_» и «-», от 3 до 32 символов"
            error={fieldError(fieldErrors, 'login')}
          />
          <PasswordField
            id="password"
            name="password"
            label="Пароль"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            hint="Не короче 8 символов"
            error={fieldError(fieldErrors, 'password')}
          />

          {formError ? (
            <p className="type-meta invite-register__error" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      </div>
    </AppShell>
  );
}
