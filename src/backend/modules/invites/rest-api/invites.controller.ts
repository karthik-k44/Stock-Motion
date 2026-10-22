import type { Request, Response } from 'express';
import { AccountOf } from '@/backend/middleware/auth.middleware';
import { SendSession } from '@/backend/modules/auth/rest-api/auth.controller';
import { RegisterSchema } from '@/backend/modules/auth/auth.validators';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { invitesService } from '../invites.service';
import { CreateInviteSchema, InviteIdParamSchema, InviteTokenParamSchema } from '../invites.validators';

const tokenOf = (req: Request) => InviteTokenParamSchema.parse(req.params).token;

export const invitesController = {
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await invitesService.Create(ScopeOf(req), CreateInviteSchema.parse(req.body)));
  },
  List: async (req: Request, res: Response) => {
    res.json(await invitesService.List(ScopeOf(req)));
  },
  Revoke: async (req: Request, res: Response) => {
    await invitesService.Revoke(ScopeOf(req), InviteIdParamSchema.parse(req.params).inviteId);
    res.status(204).send();
  },
  Preview: async (req: Request, res: Response) => {
    res.json(await invitesService.Preview(tokenOf(req)));
  },
  Accept: async (req: Request, res: Response) => {
    res.json(await invitesService.Accept(AccountOf(req), tokenOf(req)));
  },
  Register: async (req: Request, res: Response) => {
    const session = await invitesService.Register(tokenOf(req), RegisterSchema.parse(req.body));
    SendSession(res, session, 201);
  },
};
