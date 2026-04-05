import type {
   CardSorted,
   SortOptions }              from '#scrydex/data/sort/collection';

import type { CardSection }   from '#scrydex/data/sort/collection/category/section';

/**
 * Defines the interface for a collection of cards with sub-category sorting.
 */
interface CardCategory<T = CardSorted>
{
   /**
    * @returns Name of the collection of cards.
    */
   readonly name: string;

   /**
    * @returns The total amount of cards in collection.
    */
   readonly size: number;

   /**
    * @param card - Card to add.
    */
   add(card: T): void;

   /**
    * @returns Values iterator for all categories / cards.
    */
   values(): IterableIterator<CardSection<T>>;

   /**
    * Sorts this category.
    *
    * @param options - Sort options.
    */
   sort(options: SortOptions): void;
}

export { CardCategory }
