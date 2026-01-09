import { ScryfallData }       from '#scrydex/data/scryfall';
import { isFiniteNumber }     from '#scrydex/util';

import type { CardDB }        from '#scrydex/data/db';

import type { SortDirection } from './types-sort';

/**
 * Provides various sorting and partitioning of lists of {@link CardDB.Data.Card} instances.
 */
export abstract class SortCards
{
   private constructor() {}

   /**
    * Sort cards by name.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    */
   static byName({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a: CardDB.Data.Card, b: CardDB.Data.Card) => factor * a.name.localeCompare(b.name));
   }

   /**
    * Sort cards by name then price.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.nameDirection] - Name sort direction; default: `asc`.
    *
    * @param [options.priceDirection] - Price sort direction; default: `asc`.
    */
   static byNameThenPrice({ cards, nameDirection = 'asc', priceDirection = 'asc' }:
    { cards: CardDB.Data.Card[], nameDirection?: SortDirection, priceDirection?: SortDirection }): CardDB.Data.Card[]
   {
      const nameFactor = nameDirection === 'asc' ? 1 : -1;
      const priceFactor = priceDirection === 'asc' ? 1 : -1;

      return cards.sort((a, b) =>
      {
         const nameCmp = nameFactor * a.name.localeCompare(b.name);
         if (nameCmp !== 0) { return nameCmp; }

         const aPrice = ScryfallData.parsePrice(a.price);
         const bPrice = ScryfallData.parsePrice(b.price);

         if (isFiniteNumber(aPrice) && isFiniteNumber(bPrice)) { return priceFactor * (aPrice - bPrice); }

         return 0;
      });
   }

   /**
    * Sort cards by price.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    */
   static byPrice({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a, b) =>
      {
         const aPrice = ScryfallData.parsePrice(a.price);
         const bPrice = ScryfallData.parsePrice(b.price);

         if (isFiniteNumber(aPrice) && isFiniteNumber(bPrice)) { return factor * (aPrice - bPrice); }

         return 0;
      });
   }

   /**
    * Sort cards by normalized type line.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    */
   static byType({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a: CardDB.Data.Card, b: CardDB.Data.Card) => factor * a.type.localeCompare(b.type));
   }
}
