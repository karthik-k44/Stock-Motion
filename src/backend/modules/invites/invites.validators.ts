import { z } from 'zod';

export const CreateInviteSchema = z.object({
  role: z.string().min(1, 'Choose a role'),
  /** How long the link works for */
  days: z.number().int().min(1).max(30).default(7),
});
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const InviteIdParamSchema = z.object({ inviteId: z.string().min(1) });
export const InviteTokenParamSchema = z.object({ token: z.string().min(16).max(100) });
