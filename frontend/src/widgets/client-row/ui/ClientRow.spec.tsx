import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientRow } from './ClientRow';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('ClientRow', () => {
  afterEach(() => {
    cleanup();
    navigateMock.mockReset();
  });

  it('navigates to client card when row is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ClientRow id="cl_1" displayName="Иван" />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Иван' }));

    expect(navigateMock).toHaveBeenCalledWith('/clients/cl_1');
  });
});
