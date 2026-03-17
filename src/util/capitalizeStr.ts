/**
 * Helper to capitalize first character of a string.
 *
 * @param str - String to capitalize.
 *
 * @returns Capitalized string.
 */
export function capitalizeStr(str: string)
{
   /* v8 ignore next 1 */ // Sanity case.
   if (str.length === 0) { return str; }

   return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
