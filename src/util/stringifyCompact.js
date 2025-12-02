/**
 * Creates a compact / single card per line string to serialize a card list.
 *
 * @param {object[]} cards - Cards to serialize.
 *
 * @returns {string} JSON card list as compact string.
 */
export function stringifyCompact(cards)
{
   let output = `[\n`;

   for (let i = 0; i < cards.length; i++)
   {
      const notLast = i !== cards.length - 1;

      output += `  ${JSON.stringify(cards[i])}${notLast ? ',': ''}\n`;
   }

   output += `]\n`;

   return output;
}
