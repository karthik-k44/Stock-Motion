import { Router } from 'express';
import { usersController } from './users.controller';

export const usersRoutes = Router();

usersRoutes.get('/', usersController.List);
