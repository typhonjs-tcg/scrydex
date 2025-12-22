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
   PriceExpression,
   PriceFilter };
