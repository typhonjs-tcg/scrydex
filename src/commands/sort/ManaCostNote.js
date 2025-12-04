/**
 * Helper to translate card mana cost to English phrase. Used in spreadsheet for note / comment on each mana cost cell.
 */
export class ManaCostNote
{
   /**
    * Maps single mana symbols to English names.
    *
    * @type {Record<string, string>}
    */
   static #COLOR_NAMES = {
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
    *
    * @type {RegExp}
    */
   static #regexColors = /\b(white|blue|black|red|green|colorless|snow)\b/;

   /**
    * Translates a mana cost string (e.g. "{1}{W}{W}") into readable English.
    *
    * @param {string} manaCost - Card mana cost string to translate.
    *
    * @returns {string} English description.
    */
   static translate(manaCost)
   {
      // Extract symbols between `{}`.
      const tokens = Array.from(manaCost.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);

      if (!tokens.length) { return 'No mana cost'; }

      /**
       * Count occurrences.
       *
       * @type {Map<string, number>}
       */
      const counts = new Map();

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

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Translates a single Scryfall mana symbol; IE `W`, `2/W`, `W/P`, `X`.
    *
    * @param {string} symbol -
    *
    * @returns {string} English description.
    */
   static #describeUnit(symbol)
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

