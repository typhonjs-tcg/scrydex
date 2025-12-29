import { uniqueCardKey }   from '#data';
import { logger }          from '#util';

import type { CardStream } from '#data';
import type { Card }       from '#types';

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

      const uniqueKeyMap = new Map<string, number>();

      for await (const card of db.asStream({ isExportable: true }))
      {
         if (typeof card.quantity !== 'number' || !Number.isInteger(card.quantity) || card.quantity <= 0)
         {
            logger.warn(`Skipping card (${card.name}) from '${db.meta.name}' due to invalid quantity: ${
             card.quantity}`);

            continue;
         }

         const uniqueKey = uniqueCardKey(card);

         const quantity = uniqueKeyMap.get(uniqueKey);
         uniqueKeyMap.set(uniqueKey, typeof quantity === 'number' ? quantity + card.quantity : card.quantity);
      }

      // Second pass exporting unique card entries -------------------------------------------------------------------

      for await (const card of db.asStream({ isExportable: true }))
      {
         const uniqueKey = uniqueCardKey(card);

         const quantity = uniqueKeyMap.get(uniqueKey);
         if (typeof quantity === 'number')
         {
            card.quantity = quantity;

            yield card;

            uniqueKeyMap.delete(uniqueKey);
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
