/**
 * Rounds a number to two decimal places.
 * @param decimal A decimal value to trim to two places.
 */
export function roundToTwo(decimal: number): number {
  return Math.round(decimal * 100) / 100;
}

/**
 * Rounds a number to four decimal places.
 * @param decimal A decimal value to trim to four places.
 */
export function roundToFour(decimal: number): number {
  return Math.round(decimal * 10000) / 10000;
}
