export function Signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
}

export function Plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
