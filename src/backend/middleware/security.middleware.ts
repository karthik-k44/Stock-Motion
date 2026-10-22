import helmet from 'helmet';
import { isProduction } from '@/backend/config/env';

/**
 * Security headers on every response. In production the Content-Security-Policy allows this origin only:
 * the built scripts, styles, self-hosted fonts and the realtime socket. Development leaves CSP off for Vite's HMR.
 */
export const SecurityHeaders = () =>
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: false,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'"],
            // React `style={…}` and Radix positioning write inline style attributes.
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'blob:'],
            'font-src': ["'self'", 'data:'],
            // Same-origin fetch and the socket.io websocket ('self' covers ws/wss to this host).
            'connect-src': ["'self'"],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
          },
        }
      : false,
    // Browsers only honour HSTS over HTTPS, which is how production is served.
    strictTransportSecurity: isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
