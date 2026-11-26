import type { ComponentType } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router';
import { paths } from './config/paths';
import { NotFound, RouteError } from './features/not-found/NotFound';
import { Shell } from './features/shell/Shell';

/**
 * A page that loads on its first visit. This is the router's own `lazy`, not React's: the router then knows a page is
 * on its way, which is what the top bar's loading line reads.
 */
const lazyPage = <Name extends string>(load: () => Promise<Record<Name, ComponentType>>, name: Name) => async () => ({
  Component: (await load())[name],
});

const Login = lazyPage(() => import('./features/auth/Login'), 'Login');
const Signup = lazyPage(() => import('./features/auth/Signup'), 'Signup');
const AcceptInvite = lazyPage(() => import('./features/auth/AcceptInvite'), 'AcceptInvite');

const Onboarding = lazyPage(() => import('./features/onboarding/Onboarding'), 'Onboarding');
const Plans = lazyPage(() => import('./features/billing/Plans'), 'Plans');
const Checkout = lazyPage(() => import('./features/billing/Checkout'), 'Checkout');

const MarketingLayout = lazyPage(() => import('./features/landing/MarketingLayout'), 'MarketingLayout');
const Landing = lazyPage(() => import('./features/landing/Landing'), 'Landing');
const Features = lazyPage(() => import('./features/landing/Features'), 'Features');
const HowItWorks = lazyPage(() => import('./features/landing/HowItWorks'), 'HowItWorks');
const Pricing = lazyPage(() => import('./features/landing/Pricing'), 'Pricing');
const Faq = lazyPage(() => import('./features/landing/Faq'), 'Faq');
const Contact = lazyPage(() => import('./features/landing/Contact'), 'Contact');

const World = lazyPage(() => import('./features/world/World'), 'World');

const Dashboard = lazyPage(() => import('./features/dashboard/Dashboard'), 'Dashboard');

const Inventory = lazyPage(() => import('./features/inventory/Inventory'), 'Inventory');

const Orders = lazyPage(() => import('./features/orders/Orders'), 'Orders');

const Deliveries = lazyPage(() => import('./features/deliveries/Deliveries'), 'Deliveries');

const Locations = lazyPage(() => import('./features/locations/Locations'), 'Locations');

const Customers = lazyPage(() => import('./features/customers/Customers'), 'Customers');

const Suppliers = lazyPage(() => import('./features/suppliers/Suppliers'), 'Suppliers');

const Team = lazyPage(() => import('./features/team/Team'), 'Team');

const Settings = lazyPage(() => import('./features/settings/Settings'), 'Settings');

const Activity = lazyPage(() => import('./features/activity/Activity'), 'Activity');

const Billing = lazyPage(() => import('./features/billing/Billing'), 'Billing');
const Invoices = lazyPage(() => import('./features/billing/Invoices'), 'Invoices');

/** Built from elements, not rendered as <Routes>: the loading line, scroll restoration and RouteError all need a data router. */
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public: signing in, signing up and joining a team from an invite link. */}
      <Route path={paths.login} lazy={Login} errorElement={<RouteError />} />
      <Route path={paths.signup} lazy={Signup} errorElement={<RouteError />} />
      <Route path="/invite/:token" lazy={AcceptInvite} errorElement={<RouteError />} />

      {/* Signed in, getting started: choosing a plan, paying for it, then setting up the inventories. */}
      <Route path={paths.plans} lazy={Plans} errorElement={<RouteError />} />
      <Route path="/checkout" lazy={Checkout} errorElement={<RouteError />} />
      <Route path={paths.onboarding} lazy={Onboarding} errorElement={<RouteError />} />

      {/* The public marketing pages, under one layout (the navbar and footer stay mounted between them). */}
      <Route lazy={MarketingLayout} errorElement={<RouteError />}>
        <Route index lazy={Landing} />
        <Route path="features" lazy={Features} />
        <Route path="how-it-works" lazy={HowItWorks} />
        <Route path="pricing" lazy={Pricing} />
        <Route path="faq" lazy={Faq} />
        <Route path="contact" lazy={Contact} />
      </Route>

      {/* Signed in, inside a business (a layout route: its pages keep their own paths). */}
      <Route element={<Shell />} errorElement={<RouteError />}>
        <Route path="world" lazy={World} />

        <Route path="dashboard" lazy={Dashboard} />

        <Route path="inventory" lazy={Inventory} />

        <Route path="orders/:number?" lazy={Orders} />

        <Route path="deliveries/:number?" lazy={Deliveries} />

        <Route path="locations" lazy={Locations} />

        <Route path="customers/:id?" lazy={Customers} />

        <Route path="suppliers" lazy={Suppliers} />

        <Route path="team" lazy={Team} />

        <Route path="settings" lazy={Settings} />

        <Route path="activity" lazy={Activity} />

        <Route path="billing" lazy={Billing} />

        <Route path="invoices/:id?" lazy={Invoices} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </>,
  ),
);

export const App = () => <RouterProvider router={router} />;
