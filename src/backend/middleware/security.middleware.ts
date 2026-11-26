import helmet from 'helmet';
import { isProduction } from '@/backend/config/env';

const RAZORPAY_CHECKOUT = 'https://checkout.razorpay.com';

/**
 * Security headers on every response. In production the Content-Security-Policy allows this origin, plus Razorpay
 * Checkout (its script, payment iframe and telemetry). Development leaves CSP off for Vite's HMR.
 */
export const SecurityHeaders = () =>
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: false,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", RAZORPAY_CHECKOUT],
            // React `style={…}` and Radix positioning write inline style attributes.
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.razorpay.com'],
            'font-src': ["'self'", 'data:'],
            // Same-origin fetch and the socket.io websocket ('self' covers ws/wss to this host).
            'connect-src': ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
            'frame-src': [RAZORPAY_CHECKOUT, 'https://api.razorpay.com'],
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
    // Razorpay Checkout opens the bank's page (3-D Secure, the test bank) in a popup and drives it from its iframe.
    // Helmet's default, same-origin, cuts that popup off from its opener, leaving it blank and failing the payment.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
