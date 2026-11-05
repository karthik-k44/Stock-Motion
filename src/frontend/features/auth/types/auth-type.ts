import { z } from 'zod';

export type AccountResponseType = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSessionResponseType = {
  account: AccountResponseType;
  accessToken: string;
};

export type InvitePreviewResponseType = {
  businessName: string;
  businessType: string;
  role: string;
  roleLabel: string;
  expiresAt: string;
};

export const LoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use at most 72 characters'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
