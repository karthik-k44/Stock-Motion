/** Categorical colours in fixed order (validated default palette). Categories get them by list position. */
const PALETTE = ['#e66d00', '#7a5af5', '#1baf7a', '#c49a00', '#e87ba4', '#3f3a36', '#b5487a', '#0e7fa6', '#8a5a36', '#6b7280'];

/** Colour for a category, stable for its position in the business's category list. */
export const CategoryColor = (categories: { code: string }[] | undefined, code: string): string => {
  const index = categories?.findIndex((c) => c.code === code) ?? -1;
  return index < 0 ? PALETTE[PALETTE.length - 1] : PALETTE[index % PALETTE.length];
};
