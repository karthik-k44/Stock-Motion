import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name the category').max(40),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const CategoryCodeParamSchema = z.object({ code: z.string().min(1).max(40) });
