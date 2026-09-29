import type { CabinetTabId } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';

type CabinetTabIconProps = {
  tabId: CabinetTabId;
};

/** Monochrome 20×20 icons for cabinet tab bar (no emoji). */
export function CabinetTabIcon({ tabId }: CabinetTabIconProps) {
  switch (tabId) {
    case 'workouts':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 10h12M10 4v12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <rect x="3" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="14" y="8" width="3" height="4" rx="1" fill="currentColor" />
        </svg>
      );
    case 'analytics':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 15V9M8 15V5M12 15v-4M16 15V7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'nutrition':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 7h12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M4 10h12" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case 'measurements':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 5h10v10H5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M8 8h4M8 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'achievements':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M6.5 12.5 5 16l5-2 5 2-1.5-3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'membership':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="4"
            y="6"
            width="12"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path d="M7 10h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
