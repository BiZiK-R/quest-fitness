import type { CabinetTabId } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';
import {
  AchievementsIcon,
  AnalyticsIcon,
  MeasurementsIcon,
  MembershipIcon,
  NutritionIcon,
  WorkoutsIcon,
  type IconProps,
} from '@/shared/ui/icons';

const TAB_ICONS: Record<CabinetTabId, (props: IconProps) => React.JSX.Element> = {
  workouts: WorkoutsIcon,
  analytics: AnalyticsIcon,
  nutrition: NutritionIcon,
  measurements: MeasurementsIcon,
  achievements: AchievementsIcon,
  membership: MembershipIcon,
};

type CabinetTabIconProps = {
  tabId: CabinetTabId;
};

/** Линейная иконка вкладки кабинета 24px из kit. */
export function CabinetTabIcon({ tabId }: CabinetTabIconProps) {
  const Icon = TAB_ICONS[tabId];
  return <Icon size={24} />;
}
