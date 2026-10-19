import express, { type Express } from 'express';
import { ErrorHandler } from './middleware/error.middleware';
import { NotFoundHandler } from './middleware/not-found.middleware';
import { RateLimitWrites } from './middleware/rate-limit.middleware';
import { activityRoutes } from './modules/activity/rest-api/activity.routes';
import { dashboardRoutes } from './modules/dashboard/rest-api/dashboard.routes';
import { deliveriesRoutes } from './modules/deliveries/rest-api/deliveries.routes';
import { itemsRoutes } from './modules/items/rest-api/items.routes';
import { locationsRoutes } from './modules/locations/rest-api/locations.routes';
import { ordersRoutes } from './modules/orders/rest-api/orders.routes';
import { systemRoutes } from './modules/system/rest-api/system.routes';
import { usersRoutes } from './modules/users/rest-api/users.routes';

/** The API only. `server.ts` adds the frontend (Vite in dev, static build in production). */
export function CreateApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use(RateLimitWrites({ windowMs: 60_000, max: 300 }));
  api.use('/system', systemRoutes);
  api.use('/users', usersRoutes);
  api.use('/items', itemsRoutes);
  api.use('/orders', ordersRoutes);
  api.use('/deliveries', deliveriesRoutes);
  api.use('/locations', locationsRoutes);
  api.use('/activity', activityRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use(NotFoundHandler);
  api.use(ErrorHandler);

  app.use('/api', api);
  return app;
}
