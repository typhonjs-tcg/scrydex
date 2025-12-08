/**
 * Convenience function to wrap a long string for the CLI help.
 *
 * @param text - Text to wrap.
 *
 * @param width - Column width.
 *
 * @returns Wrapped string.
 */
export function wrap(text: string, width: number = 80): string
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
