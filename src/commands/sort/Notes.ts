import {
   CardFields,
   PrintCardFields }    from '#scrydex/data/db/util';

import type { CardDB }  from '#scrydex/data/db';

/**
 * Helper to create additional cell notes used in spreadsheet for note / comment on applicable cells.
 *
 * - Additional card statistics / data.
 * - Translate card mana cost to English phrase.
 * - Translate foreign card name to English.
 */
export abstract class Notes
{
   // Extract symbols between `{}`.
   static #regexManaCost = /\{([^}]+)/g;

   /**
    * Generates a note for creatures including power / toughness.
    *
    * @param card -
    */
   static cardStats(card: CardDB.Data.Card): string | undefined
   {
      let note = '';

      if (card.card_faces && card.card_faces.length >= 2)
      {
         const face1 = card.card_faces[0];
         const face2 = card.card_faces[1];

         if (face1.power || face1.toughness || face2.power || face2.toughness)
         {
            const ptFace1 = face1.power && face1.toughness ? `${face1.power}/${face1.toughness}` : '';
            const ptFace2 = face2.power && face2.toughness ? `${face2.power}/${face2.toughness}` : '';

            note += `P/T: ${ptFace1} // ${ptFace2}\n`;
         }

         if (face1.defense || face2.defense)
         {
            note += `Defense: ${face1.defense ?? ''} // ${face2.defense ?? ''}\n`;
         }

         if (face1.loyalty || face2.loyalty)
         {
            note += `Loyalty: ${face1.loyalty ?? ''} // ${face2.loyalty ?? ''}\n`;
         }
      }
      else
      {
         if (typeof card.power === 'string' && typeof card.toughness === 'string')
         {
            note += `P/T: ${card.power}/${card.toughness}\n`;
         }

         if (typeof card.defense === 'string')
         {
            note += `Defense: ${card.defense}\n`;
         }

         if (typeof card.loyalty === 'string')
         {
            note += `Loyalty: ${card.loyalty}\n`;
         }
      }

      if (typeof card.reserved === 'boolean' && card.reserved)
      {
         note += `Reserved List\n`;
      }

      if (typeof card.game_changer === 'boolean' && card.game_changer)
      {
         note += `Game Changer\n`;
      }

      if (typeof card.border_color === 'string')
      {
         note += `Border: ${card.border_color}\n`;
      }

      if (typeof card.foil === 'string')
      {
         note += `Finish: ${card.foil}\n`;
      }

      if (Array.isArray(card.keywords) && card.keywords.length)
      {
         note += `Keywords:\n`;
         note += `➤ ${card.keywords.join('\n➤ ')}`;
      }

      return note.length ? note.trim() : void 0;
   }

   /**
    * Translates a mana cost string (IE `{1}{W}{W}`) into readable English.
    *
    * @param card - Card to convert mana cost to string note.
    *
    * @returns English description.
    */
   static manaCost(card: CardDB.Data.Card): string
   {
      if (card.card_faces)
      {
         const manaCost: string[] = [];
         for (const face of card.card_faces)
         {
            manaCost.push(this.#manaCostImpl(face.mana_cost));
         }
         return manaCost.join('\n//\n');
      }
      else
      {
         return this.#manaCostImpl(card.mana_cost);
      }
   }

   /**
    * Translates a mana cost string (IE `{1}{W}{W}`) into readable English.
    *
    * @param manaCost - A card / card face mana cost to string note.
    *
    * @returns English description.
    */
   static #manaCostImpl(manaCost: string): string
   {
      const tokens = Array.from(manaCost.matchAll(this.#regexManaCost)).map((m) => m[1]);

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

         // If desc already encodes quantity; IE `2 generic or 1 white`.
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
   static nameForeign(card: CardDB.Data.Card): string
   {
      const lang = CardFields.langCode(card);

      const name = card.lang !== lang ? '' : `${card.printed_name ?? card.name}\n`;

      return `${name}Language: ${PrintCardFields.langName(card)}`;
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
