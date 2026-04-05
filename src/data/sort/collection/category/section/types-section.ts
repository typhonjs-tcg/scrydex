import type { CardSorted } from '#scrydex/data/sort/collection';

/**
 * Defines an individual sorted category.
 */
interface CardSection<T = CardSorted>
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

export { CardSection }
