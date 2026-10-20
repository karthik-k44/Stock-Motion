/** Categorical colours in fixed order (validated default palette). Categories get them by list position. */
const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#7a5af5', '#0e7fa6', '#b5487a', '#6b7280'];

/** Colour for a category, stable for its position in the business's category list. */
export const CategoryColor = (categories: { code: string }[] | undefined, code: string): string => {
  const index = categories?.findIndex((c) => c.code === code) ?? -1;
  return index < 0 ? PALETTE[PALETTE.length - 1] : PALETTE[index % PALETTE.length];
};
