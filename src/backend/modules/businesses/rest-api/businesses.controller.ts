import type { Request, Response } from 'express';
import { AccountOf } from '@/backend/middleware/auth.middleware';
import { businessesService } from '../businesses.service';
import {
  AccountIdParamSchema,
  CreateBusinessSchema,
  UpdateBusinessSchema,
  UpdateMemberSchema,
} from '../businesses.validators';
import { ScopeOf } from './businesses.middleware';

export const businessesController = {
  ListMine: async (req: Request, res: Response) => {
    res.json(await businessesService.ListMine(AccountOf(req).id));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await businessesService.Create(AccountOf(req), CreateBusinessSchema.parse(req.body)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await businessesService.Get(ScopeOf(req)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await businessesService.Update(ScopeOf(req), UpdateBusinessSchema.parse(req.body)));
  },
  Reset: async (req: Request, res: Response) => {
    res.json(await businessesService.Reset(ScopeOf(req)));
  },
  ListMembers: async (req: Request, res: Response) => {
    res.json(await businessesService.ListMembers(ScopeOf(req)));
  },
  UpdateMember: async (req: Request, res: Response) => {
    const { accountId } = AccountIdParamSchema.parse(req.params);
    res.json(await businessesService.UpdateMember(ScopeOf(req), accountId, UpdateMemberSchema.parse(req.body)));
  },
  RemoveMember: async (req: Request, res: Response) => {
    const { accountId } = AccountIdParamSchema.parse(req.params);
    res.json(await businessesService.RemoveMember(ScopeOf(req), accountId));
  },
};
