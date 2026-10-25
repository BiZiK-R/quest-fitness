import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ReactNode } from 'react';
import { guildTheme } from './theme/guild-theme';

export type AntdProviderProps = {
  children: ReactNode;
};

/**
 * Корневой провайдер Ant Design: тема «Гильдия», ru_RU, без wave (нажатие = цвет).
 */
export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={guildTheme}
      wave={{ disabled: true }}
      componentSize="middle"
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
