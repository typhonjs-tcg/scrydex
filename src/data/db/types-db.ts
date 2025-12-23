import type {
   PriceFilter }              from '#types-data';

/**
 * Provides the configuration object for {@link CardFilter.filter}.
 */
interface ConfigCardFilter
{
   /**
    * Independent card properties to filter.
    */
   properties: {
      /**
       * Card border colors to filter.
       */
      border?: Set<string>;

      /**
       * WUBRG color identity set.
       */
      colorIdentity?: Set<string>;

      /**
       * Match card `CMC`.
       */
      cmc?: number;

      /**
       * Game format legality.
       */
      formats?: string[];

      /**
       * An array of RegExp instances for keywords that a card uses such as 'Flying' and 'Cumulative upkeep'.
       */
      keywords?: RegExp[];

      /**
       * Match exact mana cost.
       */
      manaCost?: string;

      /**
       * Price filter to match.
       */
      price?: PriceFilter;
   };

   /**
    * Defines a possible regex test that occurs before independent property tests.
    */
   regex?: {
      /**
       * Regex operation.
       */
      op: RegExp;

      /**
       * The card fields to search.
       */
      fields: Set<string>,

      /**
       * Info for logging config.
       */
      log: {
         input: string,

         caseInsensitive: boolean,
         exact: boolean,
         wordBoundary: boolean;
      }
   }
}

export {
   ConfigCardFilter };
