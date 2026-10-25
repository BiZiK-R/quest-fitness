import { Tag } from 'antd';
import './StatusPill.css';

export type WorkoutStatus = 'waiting' | 'arrived' | 'missed' | 'cancelled';

/** Канонические слова статусов Тренировки (EXPERIENCE → Voice and Tone). */
export const WORKOUT_STATUS_LABEL: Record<WorkoutStatus, string> = {
  waiting: 'Ожидание',
  arrived: 'Пришёл',
  missed: 'Пропущена',
  cancelled: 'Отменена',
};

export type StatusPillProps = {
  status: WorkoutStatus;
  className?: string;
};

/** Пилюля статуса на базе antd Tag. Фон — вторичный сигнал, никогда не красный. */
export function StatusPill({ status, className }: StatusPillProps) {
  const classes = ['ui-status-pill', `ui-status-pill--${status}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag variant="filled" className={classes}>
      {WORKOUT_STATUS_LABEL[status]}
    </Tag>
  );
}
