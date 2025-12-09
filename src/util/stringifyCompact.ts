/**
 * Creates a compact / single entry per line string to serialize an object list.
 *
 * @param source - A list of objects to serialize.
 *
 * @returns JSON list as compact string.
 */
export function stringifyCompact(source: object[]): string
{
   let output = `[\n`;

   for (let i = 0; i < source.length; i++)
   {
      const notLast = i !== source.length - 1;

      output += `  ${JSON.stringify(source[i])}${notLast ? ',': ''}\n`;
   }

   output += `]\n`;

   return output;
}
