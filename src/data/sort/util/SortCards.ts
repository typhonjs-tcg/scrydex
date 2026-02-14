import { ScryfallData }       from '#scrydex/data/scryfall';
import { isFiniteNumber }     from '#scrydex/util';

import type { CardDB }        from '#scrydex/data/db';

import type { SortDirection } from '../types-sort';

/**
 * Provides various sorting and partitioning of lists of {@link CardDB.Data.Card} instances.
 */
export abstract class SortCards
{
   private constructor() {}

   /**
    * Sort in-place cards by collector numbers using a best-effort numeric heuristic: leading digits are preferred,
    * trailing digits are used as a fallback, and a lexicographic comparison is used as a final fallback.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
    */
   static byCollectorNumber({ cards, direction = 'asc' }:
    { cards: CardDB.Data.Card[], direction?: SortDirection }): CardDB.Data.Card[]
   {
      const parsed = new Map<CardDB.Data.Card, ScryfallData.ParsedCollectorNumber>();

      for (const card of cards) { parsed.set(card, ScryfallData.parseCollectorNumber(card.collector_number)); }

      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a, b) =>
      {
         const pa = parsed.get(a)!;
         const pb = parsed.get(b)!;

         let cmp = 0;

         // Prefer leading numeric tokens, fallback to trailing numeric tokens, otherwise treat as non-numeric.
         const aNum = pa.leadingNumber ?? pa.trailingNumber ?? NaN;
         const bNum = pb.leadingNumber ?? pb.trailingNumber ?? NaN;

         if (Number.isFinite(aNum) && Number.isFinite(bNum)) { cmp = aNum - bNum; }

         // Secondary comparison: middle segment if both present.
         if (cmp === 0 && pa.middle && pb.middle) { cmp = pa.middle.localeCompare(pb.middle); }

         // Final fallback: raw string comparison.
         if (cmp === 0) { cmp = pa.raw.localeCompare(pb.raw); }

         return cmp * factor;
      });
   }

   /**
    * Sort in-place cards by name.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
    */
   static byName({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a: CardDB.Data.Card, b: CardDB.Data.Card) => factor * a.name.localeCompare(b.name));
   }

   /**
    * Sort in-place cards by name then price.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.nameDirection] - Name sort direction; default: `asc`.
    *
    * @param [options.priceDirection] - Price sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
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
    * Sort in-place cards by price.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
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
    * Sort in-place cards by release date.
    *
    * Primary order: release date (`released_at`)
    * Secondary order: card name (stable fallback)
    *
    * Cards without a valid release date are ordered last.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
    */
   static byReleaseDate({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a, b) =>
      {
         const aTime = Date.parse(a.released_at);
         const bTime = Date.parse(b.released_at);

         const aValid = Number.isFinite(aTime);
         const bValid = Number.isFinite(bTime);

         // Both valid dates - compare normally.
         if (aValid && bValid)
         {
            const cmp = aTime - bTime;
            if (cmp !== 0) { return cmp * factor; }
         }
         else if (aValid !== bValid)   // Only one valid - valid dates come first
         {
            return aValid ? -1 : 1;
         }

         // Stable fallback.
         return a.name.localeCompare(b.name);
      });
   }

   /**
    * Sort in-place cards by set then collector numbers using a best-effort numeric heuristic: leading digits are
    * preferred, trailing digits are used as a fallback, and a lexicographic comparison is used as a final fallback.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
    */
   static bySetThenCollectorNumber({ cards, direction = 'asc' }:
    { cards: CardDB.Data.Card[], direction?: SortDirection }): CardDB.Data.Card[]
   {
      const parsed = new Map<CardDB.Data.Card, ScryfallData.ParsedCollectorNumber>();

      for (const card of cards) { parsed.set(card, ScryfallData.parseCollectorNumber(card.collector_number)); }

      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a, b) =>
      {
         // Primary: set code.
         let cmp = a.set.localeCompare(b.set);
         if (cmp !== 0) { return cmp * factor; }

         // Secondary: collector number.
         const pa = parsed.get(a)!;
         const pb = parsed.get(b)!;

         // Prefer leading numeric tokens, fallback to trailing numeric tokens, otherwise treat as non-numeric.
         const aNum = pa.leadingNumber ?? pa.trailingNumber ?? NaN;
         const bNum = pb.leadingNumber ?? pb.trailingNumber ?? NaN;

         if (Number.isFinite(aNum) && Number.isFinite(bNum)) { cmp = aNum - bNum; }

         // Secondary comparison: middle segment if both present.
         if (cmp === 0 && pa.middle && pb.middle) { cmp = pa.middle.localeCompare(pb.middle); }

         // Final fallback: raw string comparison.
         if (cmp === 0) { cmp = pa.raw.localeCompare(pb.raw); }

         return cmp * factor;
      });
   }

   /**
    * Sort in-place cards by normalized type line.
    *
    * @param options - Options.
    *
    * @param options.cards - List of cards.
    *
    * @param [options.direction] - Sort direction; default: `asc`.
    *
    * @returns Sorted cards / original instance.
    */
   static byType({ cards, direction = 'asc' }: { cards: CardDB.Data.Card[], direction?: SortDirection }):
    CardDB.Data.Card[]
   {
      const factor = direction === 'asc' ? 1 : -1;

      return cards.sort((a: CardDB.Data.Card, b: CardDB.Data.Card) => factor * a.norm_type.localeCompare(b.norm_type));
   }
}
