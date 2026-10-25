import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MacrocyclesPage } from './MacrocyclesPage';
import * as clientModule from '@/shared/api/client';

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      GET: vi.fn(),
      POST: vi.fn(),
      PATCH: vi.fn(),
    },
  };
});

describe('MacrocyclesPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(clientModule.apiClient.GET).mockReset();
    vi.mocked(clientModule.apiClient.POST).mockReset();
    vi.mocked(clientModule.apiClient.PATCH).mockReset();

    vi.mocked(clientModule.apiClient.GET).mockImplementation(async (path) => {
      if (path === '/api/macrocycles') {
        return {
          data: {
            macrocycles: [
              {
                id: 'macro1',
                name: 'Силовой сезон',
                periodicityNote: '4 недели',
                stages: [
                  {
                    id: 'st1',
                    templateId: 'tpl1',
                    templateName: 'Силовая',
                    sortOrder: 0,
                  },
                ],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      if (path === '/api/templates') {
        return {
          data: {
            templates: [
              {
                id: 'tpl1',
                name: 'Силовая',
                type: 'strength',
                description: null,
                durationMinutes: null,
                microcycleWeeks: null,
                version: 1,
                archivedAt: null,
                exercises: [],
              },
            ],
          },
          error: undefined,
          response: new Response(null, { status: 200 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });
  });

  it('loads macrocycles list', async () => {
    render(
      <MemoryRouter>
        <MacrocyclesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Силовой сезон')).toBeInTheDocument();
    });
    expect(clientModule.apiClient.GET).toHaveBeenCalledWith('/api/macrocycles');
  });

  it('creates macrocycle via POST /api/macrocycles', async () => {
    vi.mocked(clientModule.apiClient.POST).mockImplementation(async (path) => {
      if (path === '/api/macrocycles') {
        return {
          data: {
            id: 'macro_new',
            name: 'Новый макро',
            periodicityNote: null,
            stages: [],
          },
          error: undefined,
          response: new Response(null, { status: 201 }),
        };
      }
      return { data: undefined, error: undefined, response: new Response(null, { status: 404 }) };
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MacrocyclesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Новый макроцикл' }));
    const nameInput = screen.getByLabelText('Название');
    await user.clear(nameInput);
    await user.type(nameInput, 'Новый макро');
    await user.click(screen.getByRole('combobox', { name: /Этап 1/ }));
    await user.click(await screen.findByTitle('Силовая'));
    await user.click(screen.getByRole('button', { name: 'Создать макроцикл' }));

    await waitFor(() => {
      expect(clientModule.apiClient.POST).toHaveBeenCalledWith('/api/macrocycles', {
        body: expect.objectContaining({
          name: 'Новый макро',
          stages: [expect.objectContaining({ templateId: 'tpl1', sortOrder: 0 })],
        }),
      });
    });
  });
});
