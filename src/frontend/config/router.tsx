import { createBrowserRouter } from 'react-router';
import { NotFound, RouteError } from '@/frontend/features/not-found/NotFound';
import { Shell } from '@/frontend/features/shell/Shell';
import { paths } from './paths';

export const router = createBrowserRouter([
  // Public: signing in, signing up and joining a team from an invite link.
  { path: paths.login, errorElement: <RouteError />, lazy: async () => ({ Component: (await import('@/frontend/features/auth/Login')).Login }) },
  { path: paths.signup, errorElement: <RouteError />, lazy: async () => ({ Component: (await import('@/frontend/features/auth/Signup')).Signup }) },
  {
    path: '/invite/:token',
    errorElement: <RouteError />,
    lazy: async () => ({ Component: (await import('@/frontend/features/auth/AcceptInvite')).AcceptInvite }),
  },
  // Signed in, choosing or creating a business.
  {
    path: paths.onboarding,
    errorElement: <RouteError />,
    lazy: async () => ({ Component: (await import('@/frontend/features/onboarding/Onboarding')).Onboarding }),
  },
  // The public marketing pages, under one layout (the navbar and footer stay mounted between them).
  {
    errorElement: <RouteError />,
    lazy: async () => ({ Component: (await import('@/frontend/features/landing/MarketingLayout')).MarketingLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/frontend/features/landing/Landing')).Landing }) },
      { path: 'features', lazy: async () => ({ Component: (await import('@/frontend/features/landing/Features')).Features }) },
      { path: 'how-it-works', lazy: async () => ({ Component: (await import('@/frontend/features/landing/HowItWorks')).HowItWorks }) },
      { path: 'pricing', lazy: async () => ({ Component: (await import('@/frontend/features/landing/Pricing')).Pricing }) },
      { path: 'faq', lazy: async () => ({ Component: (await import('@/frontend/features/landing/Faq')).Faq }) },
    ],
  },
  // Signed in, inside a business (a layout route: its pages keep their own paths).
  {
    element: <Shell />,
    errorElement: <RouteError />,
    children: [
      { path: 'world', lazy: async () => ({ Component: (await import('@/frontend/features/world/World')).World }) },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('@/frontend/features/dashboard/Dashboard')).Dashboard }) },
      { path: 'inventory', lazy: async () => ({ Component: (await import('@/frontend/features/inventory/Inventory')).Inventory }) },
      { path: 'orders/:number?', lazy: async () => ({ Component: (await import('@/frontend/features/orders/Orders')).Orders }) },
      { path: 'deliveries/:number?', lazy: async () => ({ Component: (await import('@/frontend/features/deliveries/Deliveries')).Deliveries }) },
      { path: 'locations', lazy: async () => ({ Component: (await import('@/frontend/features/locations/Locations')).Locations }) },
      { path: 'customers/:id?', lazy: async () => ({ Component: (await import('@/frontend/features/customers/Customers')).Customers }) },
      { path: 'suppliers', lazy: async () => ({ Component: (await import('@/frontend/features/suppliers/Suppliers')).Suppliers }) },
      { path: 'team', lazy: async () => ({ Component: (await import('@/frontend/features/team/Team')).Team }) },
      { path: 'settings', lazy: async () => ({ Component: (await import('@/frontend/features/settings/Settings')).Settings }) },
      { path: 'activity', lazy: async () => ({ Component: (await import('@/frontend/features/activity/Activity')).Activity }) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
