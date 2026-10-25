import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard';
import { errorMessageFor } from '@/shared/lib/error-message';
import type { components } from '@/shared/api/schema';
import { Button } from '@/shared/ui/Button';
import { CopyIcon } from '@/shared/ui/icons';
import './ClientInvitePanel.css';

type IssueInviteResponse = components['schemas']['IssueInviteResponseDto'];

type ClientInvitePanelProps = {
  clientId: string;
  clientDisplayName: string;
  /** «Готово» — закрыть шторку приглашения. */
  onDone: () => void;
};

function buildFullInviteUrl(invitePath: string): string {
  return `${window.location.origin}${invitePath}`;
}

/**
 * Содержимое шторки «Ссылка-приглашение» (EXPERIENCE → invite-share): выпуск при открытии,
 * копирование одним касанием с текстовым «Скопировано», TTL и перевыпуск (старая ссылка гаснет).
 */
export function ClientInvitePanel({ clientId, clientDisplayName, onDone }: ClientInvitePanelProps) {
  const [issue, setIssue] = useState<IssueInviteResponse | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const issueInvite = useCallback(async () => {
    setErrorCode(null);
    setCopied(false);
    setIsLoading(true);
    const { data, error } = await apiClient.POST('/api/clients/{clientId}/invites', {
      params: { path: { clientId } },
    });
    setIsLoading(false);

    if (error || !data) {
      setIssue(null);
      setErrorCode(error?.error?.code ?? null);
      return;
    }
    setIssue(data);
  }, [clientId]);

  useEffect(() => {
    void issueInvite();
  }, [issueInvite]);

  const fullUrl = issue ? buildFullInviteUrl(issue.inviteUrl) : '';

  async function handleCopy() {
    if (!fullUrl) {
      return;
    }
    await copyToClipboard(fullUrl);
    setCopied(true);
  }

  return (
    <div className="invite-share">
      <section className="invite-share__panel" aria-label={`Приглашение для ${clientDisplayName}`}>
        <p className="type-body">
          Отправьте ссылку <b>{clientDisplayName}</b> — по ней откроется анкета.
        </p>

        {isLoading ? (
          <p className="type-meta type-muted" role="status">
            Готовим ссылку…
          </p>
        ) : null}

        {errorCode !== null || (!isLoading && !issue) ? (
          <div className="invite-share__error-block">
            <p className="type-meta invite-share__error" role="alert">
              {errorMessageFor(errorCode)}
            </p>
            <Button onClick={() => void issueInvite()}>Повторить</Button>
          </div>
        ) : null}

        {issue ? (
          <>
            <p className="invite-share__url">{fullUrl}</p>
            <Button fullWidth onClick={() => void handleCopy()}>
              <CopyIcon />
              Копировать ссылку
            </Button>
            <p className="type-meta invite-share__copied" aria-live="polite">
              {copied ? 'Скопировано' : ''}
            </p>
            <p className="type-meta type-muted">
              Ссылка живёт 1 сутки · {issue.expiresAtLabel}
            </p>
            <Button
              variant="ghost"
              className="invite-share__reissue"
              disabled={isLoading}
              onClick={() => void issueInvite()}
            >
              Выпустить новую ссылку
            </Button>
          </>
        ) : null}
      </section>

      <Button fullWidth onClick={onDone}>
        Готово
      </Button>
    </div>
  );
}
