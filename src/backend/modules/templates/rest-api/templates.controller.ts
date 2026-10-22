import type { Request, Response } from 'express';
import { templatesService } from '../templates.service';

export const templatesController = {
  List: (_req: Request, res: Response) => {
    res.json(templatesService.List());
  },
};
