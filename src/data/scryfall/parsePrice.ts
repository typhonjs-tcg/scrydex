/**
 * Parses a string price value ensuring a finite number or null. The `price` property of cards is a string or null.
 *
 * @param value - Value to parse.
 *
 * @returns Parsed price as number or null.
 */
export function parsePrice(value: string | null): number | null
{
   if (value === null) { return null; }

   const num = Number(value);
   return Number.isFinite(num) ? num : null;
}
