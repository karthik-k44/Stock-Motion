import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { Button } from '@/frontend/components/button';
import type { NavItemType } from './nav-type';
import { Sidebar } from './Sidebar';

type AppLayoutProps = {
  nav: NavItemType[];
  badges: Record<string, number | undefined>;
  topbarEnd: ReactNode;
  sidebarFooter?: ReactNode;
  brand?: ReactNode;
  busy?: boolean;
  children: ReactNode;
};

export const AppLayout = ({ nav, badges, topbarEnd, sidebarFooter, brand, busy, children }: AppLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const current = nav.find((n) => pathname.startsWith(n.path));

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar nav={nav} badges={badges} open={menuOpen} onNavigate={() => setMenuOpen(false)} footer={sidebarFooter} brand={brand} />
      {menuOpen && <div className="scrim" aria-hidden onClick={() => setMenuOpen(false)} />}
      <div className="shell-main">
        <header className="topbar">
          <Button
            variant="ghost"
            icon="menu"
            className="menu-toggle"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="app-nav"
            onClick={() => setMenuOpen((v) => !v)}
          />
          <p className="topbar-title">{current?.label ?? 'StockMotion'}</p>
          <div className="topbar-end">{topbarEnd}</div>
          {busy && <span className="route-progress" aria-hidden />}
        </header>
        <main id="main" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};
