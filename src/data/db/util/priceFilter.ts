import type {
   PriceExpression,
   PriceFilter }  from './types-db-util';

/**
 * Parses a price comparison expression.
 *
 * Supported formats:
 * - `<number`
 * - `>number`
 * - `<=number`
 * - `>=number`
 *
 * Captured groups:
 * - `operator` — One of `<`, `>`, `<=`, or `>=`
 * - `value` — A numeric price value (integer or decimal)
 *
 * Examples:
 * - `<10`
 * - `>=2.50`
 * - `<= 0.99`
 */
const priceRegex = /^(?<operator><=|>=|<|>)\s*(?<value>-?\d+(?:\.\d+)?)$/;

/**
 * @param input - Price expression to parse.
 *
 * @returns Parsed price expression or null.
 */
function parsePriceExpression(input: string): PriceExpression | null
{
   if (typeof input !== 'string') { return null; }

   const match = priceRegex.exec(input);
   if (!match?.groups) { return null; }

   const rawValue = match.groups.value;
   const value = Number(rawValue);

   if (!Number.isFinite(value)) { return null; }

   return {
      operator: match.groups.operator as PriceExpression['operator'],
      rawValue,
      value
   };
}

/**
 * @param input - Price filter to parse.
 *
 * @returns Parsed price filter or null.
 */
function parsePriceFilter(input: string): PriceFilter | null
{
   if (input === 'null') { return { kind: 'null' }; }

   const match = priceRegex.exec(input);
   if (!match?.groups) { return null; }

   const expr = parsePriceExpression(input);
   if (!expr) { return null; }

   return { kind: 'comparison', expr };
}

/**
 * @param price -
 *
 * @param expr -
 */
function matchesPriceExpression(price: number | string | null | undefined, expr: PriceExpression): boolean
{
   const priceNum = typeof price === 'string' ? parseFloat(price) : price;

   if (!priceNum || !Number.isFinite(priceNum)) { return false; }

   switch (expr.operator)
   {
      case '<':
         return priceNum < expr.value;

      case '<=':
         return priceNum <= expr.value;

      case '>':
         return priceNum > expr.value;

      case '>=':
         return priceNum >= expr.value;

      default:
         return false;
   }
}

/**
 * Checks that the given price meets the price filter constraints.
 *
 * @param price -
 *
 * @param filter -
 */
function matchesPriceFilter(price: number | null | undefined, filter: PriceFilter): boolean
{
   switch (filter.kind)
   {
      case 'null':
         return price === null || price === void 0 || !Number.isFinite(price);

      case 'comparison':
         if (price === null || price === void 0 || !Number.isFinite(price)) { return false; }
         return matchesPriceExpression(price, filter.expr);
   }
}

export {
   parsePriceExpression,
   parsePriceFilter,
   matchesPriceExpression,
   matchesPriceFilter };
