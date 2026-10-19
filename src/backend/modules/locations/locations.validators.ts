import { z } from 'zod';

export const LocationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9-]{0,23}$/, 'Use letters, numbers and dashes, e.g. FRIDGE-4');

export const CreateLocationSchema = z.object({
  code: LocationCodeSchema,
  /** One of the template's zones, or a new zone code */
  zone: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,12}$/, 'Use a short zone code, e.g. FRIDGE'),
  name: z.string().trim().min(1, 'Name the location').max(80),
});
export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
