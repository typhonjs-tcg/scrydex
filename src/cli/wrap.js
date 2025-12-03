/**
 * Convenience function to wrap a long string for the CLI help.
 *
 * @param {string}   text - Text to wrap.
 *
 * @param {number}   width - Column width.
 *
 * @returns {string} Wrapped string.
 */
export function wrap(text, width = 80)
{
   const words = text.split(' ');
   let line = '';
   let out = '';

   for (const w of words)
   {
      if ((line + w).length > width)
      {
         out += line.trimEnd() + '\n';
         line = '';
      }
      line += w + ' ';
   }

   return out + line.trimEnd();
}
