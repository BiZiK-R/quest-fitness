import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders monochrome guild mark in header', () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole('img', { name: /знак гильдии/i })).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
