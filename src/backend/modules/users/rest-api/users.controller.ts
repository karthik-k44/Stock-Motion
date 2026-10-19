import type { Request, Response } from 'express';
import { usersService } from '../users.service';

export const usersController = {
  List: async (_req: Request, res: Response) => {
    res.json(await usersService.List());
  },
};
