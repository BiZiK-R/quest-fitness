import type { ReactNode } from 'react';

export type IconProps = {
  /** Размер в px; сетка всегда 24, штрих 1.5px. */
  size?: number;
  className?: string;
};

/**
 * Линейные иконки 24px, штрих 1.5px (DESIGN → Shapes). Декоративны: имя даёт кнопка/строка.
 * Цвет — currentColor.
 */
function Icon({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* --- Навигация и действия --- */

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 3.5 3.5" />
    </Icon>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5 7 7-7 7" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 9.5 7 7 7-7" />
    </Icon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 14.5 7-7 7 7" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8.75" y="8.75" width="10.5" height="10.5" rx="2" />
      <path d="M15.25 8.75V6.75a2 2 0 0 0-2-2h-6.5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

export function LockIcon({ size = 16, ...rest }: IconProps) {
  return (
    <Icon size={size} {...rest}>
      <rect x="4.75" y="10.75" width="14.5" height="8.5" rx="2" />
      <path d="M8 10.75V7.5a4 4 0 0 1 8 0v3.25" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 4.75H7a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h6" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </Icon>
  );
}

/* --- Разделы тренера --- */

/** Пул клиентов — список зала. */
export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" strokeWidth={2.25} />
    </Icon>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 12h8" />
      <rect x="4.75" y="7.75" width="3.25" height="8.5" rx="1" />
      <rect x="16" y="7.75" width="3.25" height="8.5" rx="1" />
      <path d="M2.75 10.5v3M21.25 10.5v3" />
    </Icon>
  );
}

/** Дневник. */
export function BookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.75 5.75a2 2 0 0 1 2-2h10.5v14.5H7.75a2 2 0 0 0-2 2V5.75Z" />
      <path d="M5.75 19.75a2 2 0 0 0 2 2h10.5v-3.5M9.5 8h5" />
    </Icon>
  );
}

/** Пул тренеров. */
export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.75 19c.6-2.9 2.7-4.75 5.25-4.75s4.65 1.85 5.25 4.75" />
      <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6M17.25 14.5c1.5.6 2.6 2.1 3 4.5" />
    </Icon>
  );
}

/** Шаблоны тренировки. */
export function LayersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 8.25 4.25L12 12.5 3.75 8.25 12 4Z" />
      <path d="m3.75 12.25 8.25 4.25 8.25-4.25M3.75 16 12 20.25 20.25 16" />
    </Icon>
  );
}

/** Макроциклы. */
export function RepeatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 3.75 20.25 7 17 10.25" />
      <path d="M4 11.5V10a3 3 0 0 1 3-3h13.25" />
      <path d="M7 20.25 3.75 17 7 13.75" />
      <path d="M20 12.5V14a3 3 0 0 1-3 3H3.75" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5.75" width="16" height="14.25" rx="2" />
      <path d="M4 10h16M8.5 3.75v4M15.5 3.75v4" />
    </Icon>
  );
}

/** Админ-панель. */
export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.75 19.25 6.5v5.25c0 4.25-3 7.25-7.25 8.5-4.25-1.25-7.25-4.25-7.25-8.5V6.5L12 3.75Z" />
    </Icon>
  );
}

/* --- Tab bar кабинета клиента --- */

export function WorkoutsIcon(props: IconProps) {
  return <DumbbellIcon {...props} />;
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h16" />
      <path d="M7 16.5V11M12 16.5V6M17 16.5v-8" />
    </Icon>
  );
}

export function NutritionIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7.25c-1.5-1.25-3.5-1.5-5-.5-2 1.25-2.5 4-1.5 7 1 3 3 5.5 5 5.5.6 0 1-.25 1.5-.5.5.25.9.5 1.5.5 2 0 4-2.5 5-5.5 1-3 .5-5.75-1.5-7-1.5-1-3.5-.75-5 .5Z" />
      <path d="M12 7.25c0-1.75.75-3 2.25-3.5" />
    </Icon>
  );
}

export function MeasurementsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.75" y="8.25" width="16.5" height="7.5" rx="1.5" />
      <path d="M7.5 8.25v3M11 8.25v2M14.5 8.25v3M18 8.25v2" />
    </Icon>
  );
}

export function AchievementsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="5.25" />
      <path d="m8.75 13.25-1.25 7 4.5-2.5 4.5 2.5-1.25-7" />
    </Icon>
  );
}

export function MembershipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.75" y="6" width="16.5" height="12" rx="2" />
      <path d="M3.75 10h16.5M7.5 14.5h4" />
    </Icon>
  );
}
