import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';
import type { NavItemType } from './nav-type';

type SidebarProps = {
  nav: NavItemType[];
  badges: Record<string, number | undefined>;
  open: boolean;
  onNavigate: () => void;
  footer?: ReactNode;
};

export function Sidebar({ nav, badges, open, onNavigate, footer }: SidebarProps) {
  return (
    <nav id="app-nav" className={Cn('sidebar', open && 'sidebar-open')} aria-label="Main">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <Icon name="package" size={20} />
        </span>
        <span>
          <span className="brand-name">StockMotion</span>
          <span className="brand-sub">Dock 1 · Main warehouse</span>
        </span>
      </div>
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
}
