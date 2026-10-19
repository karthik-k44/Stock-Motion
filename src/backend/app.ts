import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { RequireAuth } from './middleware/auth.middleware';
import { ErrorHandler } from './middleware/error.middleware';
import { NotFoundHandler } from './middleware/not-found.middleware';
import { RateLimitWrites } from './middleware/rate-limit.middleware';
import { activityRoutes } from './modules/activity/rest-api/activity.routes';
import { authRoutes } from './modules/auth/rest-api/auth.routes';
import { RequireBusinessRole } from './modules/businesses/rest-api/businesses.middleware';
import { businessesRoutes, businessRoutes } from './modules/businesses/rest-api/businesses.routes';
import { categoriesRoutes } from './modules/categories/rest-api/categories.routes';
import { customersRoutes } from './modules/customers/rest-api/customers.routes';
import { dashboardRoutes } from './modules/dashboard/rest-api/dashboard.routes';
import { deliveriesRoutes } from './modules/deliveries/rest-api/deliveries.routes';
import { importsRoutes } from './modules/imports/rest-api/imports.routes';
import { invitesRoutes, publicInvitesRoutes } from './modules/invites/rest-api/invites.routes';
import { itemsRoutes } from './modules/items/rest-api/items.routes';
import { locationsRoutes } from './modules/locations/rest-api/locations.routes';
import { ordersRoutes } from './modules/orders/rest-api/orders.routes';
import { suppliersRoutes } from './modules/suppliers/rest-api/suppliers.routes';
import { systemRoutes } from './modules/system/rest-api/system.routes';
import { templatesRoutes } from './modules/templates/rest-api/templates.routes';

/** The API only. `server.ts` adds the frontend (Vite in dev, static build in production). */
export function CreateApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(RateLimitWrites({ windowMs: 60_000, max: 300 }));
  api.use('/system', systemRoutes);
  api.use('/auth', authRoutes);
  api.use('/templates', templatesRoutes);
  api.use('/invites', publicInvitesRoutes);

  // Everything inside a business: the caller must be a member; req.scope says which business and role.
  const business = express.Router({ mergeParams: true });
  business.use(RequireAuth, RequireBusinessRole());
  business.use('/', businessRoutes);
  business.use('/items', itemsRoutes);
  business.use('/categories', categoriesRoutes);
  business.use('/locations', locationsRoutes);
  business.use('/suppliers', suppliersRoutes);
  business.use('/customers', customersRoutes);
  business.use('/orders', ordersRoutes);
  business.use('/deliveries', deliveriesRoutes);
  business.use('/activity', activityRoutes);
  business.use('/dashboard', dashboardRoutes);
  business.use('/invites', invitesRoutes);
  business.use('/imports', importsRoutes);
  api.use('/businesses/:businessId', business);
  api.use('/businesses', businessesRoutes);

  api.use(NotFoundHandler);
  api.use(ErrorHandler);

  app.use('/api', api);
  return app;
}
