import type { Data } from '../types-db';

export abstract class Price
{
   private constructor() {}

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
   static #priceRegex = /^(?<operator><=|>=|<|>)\s*(?<value>-?\d+(?:\.\d+)?)$/;

   /**
    * @param price -
    *
    * @param expr -
    */
   static matchesExpression(price: number | string | null | undefined, expr: Data.PriceExpression): boolean
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
   static matchesFilter(price: number | null | undefined, filter: Data.PriceFilter): boolean
   {
      switch (filter.kind)
      {
         case 'null':
            return price === null || price === void 0 || !Number.isFinite(price);

         case 'comparison':
            if (price === null || price === void 0 || !Number.isFinite(price)) { return false; }
            return this.matchesExpression(price, filter.expr);
      }
   }

   /**
    * @param input - Price expression to parse.
    *
    * @returns Parsed price expression or null.
    */
   static parseExpression(input: string): Data.PriceExpression | null
   {
      if (typeof input !== 'string') { return null; }

      const match = this.#priceRegex.exec(input);
      if (!match?.groups) { return null; }

      const rawValue = match.groups.value;
      const value = Number(rawValue);

      if (!Number.isFinite(value)) { return null; }

      return {
         operator: match.groups.operator as Data.PriceExpression['operator'],
         rawValue,
         value
      };
   }

   /**
    * @param input - Price filter to parse.
    *
    * @returns Parsed price filter or null.
    */
   static parseFilter(input: string): Data.PriceFilter | null
   {
      if (input === 'null') { return { kind: 'null' }; }

      const match = this.#priceRegex.exec(input);
      if (!match?.groups) { return null; }

      const expr = this.parseExpression(input);
      if (!expr) { return null; }

      return { kind: 'comparison', expr };
   }
}
