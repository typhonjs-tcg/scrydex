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

/**
 *
 */
type PriceFilter =
   | { kind: 'comparison'; expr: PriceExpression }
   | { kind: 'null' };

/**
 * Represents a parsed price comparison expression.
 *
 * This is the normalized form of a user-provided price filter such as `<10`, `>=2.50`, or `<= 0.99`.
 *
 * The `rawValue` field is retained for diagnostics, logging, and future serialization, while `value` should be
 * used exclusively for evaluation.
 */
interface PriceExpression
{
   /**
    * Comparison operator to apply.
    */
   operator: '<' | '>' | '<=' | '>=';

   /**
    * Preserves the original numeric string.
    */
   rawValue: string;

   /**
    * Parsed numeric value used for all comparisons.
    */
   value: number;
}

export {
   ConfigCardFilter,
   PriceExpression,
   PriceFilter };
