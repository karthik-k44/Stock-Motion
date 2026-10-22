import type { Request, Response } from 'express';

export const NotFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
};
