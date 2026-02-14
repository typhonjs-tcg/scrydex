import { AbstractCollection } from './AbstractCollection';
import { SortedKind }         from './category';
import { BasicCategory }      from './category';

import type { CardDB }        from '#scrydex/data/db';

import type {
   CardSorted,
   CardCategory,
   SortOptions }              from '../types-sort';

/**
 *
 */
export class BasicCollection extends AbstractCollection
{
   #sortOptions?: SortOptions;

   /**
    * @param options - Required options.
    *
    * @param options.cards - Cards associated with this collection.
    *
    * @param options.dirpath - The subdirectory for this collection.
    *
    * @param [options.meta] - CardDB metadata from source of cards.
    */
   constructor({ cards, dirpath, sortByKind, meta }:
    { cards: CardSorted[], dirpath: string, sortByKind?: boolean, meta?: CardDB.File.MetadataCommon })
   {
      super({
         cards,
         categories: BasicCollection.#createCategories(cards, sortByKind),
         dirpath,
         meta,
      });
   }

   /**
    * Returns the most recently applied sort configuration.
    *
    * @returns Any sort options applied.
    */
   getSortOptions(): Readonly<SortOptions> | undefined
   {
      return this.#sortOptions ? { ...this.#sortOptions } : {};
   }

   /**
    * @param options - Sort options to apply.
    *
    * @param [options.alpha] - Sort by alphabetical name.
    *
    * @param [options.type] - Sort by normalized type.
    */
   sort(options: { alpha?: boolean, type?: boolean })
   {
      this.#sortOptions = { ...options };

      for (const category of this.values()) { category.sort(options); }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param cards -
    *
    * @param sortByKind -
    */
   static #createCategories(cards: CardSorted[], sortByKind?: boolean):
    Map<string, CardCategory>
   {
      if (cards.length === 0) { return new Map<string, CardCategory>(); }

      const categories = new Map<string, CardCategory>();

      const category = sortByKind ? new SortedKind({ name: 'all' }) : new BasicCategory({ name: 'all' });

      for (const card of cards) { category.add(card); }

      categories.set('all', category);

      return categories;
   }
}
