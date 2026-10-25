import { Spin } from 'antd';
import type { ReactNode } from 'react';
import { errorMessageFor } from '@/shared/lib/error-message';
import { Button } from './Button';
import './PageState.css';

export type PageStateProps =
  | { status: 'loading'; message?: string }
  | {
      status: 'error';
      errorCode?: string | null;
      message?: string;
      onRetry?: () => void;
    }
  | { status: 'notFound'; message?: string; action?: ReactNode };

/**
 * Состояние страницы: antd Spin на загрузке; ошибка/404 — спокойный текст без «нейро»-иллюстраций.
 */
export function PageState(props: PageStateProps) {
  if (props.status === 'loading') {
    return (
      <div className="ui-page-state ui-page-state--loading" role="status">
        <Spin size="large" />
        <p className="ui-page-state__text">{props.message ?? 'Загружаем…'}</p>
      </div>
    );
  }

  if (props.status === 'error') {
    const text = props.message ?? errorMessageFor(props.errorCode);
    return (
      <div className="ui-page-state ui-page-state--error">
        <p className="ui-page-state__text ui-page-state__text--primary" role="alert">
          {text}
        </p>
        {props.onRetry ? <Button onClick={props.onRetry}>Повторить</Button> : null}
      </div>
    );
  }

  return (
    <div className="ui-page-state ui-page-state--not-found">
      <p className="ui-page-state__text ui-page-state__text--primary">
        {props.message ?? errorMessageFor('NOT_FOUND')}
      </p>
      {props.action}
    </div>
  );
}
