import { Outlet } from 'react-router-dom';
import { CabinetTabBar } from '@/widgets/cabinet-tab-bar/ui/CabinetTabBar';
import './CabinetLayout.css';

export function CabinetLayout() {
  return (
    <div className="cabinet-layout">
      <div className="cabinet-layout__main">
        <Outlet />
      </div>
      <CabinetTabBar />
    </div>
  );
}
