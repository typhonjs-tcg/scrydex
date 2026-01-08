import { CardDB }          from '#scrydex/data/db';

import type { ConfigCmd }  from '../../types-command';

/**
 * Provides an async generator of cards to be exported.
 *
 * @param options - Options.
 *
 * @param options.config -
 *
 * @param options.db -
 */
export async function* exportCards({ config, db }:
 { config: ConfigCmd.Export, db: CardDB.Stream.Reader }): AsyncGenerator<CardDB.Data.Card>
{
   const logger = config.logger;

   if (config.coalesce)
   {
      // Duplicate card entries by unique key are coalesced into a single entry.

      // First pass - calculate quantity of unique card entries ------------------------------------------------------

      const uniqueKeyMap = await db.getQuantityMap({ isExportable: true, logger });

      // Second pass exporting unique card entries -------------------------------------------------------------------

      for await (const card of db.asStream({ uniqueKeys: uniqueKeyMap, uniqueOnce: true }))
      {
         const quantity = uniqueKeyMap.get(CardDB.uniqueCardKey(card));
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
            logger?.warn(`Skipping card (${card.name}) from '${db.meta.name}' due to invalid quantity: ${
             card.quantity}`);

            continue;
         }

         yield card;
      }
   }
}
