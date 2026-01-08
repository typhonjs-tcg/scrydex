import { ScryfallData }    from '#scrydex/data/scryfall';
import { isFiniteNumber }  from '#scrydex/util';

import type { CardDB }     from '#scrydex/data/db';

/**
 * Sorts a Card[] by name then price with optional price direction.
 *
 * @param cards -
 *
 * @param [direction] - Default ascending.
 */
export function sortByNameThenPrice(cards: CardDB.Data.Card[], direction: 'asc' | 'desc' = 'asc'): void
{
   cards.sort((a: CardDB.Data.Card, b: CardDB.Data.Card) =>
   {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) { return nameCmp; }

      const aPrice = ScryfallData.parsePrice(a.price);
      const bPrice = ScryfallData.parsePrice(b.price);

      if (isFiniteNumber(aPrice) && isFiniteNumber(bPrice))
      {
         return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      }

      return 0;
   });
}
