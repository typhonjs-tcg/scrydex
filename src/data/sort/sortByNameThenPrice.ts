import { parsePrice }      from '#scrydex/data';
import { isFiniteNumber }  from '#scrydex/util';

import type { Card }       from '#types';

/**
 * Sorts a Card[] by name then price with optional price direction.
 *
 * @param cards -
 *
 * @param [direction] - Default ascending.
 */
export function sortByNameThenPrice(cards: Card[], direction: 'asc' | 'desc' = 'asc'): void
{
   cards.sort((a: Card, b: Card) =>
   {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) { return nameCmp; }

      const aPrice = parsePrice(a.price);
      const bPrice = parsePrice(b.price);

      if (isFiniteNumber(aPrice) && isFiniteNumber(bPrice))
      {
         return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      }

      return 0;
   });
}
