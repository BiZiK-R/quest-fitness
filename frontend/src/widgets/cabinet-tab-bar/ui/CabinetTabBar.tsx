import { NavLink, useLocation } from 'react-router-dom';
import { CABINET_TABS, resolveCabinetTabId } from '@/widgets/cabinet-tab-bar/lib/cabinet-tabs';
import { CabinetTabIcon } from './CabinetTabIcon';
import './CabinetTabBar.css';

/**
 * Нижний tab-bar кабинета (DESIGN → tab-bar): 64px, иконка 24 + подпись.
 * Кладётся в слот `bottom` AppShell — ширина и «прилипание» берутся от колонки.
 */
export function CabinetTabBar() {
  const { pathname } = useLocation();
  const activeTabId = resolveCabinetTabId(pathname);

  return (
    <nav className="cabinet-tab-bar" aria-label="Кабинет">
      <div className="cabinet-tab-bar__list" role="tablist">
        {CABINET_TABS.map((tab) => {
          const isActive = activeTabId === tab.id;
          const isStage2 = tab.stage === 2;
          const classNames = [
            'cabinet-tab-bar__tab',
            isActive ? 'cabinet-tab-bar__tab--active' : null,
            isStage2 ? 'cabinet-tab-bar__tab--soon' : null,
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
              <span className="cabinet-tab-bar__icon" aria-hidden="true">
                <CabinetTabIcon tabId={tab.id} />
              </span>
              <span className="cabinet-tab-bar__text">
                <span className="cabinet-tab-bar__label">{tab.label}</span>
                {isStage2 ? <span className="cabinet-tab-bar__soon">Скоро</span> : null}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
