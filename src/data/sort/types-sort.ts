import type { CardDB } from '#scrydex/data/db';

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
 * Defines ascending or descending sort order.
 */
type SortDirection = 'asc' | 'desc';

/**
 * Sorting configuration flags used during collection sorting and export.
 *
 * The following sorting modes are currently recognized:
 * ```
 * - `alpha` — Sort entries alphabetically.
 * - `type`  — Sort entries by card type.
 * ```
 *
 * This interface is intentionally extensible. Additional boolean flags may be introduced in the future to support
 * new sorting strategies without requiring structural changes to the API surface.
 *
 * Unknown keys are permitted and interpreted as opt-in sorting modes.
 */
interface SortOptions
{
   /**
    * Alphabetical sorting.
    */
   alpha?: boolean;

   /**
    * Sorted by card type line.
    */
   type?: boolean;

   /**
    * Additional custom sorting flags.
    *
    * Keys not explicitly defined above are allowed to support forward-compatible or experimental sorting strategies.
    */
   [key: string]: boolean | undefined;
}

export {
   type CardCategory,
   type CardSorted,
   type SortedCategories,
   type SortDirection,
   type SortOptions };
