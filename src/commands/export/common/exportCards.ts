import { uniqueCardKey }   from '#scrydex/data/db/util';
import { logger }          from '#scrydex/util';

import type {
   Card,
   CardStream }            from '#scrydex/data/db';

/**
 * Provides an async generator of cards to be exported.
 *
 * @param options - Options.
 *
 * @param options.db - Source DB being exported.
 *
 * @param [options.coalesce] - When true, unique card entries are coalesced; default: `true`.
 */
export async function* exportCards({ db, coalesce = true }: { db: CardStream, coalesce?: boolean }):
 AsyncGenerator<Card>
{
   if (coalesce)
   {
      // Duplicate card entries by unique key are coalesced into a single entry.

      // First pass - calculate quantity of unique card entries ------------------------------------------------------

      const uniqueKeyMap = await db.getQuantityMap({ isExportable: true, logger });

      // Second pass exporting unique card entries -------------------------------------------------------------------

      for await (const card of db.asStream({ uniqueKeys: uniqueKeyMap, uniqueOnce: true }))
      {
         const quantity = uniqueKeyMap.get(uniqueCardKey(card));
         if (typeof quantity === 'number')
         {
            card.quantity = quantity;
            yield card;
         }
      }
   }
   else
   {
      // All card entries are exported.

      for await (const card of db.asStream({ isExportable: true }))
      {
         if (typeof card.quantity !== 'number' || !Number.isInteger(card.quantity) || card.quantity <= 0)
         {
            logger.warn(`Skipping card (${card.name}) from '${db.meta.name}' due to invalid quantity: ${
             card.quantity}`);

            continue;
         }

         yield card;
      }
   }
}
