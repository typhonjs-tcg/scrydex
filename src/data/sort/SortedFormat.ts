import { SortedCollection }   from './SortedCollection';
import { SortedColor }        from './SortedColor';

import type {
   CardSorted,
   SortedCategories }         from '#types-data';

export class SortedFormat extends SortedCollection
{
   /**
    * @param format -
    *
    * @param cards -
    */
   constructor(format: string, cards: CardSorted[])
   {
      super(format, cards, SortedFormat.#sortRarity(format, cards));
   }

   /**
    * @param options -
    *
    * @param [options.alpha] - Sort by alphabetical name.
    *
    * @param [options.type] - Sort by normalized type.
    */
   sort(options: { alpha?: boolean, type?: boolean })
   {
      for (const category of this.values()) { category.sort(options); }
   }

   /**
    * @param format -
    *
    * @param cards -
    */
   static #sortRarity(format: string, cards: CardSorted[]): Map<string, SortedCategories>
   {
      if (cards.length === 0) { return new Map<string, SortedCategories>(); }

      const sortedCategories = new Map<string, SortedCategories>();

      for (const card of cards)
      {
         // For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
         // recent rarity. Fallback if necessary to the actual card rarity.
         const rarity = (format === 'oldschool' || format === 'premodern' ? card.rarity_orig : card.rarity_recent) ??
          card.rarity;

         let sortRarity = sortedCategories.has(rarity) ? sortedCategories.get(rarity) : void 0;
         if (!sortRarity)
         {
            sortRarity = new SortedColor(rarity);
            sortedCategories.set(rarity, sortRarity);
         }

         sortRarity.add(card);
      }

      return sortedCategories;
   }
}
