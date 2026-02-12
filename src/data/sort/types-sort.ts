import type { CardDB } from '#scrydex/data/db';

/**
 * Additional data added to cards when sorting.
 */
interface CardSorted extends CardDB.Data.Card
{
   /**
    * For marked files indicate merge status.
    */
   mark?: 'error' | 'ok' | 'warning';
}

/**
 * Defines ascending or descending sort order.
 */
type SortDirection = 'asc' | 'desc';

/**
 * Defines the interface for a collection of cards with sub-category sorting.
 */
interface SortedCategories<T = CardSorted>
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
   values(): IterableIterator<CardCategory<T>>;

   sort(options: Record<string, boolean>): void;
}

/**
 * Defines an individual sorted category.
 */
interface CardCategory<T = CardSorted>
{
   /**
    * All cards in category.
    */
   readonly cards: T[];

   /**
    * Full name of category.
    */
   readonly nameFull: string;

   /**
    * Abbreviated short name for category.
    */
   readonly nameShort: string;
}

export {
   type CardCategory,
   type CardSorted,
   type SortedCategories,
   type SortDirection };
