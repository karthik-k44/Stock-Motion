import { z } from 'zod';

export const EmailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(200);

export const PasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  // bcrypt ignores everything past 72 bytes, so longer passwords would silently be truncated.
  .refine((v) => new TextEncoder().encode(v).length <= 72, 'Use at most 72 characters');

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
  email: EmailSchema,
  password: PasswordSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
