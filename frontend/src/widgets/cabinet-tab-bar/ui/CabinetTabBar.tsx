import { NavLink, useLocation } from 'react-router-dom';
import { CABINET_TABS, resolveCabinetTabId } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';
import { CabinetTabIcon } from './CabinetTabIcon';
import './CabinetTabBar.css';

export function CabinetTabBar() {
  const { pathname } = useLocation();
  const activeTabId = resolveCabinetTabId(pathname);

  return (
    <nav className="cabinet-tab-bar" aria-label="Кабинет">
      <div className="cabinet-tab-bar__inner">
        <div className="cabinet-tab-bar__list" role="tablist">
          {CABINET_TABS.map((tab) => {
            const isActive = activeTabId === tab.id;
            const isStage2 = tab.stage === 2;
            const classNames = [
              'cabinet-tab-bar__tab',
              isActive ? 'cabinet-tab-bar__tab--active' : '',
              isStage2 ? 'cabinet-tab-bar__tab--soon' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                role="tab"
                aria-selected={isActive}
                className={classNames}
              >
                <span className="cabinet-tab-bar__icon" aria-hidden>
                  <CabinetTabIcon tabId={tab.id} />
                </span>
                <span className="cabinet-tab-bar__label-row">
                  <span className="cabinet-tab-bar__label">{tab.label}</span>
                  {isStage2 ? (
                    <span className="cabinet-tab-bar__soon-badge">Скоро</span>
                  ) : null}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
