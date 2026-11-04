import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { LogoMark, LogoName } from '@/frontend/components/logo';
import { Cn } from '@/frontend/lib/utils';
import type { NavItemType } from './nav-type';

type SidebarProps = {
  nav: NavItemType[];
  badges: Record<string, number | undefined>;
  open: boolean;
  onNavigate: () => void;
  footer?: ReactNode;
  /** Under the brand name: the business switcher */
  brand?: ReactNode;
};

export const Sidebar = ({ nav, badges, open, onNavigate, footer, brand }: SidebarProps) => {
  return (
    <nav id="app-nav" className={Cn('sidebar', open && 'sidebar-open')} aria-label="Main">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <LogoMark className="h-6" />
        </span>
        <span className="brand-name">
          <LogoName />
        </span>
      </div>
      {brand && <div className="brand-switch">{brand}</div>}
      <ul className="nav-list">
        {nav.map((item) => {
          const count = item.badge ? badges[item.badge] : undefined;
          return (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => Cn('nav-link', isActive && 'nav-link-active')} onClick={onNavigate}>
                <Icon name={item.icon} size={18} />
                <span className="nav-label">{item.label}</span>
                {count ? (
                  <span className="nav-badge" aria-label={`${count} need attention`}>
                    {count}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
      {footer && <div className="sidebar-foot">{footer}</div>}
    </nav>
  );
};
