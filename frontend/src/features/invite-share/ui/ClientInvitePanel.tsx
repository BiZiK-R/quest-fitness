import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard';
import type { components } from '@/shared/api/schema';

type IssueInviteResponse = components['schemas']['IssueInviteResponseDto'];

type ClientInvitePanelProps = {
  clientId: string;
  clientDisplayName: string;
  onClose: () => void;
};

function buildFullInviteUrl(invitePath: string): string {
  return `${window.location.origin}${invitePath}`;
}

export function ClientInvitePanel({
  clientId,
  clientDisplayName,
  onClose,
}: ClientInvitePanelProps) {
  const [issue, setIssue] = useState<IssueInviteResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const issueInvite = useCallback(async () => {
    setLoadError(null);
    setCopied(false);
    setIsLoading(true);
    const { data, error } = await apiClient.POST('/api/clients/{clientId}/invites', {
      params: { path: { clientId } },
    });
    setIsLoading(false);

    if (error) {
      setIssue(null);
      setLoadError(error.error?.code ?? 'INVITE_FAILED');
      return;
    }

    if (data) {
      setIssue(data);
    }
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
    <div aria-label={`Приглашение для ${clientDisplayName}`}>
      {isLoading ? <p>Готовим ссылку…</p> : null}
      {loadError ? <p role="alert">{loadError}</p> : null}

      {issue ? (
        <>
          <p>
            <a href={fullUrl}>{fullUrl}</a>
          </p>
          <p>ссылка живёт 1 сутки</p>
          <p>{issue.expiresAtLabel}</p>
          <button type="button" onClick={() => void handleCopy()}>
            Копировать
          </button>
          {copied ? <span>Скопировано</span> : null}
          <button type="button" disabled={isLoading} onClick={() => void issueInvite()}>
            Перевыпустить
          </button>
        </>
      ) : null}

      <button type="button" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
