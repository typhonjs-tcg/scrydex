import { AbstractCollection }      from '../AbstractCollection';

import {
   isSupportedFormat,
   SortedKind,
   SortOrder
} from '#data';

import type {
   CardDBMetaSave,
   CardSorted,
   SortedCategories }            from '#types-data';

import type {
   GameFormats }                 from '#types';

export class SortedFormat extends AbstractCollection
{
   readonly #meta: CardDBMetaSave;

   /**
    * @param name -
    *
    * @param format -
    *
    * @param cards -
    */
   constructor({ cards, name, format }: { cards: CardSorted[], name: string, format?: GameFormats })
   {
      super(name, cards, SortedFormat.#sortRarity(cards, format));

      this.#meta = isSupportedFormat(format) ? Object.freeze({ name, type: 'sorted_format', format }) :
       { name, type: 'sorted' };
   }

   get meta(): Readonly<CardDBMetaSave>
   {
      return this.#meta;
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

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param cards -
    *
    * @param [format] -
    */
   static #sortRarity(cards: CardSorted[], format?: GameFormats): Map<string, SortedCategories>
   {
      if (cards.length === 0) { return new Map<string, SortedCategories>(); }

      const sortedCategories = new Map<string, SortedCategories>();

      for (const card of cards)
      {
         // For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
         // recent rarity. Fallback if necessary to the actual card rarity.
         const rarity = SortOrder.rarity(card, format);

         let categoryRarity = sortedCategories.has(rarity) ? sortedCategories.get(rarity) : void 0;
         if (!categoryRarity)
         {
            categoryRarity = new SortedKind(rarity);
            sortedCategories.set(rarity, categoryRarity);
         }

         categoryRarity.add(card);
      }

      return sortedCategories;
   }
}
