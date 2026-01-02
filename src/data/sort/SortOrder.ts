import { CardFields }      from '../db';

import type {
   Card,
   GameFormat }            from '#types';

import type { CardSorted } from '#types-data';

/**
 * Provides card data related to sort order for rarity and card category.
 */
export abstract class SortOrder
{
   static #regexArtifact = /\bartifact\b/i;
   static #regexLand = /\bland\b/i

   private constructor() {}

   /**
    * Returns the card category sort name for `SortedColors`.
    *
    * @param card -
    *
    * @returns The category for `SortedColors` card categories.
    */
   static categoryName(card: Card): string
   {
      const colors = CardFields.colorUnion(card);

      switch(colors.length)
      {
         case 0:
         {
            // Devoid cards lack `colors` data, but have a mana cost, so sort by mana cost colors.
            if (Array.isArray(card.keywords) && card.keywords.includes('Devoid'))
            {
               const colorManaCost = CardFields.colorManaCost(card);

               switch (colorManaCost.size)
               {
                  case 0:
                     return this.#categoryColorless(card);

                  case 1:
                     // Mono-color WUBRG
                     return [...colorManaCost][0].toUpperCase();

                  default:
                     return 'Multicolor';
               }
            }
            else
            {
               return this.#categoryColorless(card);
            }
         }

         case 1:
            // Mono-color WUBRG
            return colors[0].toUpperCase();

         default:
            return 'Multicolor';
      }
   }

   /**
    * Return the sorted format card rarity.
    *
    * Note: For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
    * recent rarity. Fallback if necessary to the actual card rarity.
    *
    * @param card -
    *
    * @param [format] - Specific game format.
    */
   static rarity(card: Card, format?: GameFormat)
   {
      return (format === 'oldschool' || format === 'premodern' ? card.rarity_orig : card.rarity_recent) ?? card.rarity;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Find colorless card sort category name.
    *
    * @param card -
    */
   static #categoryColorless(card: CardSorted)
   {
      if (this.#regexArtifact.test(card.type_line))
      {
         return 'Artifact (Colorless)';
      }
      else if (card.type.startsWith('Land - Basic'))
      {
         return 'Land (Basic)';
      }
      else if (this.#regexLand.test(card.type_line))
      {
         return 'Land';
      }
      else
      {
         return 'Non-artifact (Colorless)';
      }
   }
}
