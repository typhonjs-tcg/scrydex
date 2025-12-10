import { CardFields }   from '#data';

import { Card }         from '#types';

/**
 * Helper to create additional cell notes used in spreadsheet for note / comment on applicable cells.
 *
 * - Translate card mana cost to English phrase.
 * - Translate foreign card name to English.
 */
export class Notes
{
   /**
    * Translates a mana cost string (e.g. "{1}{W}{W}") into readable English.
    *
    * @param card - Card to convert mana cost to string note.
    *
    * @returns English description.
    */
   static manaCost(card: Card): string
   {
      const manaCost = card.mana_cost;

      // Extract symbols between `{}`.
      const tokens = Array.from(manaCost.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);

      if (!tokens.length) { return 'No mana cost'; }

      /**
       * Count occurrences.
       */
      const counts: Map<string, number> = new Map();

      for (const token of tokens) { counts.set(token, (counts.get(token) ?? 0) + 1); }

      const fragments = [];

      for (const [symbol, count] of counts.entries())
      {
         const desc = this.#describeUnit(symbol);

         // If desc already encodes quantity; IE "2 generic or 1 white".
         if (desc.includes(' or '))
         {
            fragments.push(`${count}× ${desc}`);
         }
         else if (desc.match(this.#regexColors))   // Single color name.
         {
            fragments.push(`${count} ${desc}`);
         }
         else if (desc.startsWith('𝗫'))   // Generic unbounded value.
         {
            fragments.push(`${count}× ${desc}`);
         }
         else
         {
            fragments.push(desc);
         }
      }

      return `➤ ${fragments.join('\n➤ ')}`;
   }

   /**
    * @param card - Card to provide any foreign name and original language code.
    */
   static nameForeign(card: Card): string
   {
      const lang = CardFields.langCode(card);

      const name = card.lang !== lang ? '' : `${card.printed_name ?? card.name}\n`;

      return `${name}Language: ${CardFields.langName(card)}`;
   }

   // Internal Implementation (`manaCost`) ---------------------------------------------------------------------------

   /**
    * Maps single mana symbols to English names.
    */
   static #COLOR_NAMES: Record<string, string> = {
      W: 'white',
      U: 'blue',
      B: 'black',
      R: 'red',
      G: 'green',
      C: 'colorless',
      S: 'snow'
   };

   /**
    * Detects color name.
    */
   static #regexColors = /\b(white|blue|black|red|green|colorless|snow)\b/;

   /**
    * Translates a single Scryfall mana symbol; IE `W`, `2/W`, `W/P`, `X`.
    *
    * @param symbol -
    *
    * @returns English description.
    */
   static #describeUnit(symbol: string): string
   {
      // `X` / unbounded generic.
      if (symbol === 'X') { return '𝗫 generic'; }

      // Numeric.
      if (/^\d+$/.test(symbol)) { return `${symbol} generic`; }

      // Plain color.
      if (this.#COLOR_NAMES[symbol]) { return `${this.#COLOR_NAMES[symbol]}`; }

      // Monocolor hybrid {2/W}.
      if (/^2\/[WUBRG]$/.test(symbol))
      {
         const color = this.#COLOR_NAMES[symbol.split('/')[1]];
         return `2 generic or 1 ${color}`;
      }

      // Two-color hybrid {W/U}.
      if (/^[WUBRG]\/[WUBRG]$/.test(symbol))
      {
         const [a, b] = symbol.split('/');
         return `${this.#COLOR_NAMES[a]} or ${this.#COLOR_NAMES[b]}`;
      }

      // Phyrexian {W/P}.
      if (/^[WUBRG]\/P$/.test(symbol))
      {
         const color = this.#COLOR_NAMES[symbol.split('/')[0]];
         return `${color} or 2 life`;
      }

      return symbol;
   }
}
