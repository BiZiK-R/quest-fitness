import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AntdProvider } from '@/shared/ui/AntdProvider';

/** Рендер с ConfigProvider темы Гильдии — для page/unit-тестов с antd. */
export function renderWithAntd(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => <AntdProvider>{children}</AntdProvider>,
  });
}
