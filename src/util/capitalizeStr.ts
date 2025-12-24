/**
 * Helper to capitalize first character of a string.
 *
 * @param str -
 *
 * @returns Capitalized string.
 */
export function capitalizeStr(str: string)
{
   if (str.length === 0) { return str; }

   return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}
