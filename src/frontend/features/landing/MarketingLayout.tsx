import { Outlet, ScrollRestoration } from 'react-router';
import { LandingFooter } from './components/LandingFooter';
import { LandingNav } from './components/LandingNav';
import { useFrameMotion } from './lib/use-landing-motion';
import { useSignedIn } from './lib/use-signed-in';

/**
 * The frame of the public pages (`/`, `/features`, `/pricing`, `/faq`): navbar, the page, footer. Scroll restoration
 * starts each page at the top and scrolls `/#…` links to their section, after the page has rendered.
 */
export const MarketingLayout = () => {
  const signedIn = useSignedIn();
  const motion = useFrameMotion();
  return (
    <div ref={motion} className="landing min-h-dvh bg-canvas text-ink">
      <a href="#marketing-main" className="skip-link">
        Skip to content
      </a>
      <LandingNav signedIn={signedIn} />
      <main id="marketing-main">
        <Outlet />
      </main>
      <LandingFooter signedIn={signedIn} />
      <ScrollRestoration />
    </div>
  );
};
