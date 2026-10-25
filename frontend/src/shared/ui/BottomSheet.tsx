import { Drawer } from 'antd';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';
import './BottomSheet.css';

export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  surface?: 'light' | 'session';
  role?: 'dialog' | 'alertdialog';
  showClose?: boolean;
  className?: string;
};

/**
 * Шторка снизу на базе antd Drawer (placement=bottom).
 * Фокус на заголовок при открытии; Esc/фон закрывают; колонка ≤ 640px.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  hideTitle = false,
  children,
  footer,
  surface = 'light',
  role = 'dialog',
  showClose = true,
  className,
}: BottomSheetProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rootClass = [
    'ui-sheet-root',
    role === 'alertdialog' ? 'ui-sheet-root--alertdialog' : null,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const panelClass = [
    'ui-sheet',
    surface === 'session' ? 'ui-sheet--session ui-surface-session' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const titleNode = (
    <h2
      id={titleId}
      ref={titleRef}
      tabIndex={-1}
      className={hideTitle ? 'ui-visually-hidden' : 'ui-sheet__title'}
    >
      {title}
    </h2>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      size="auto"
      title={titleNode}
      closable={false}
      extra={
        showClose ? (
          <IconButton label="Закрыть" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null
      }
      destroyOnHidden
      keyboard
      maskClosable
      focusable={{ trap: true, focusTriggerAfterClose: true }}
      className={panelClass}
      rootClassName={rootClass}
      classNames={{
        wrapper: 'ui-sheet-wrapper',
        body: 'ui-sheet__body',
        footer: footer ? 'ui-sheet__footer' : undefined,
        header: 'ui-sheet__header',
        section: 'ui-sheet__section',
      }}
      styles={{
        wrapper: {
          maxWidth: 640,
          marginInline: 'auto',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
        },
        section: {
          borderRadius: '16px 16px 0 0',
        },
      }}
      footer={footer ?? null}
      drawerRender={(dom) => {
        if (!isValidElement(dom)) {
          return dom;
        }
        return cloneElement(dom as ReactElement<Record<string, unknown>>, {
          role,
          'aria-modal': true,
          'aria-labelledby': titleId,
        });
      }}
    >
      {children}
    </Drawer>
  );
}
