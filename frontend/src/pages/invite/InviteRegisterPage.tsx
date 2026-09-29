import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { setCsrfToken } from '@/shared/api/client';
import { postInviteRegister } from '@/shared/api/invite-register';
import type { components } from '@/shared/api/schema';
import { PageMeta } from '@/shared/ui/PageMeta';

type ErrorCode = components['schemas']['ErrorCode'];

const INVITE_LINK_MESSAGE =
  'Ссылка истекла. Попросите тренера выслать новую.';

const FIELD_LABELS: Record<string, string> = {
  name: 'Имя',
  phone: 'Телефон',
  login: 'Логин',
  password: 'Пароль',
};

function isInviteLinkError(code: ErrorCode | undefined): boolean {
  return code === 'INVITE_EXPIRED' || code === 'INVITE_ALREADY_CONSUMED';
}

export function InviteRegisterPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [inviteLinkError, setInviteLinkError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteLinkError(false);
    setFieldErrors({});
    setSubmitting(true);

    const result = await postInviteRegister(token, {
      name,
      phone,
      login,
      password,
    });

    setSubmitting(false);

    if (!result.ok) {
      const code = result.error.error?.code;
      if (isInviteLinkError(code)) {
        setInviteLinkError(true);
        return;
      }
      const details = result.error.error?.details;
      if (
        code === 'VALIDATION_FAILED' &&
        details &&
        typeof details === 'object' &&
        !Array.isArray(details)
      ) {
        setFieldErrors(details as Record<string, string[]>);
        return;
      }
      setFieldErrors({
        _form: [code ?? 'UNKNOWN_ERROR'],
      });
      return;
    }

    setCsrfToken(result.data.csrfToken);
    navigate('/cabinet/workouts', { replace: true });
  }

  return (
    <>
      <PageMeta title="Регистрация — Quest Fitness" robots="noindex,nofollow" />
      <h1>Регистрация по приглашению</h1>
      {inviteLinkError ? (
        <p role="alert">{INVITE_LINK_MESSAGE}</p>
      ) : null}
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label htmlFor="name">{FIELD_LABELS.name}</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.name?.length ? (
            <p role="alert">{fieldErrors.name.join('; ')}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone">{FIELD_LABELS.phone}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.phone?.length ? (
            <p role="alert">{fieldErrors.phone.join('; ')}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="login">{FIELD_LABELS.login}</label>
          <input
            id="login"
            name="login"
            type="text"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.login?.length ? (
            <p role="alert">{fieldErrors.login.join('; ')}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="password">{FIELD_LABELS.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
          {fieldErrors.password?.length ? (
            <p role="alert">{fieldErrors.password.join('; ')}</p>
          ) : null}
        </div>
        {fieldErrors._form?.length ? (
          <p role="alert">{fieldErrors._form.join('; ')}</p>
        ) : null}
        <button type="submit" disabled={submitting || inviteLinkError}>
          Зарегистрироваться
        </button>
      </form>
    </>
  );
}
