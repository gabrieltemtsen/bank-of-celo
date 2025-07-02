/**
 * Truncates a string to show only the first `front` chars
 * and the last `back` chars, with “…” in between.
 */
export function truncateAddress(
  str: string,
  front: number = 4,
  back: number = 3,
): string {
  if (str.length <= front + back) {
    return str;
  }
  return `${str.slice(0, front)}…${str.slice(-back)}`;
}
