import { CardDB }             from '#scrydex/data/db';

import type { ScryfallData }  from '#scrydex/data/db';
import type { CardSorted }    from '#scrydex/data/sort/collection';

/**
 * Provides card data related to sort order for rarity and card category.
 */
export abstract class KindSortOrder
{
   static #regexArtifact = /\bartifact\b/i;
   static #regexLand = /\bland\b/i

   /* v8 ignore next 1 */
   private constructor() {}

   /**
    * Returns the card category sort name for {@link SortedKind}.
    *
    * @param card -
    *
    * @returns The `kind` category: `W`, `U`, `B`, `R`, `G`, `Multicolor`, `Artifact (Colorless)`,
    *          `Non-artifact (Colorless)`, `Land`, or `Land (Basic)`.
    */
   static categoryName(card: CardDB.Data.Card): string
   {
      const colors = CardDB.CardFields.colorUnion(card);

      switch(colors.length)
      {
         case 0:
         {
            // Devoid cards lack `colors` data, but have a mana cost, so sort by mana cost colors.
            if (Array.isArray(card.keywords) && card.keywords.includes('Devoid'))
            {
               const colorManaCost = CardDB.CardFields.colorManaCost(card);

               switch (colorManaCost.size)
               {
                  /* v8 ignore next 2 */ // As of 4/8/26 there are no 0 CMC Devoid cards.
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
    * @param [format] - Specific game format. When omitted `card.rarity` is returned.
    */
   static rarity(card: CardDB.Data.Card, format?: ScryfallData.GameFormat)
   {
      /* v8 ignore next 1 */ // Rarity normalization is always present sanity fallback `?? card.rarity` is not hit.
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
      else if (card.norm_type.startsWith('Land - Basic'))
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
