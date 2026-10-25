/**
 * UI-kit «Гильдия» = Ant Design + тема DESIGN.md (см. theme/guild-theme.ts, AntdProvider).
 * Примитивы (Button, TextField, Select, Segmented, Drawer-шторка, Spin) — тонкие обёртки antd.
 * Каркас AppShell / ListCard / EmptyState / иконки — продуктовый слой поверх.
 *
 * Канон: _bmad-output/.../ux-quest-fitness-2026-09-29/DESIGN.md + EXPERIENCE.md.
 *
 * Запрещено (DESIGN): градиенты, blur, тени, второй красный, красные статусы, opacity у «Скоро»,
 * эмодзи вместо иконок, капс/курсив, квестовый язык на кнопках.
 */
export { AntdProvider, type AntdProviderProps } from './AntdProvider';
export { guildTheme, guildSessionTheme } from './theme/guild-theme';
export { AppShell, type AppShellProps, type AppShellSurface } from './AppShell';
export { BottomCta, type BottomCtaProps } from './BottomCta';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { ChoiceRow, type ChoiceRowProps } from './ChoiceRow';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { GuildMark } from './GuildMark';
export { IconButton, type IconButtonProps } from './IconButton';
export { ListCard, type ListCardProps } from './ListCard';
export { ListRow, type ListRowProps } from './ListRow';
export { LockBadge, LockRow, type LockBadgeProps, type LockRowProps } from './LockBadge';
export { PageMeta, type PageMetaProps } from './PageMeta';
export { PageState, type PageStateProps } from './PageState';
export { SectionTitle, type SectionTitleProps } from './SectionTitle';
export { SelectField, type SelectFieldProps } from './SelectField';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './SegmentedControl';
export {
  StatusPill,
  WORKOUT_STATUS_LABEL,
  type StatusPillProps,
  type WorkoutStatus,
} from './StatusPill';
export { TextArea, type TextAreaProps } from './TextArea';
export { TextField, type TextFieldProps, type TextFieldVariant } from './TextField';
export * from './icons';
