import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageMeta } from './PageMeta';

describe('PageMeta', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('meta[name="robots"]').forEach((node) => node.remove());
  });

  it('sets robots noindex,nofollow on protected pages', async () => {
    render(<PageMeta robots="noindex,nofollow" title="Test" />);

    await waitFor(() => {
      const meta = document.querySelector('meta[name="robots"]');
      expect(meta).not.toBeNull();
      expect(meta?.getAttribute('content')).toBe('noindex,nofollow');
    });
  });
});
