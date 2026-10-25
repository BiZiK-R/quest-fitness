import { useState, type FormEvent } from 'react';
import { ClientInvitePanel } from '@/features/invite-share/ui/ClientInvitePanel';
import { apiClient } from '@/shared/api/client';
import type { components } from '@/shared/api/schema';
import { errorMessageFor } from '@/shared/lib/error-message';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

type ClientProfile = components['schemas']['ClientProfileDto'];

type CreateClientSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Клиент создан — Пул перезагружает список. */
  onCreated: () => void;
};

const CREATE_FORM_ID = 'pool-create-client-form';

/**
 * Поток 1 / IA «Создание Клиента»: шторка «Новый клиент» → после «Добавить в пул»
 * та же шторка переключается на «Ссылку-приглашение» для созданного Клиента.
 */
export function CreateClientSheet({ open, onClose, onCreated }: CreateClientSheetProps) {
  const [displayName, setDisplayName] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdClient, setCreatedClient] = useState<ClientProfile | null>(null);

  function handleClose() {
    setDisplayName('');
    setErrorText(null);
    setCreatedClient(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setErrorText('Впишите имя клиента.');
      return;
    }

    setErrorText(null);
    setSubmitting(true);
    const { data, error } = await apiClient.POST('/api/clients', {
      body: { displayName: trimmed },
    });
    setSubmitting(false);

    if (error || !data) {
      setErrorText(errorMessageFor(error?.error?.code ?? 'CREATE_FAILED'));
      return;
    }

    setCreatedClient(data);
    onCreated();
  }

  // Одна шторка на оба шага: фокус при закрытии вернётся на «Добавить клиента».
  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={createdClient ? 'Ссылка-приглашение' : 'Новый клиент'}
      footer={
        createdClient ? undefined : (
          <Button
            type="submit"
            form={CREATE_FORM_ID}
            variant="primary"
            fullWidth
            loading={submitting}
          >
            Добавить в пул
          </Button>
        )
      }
    >
      {createdClient ? (
        <ClientInvitePanel
          clientId={createdClient.id}
          clientDisplayName={createdClient.displayName}
          onDone={handleClose}
        />
      ) : (
        <form id={CREATE_FORM_ID} noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextField
          id="pool-display-name"
          name="displayName"
          label="Имя клиента"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={128}
          autoComplete="off"
          hint="Как клиента зовут в зале. Анкету он заполнит сам по ссылке."
          error={errorText}
          />
        </form>
      )}
    </BottomSheet>
  );
}
