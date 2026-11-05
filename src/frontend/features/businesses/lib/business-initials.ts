/** Up to two letters for a business's avatar: "Harborline Supply Co." → HS. */
export const BusinessInitials = (name: string) =>
  name.split(/\s+/).filter((word) => /^\p{L}/u.test(word)).slice(0, 2).map((word) => word[0].toUpperCase()).join('');
