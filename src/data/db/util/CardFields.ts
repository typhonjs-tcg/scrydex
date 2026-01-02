import { parseManaCostColors }   from '../../scryfall';

import type {
   Colors,
   Card,
   CardFace }                    from '#types';

export abstract class CardFields
{
   /**
    * Calculate union for `colors` field taking into account card faces.
    *
    * @param card -
    *
    * @returns Read only union of all card colors.
    */
   static colorUnion(card: Card): Readonly<Colors>
   {
      if (card.card_faces)
      {
         let faceColors: Set<string> = new Set<string>();
         for (const face of card.card_faces)
         {
            faceColors = faceColors.union(new Set(face.colors));
         }

         return faceColors.size ? [...faceColors] : card.colors ?? [];
      }
      else
      {
         return Array.isArray(card.colors) ? card.colors : [];
      }
   }

   /**
    * Parse card colors from mana cost. Some card categories like `Devoid` do not have an associated `colors` array, but
    * do have a mana cost potentially with casting colors.
    *
    * @param card -
    *
    * @returns A set with mana cost colors.
    */
   static colorManaCost(card: Card): Set<string>
   {
      let colors: Set<string>;

      if (card.card_faces)
      {
         colors = new Set();

         for (const face of card.card_faces) { colors = colors.union(parseManaCostColors(face.mana_cost)); }
      }
      else
      {
         colors = parseManaCostColors(card.mana_cost);
      }

      return colors;
   }

   /**
    * Defer to original CSV language code if available and differs from the Scryfall card `lang` field.
    *
    * Alas, currently most online MTG collection services do not associate cards w/ foreign language Scryfall IDs.
    * A temporary solution is to defer to any language set by the collection service exported CSV instead of the
    * found Scryfall card data / language when these values differ. This requires the user to correctly set the language
    * in the online MTG collection service.
    *
    * @param card -
    *
    * @returns Normalized language code.
    */
   static langCode(card: Card): string
   {
      return typeof card.lang_csv === 'string' && card.lang !== card.lang_csv ? card.lang_csv : card.lang;
   }

   /**
    * The mana cost string. Multi-face cards potentially have multiple mana cost seperated by ` // `.
    *
    * @param card -
    *
    * @returns The mana cost string.
    */
   static manaCost(card: Card): string
   {
      return card.card_faces ? this.partsManaCost(card).join(' // ') : card.mana_cost;
   }

   /**
    * Return all `colors` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns The `colors` string array parts.
    */
   static partsColors(card: Card): Colors[]
   {
      return this.#partsPropArray(card, 'colors');
   }

   /**
    * Return all `colors` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns The `colors` string array parts.
    */
   static partsCMC(card: Card): number[]
   {
      return this.#partsPropNumber(card, 'cmc');
   }

   /**
    * Return all `name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `mana_cost` text parts.
    */
   static partsManaCost(card: Card): string[]
   {
      return this.#partsPropStr(card, 'mana_cost');
   }

   /**
    * Return all `name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `name` text parts.
    */
   static partsName(card: Card): string[]
   {
      return this.#partsPropStr(card, 'name');
   }

   /**
    * Return all `printed_name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `printed_name` text parts.
    */
   static partsPrintedName(card: Card): string[]
   {
      return this.#partsPropStr(card, 'printed_name');
   }

   /**
    * Return all `oracle_text` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `oracle_text` text parts.
    */
   static partsOracleText(card: Card): string[]
   {
      return this.#partsPropStr(card, 'oracle_text');
   }

   /**
    * Return all `type_line` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `type_line` text parts.
    */
   static partsTypeLine(card: Card): string[]
   {
      return this.#partsPropStr(card, 'type_line');
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   static #partsPropArray(card: Card, prop: keyof Card | keyof CardFace): string[][]
   {
      const results: string[][] = [];

      if (card.card_faces)
      {
         for (const face of card.card_faces)
         {
            if (Array.isArray(face[prop as keyof CardFace]))
            {
               results.push(face[prop as keyof CardFace] as string[]);
            }
         }

         if (results.length === 0 && Array.isArray(card[prop])) { results.push(card[prop] as string[]); }
      }
      else
      {
         if (Array.isArray(card[prop])) { results.push(card[prop] as string[]); }
      }

      return results;
   }

   static #partsPropNumber(card: Card, prop: keyof Card | keyof CardFace): number[]
   {
      const results: number[] = [];

      if (card.card_faces)
      {
         for (const face of card.card_faces)
         {
            if (Number.isFinite(face[prop as keyof CardFace] as number))
            {
               results.push(face[prop as keyof CardFace] as number);
            }
         }

         if (results.length === 0 && Number.isFinite(card[prop as keyof Card]))
         {
            results.push(card[prop as keyof Card] as number);
         }
      }
      else
      {
         if (Number.isFinite(card[prop as keyof Card])) { results.push(card[prop as keyof Card] as number); }
      }

      return results;
   }

   static #partsPropStr(card: Card, prop: keyof Card | keyof CardFace): string[]
   {
      const results: string[] = [];

      if (card.card_faces)
      {
         for (const face of card.card_faces)
         {
            if (typeof face[prop as keyof CardFace] === 'string')
            {
               results.push(face[prop as keyof CardFace] as string);
            }
         }

         if (results.length === 0 && typeof card[prop] === 'string') { results.push(card[prop]); }
      }
      else
      {
         if (typeof card[prop] === 'string') { results.push(card[prop]); }
      }

      return results;
   }
}
