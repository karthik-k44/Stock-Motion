import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './config/router';
import { AppProviders } from './providers/AppProviders';
import './styles/base.css';
import './styles/layout.css';
import './styles/controls.css';
import './styles/data.css';
import './styles/overlay.css';
import './styles/pages.css';
import './styles/scene-world.css';
import './styles/scene-items.css';
import './styles/scene-crew.css';
import './styles/scene-hud.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
