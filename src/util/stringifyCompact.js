/**
 * Creates a compact / single entry per line string to serialize an object list.
 *
 * @param {object[]} source - A list of objects to serialize.
 *
 * @returns {string} JSON list as compact string.
 */
export function stringifyCompact(source)
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
