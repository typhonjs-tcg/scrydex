import type { Card } from '#types';

/**
 * Additional data added to cards when sorting.
 */
interface CardSorted extends Card
{
   /**
    * For marked files indicate merge status.
    */
   mark?: 'error' | 'ok' | 'warning';
}

/**
 * Defines the interface for a collection of cards with sub-category sorting.
 */
interface SortedCategories
{
   /**
    * @returns Name of the collection of cards.
    */
   get name(): string;

   /**
    * @returns The total amount of cards in collection.
    */
   get size(): number;

   /**
    * @param card - Card to add.
    */
   add(card: CardSorted): void;

   /**
    * @returns Entry iterator for category / cards.
    */
   entries(): MapIterator<[string, CardSorted[]]>;

   sort(options: Record<string, boolean>): void;
}

export {
   CardSorted,
   SortedCategories
};
