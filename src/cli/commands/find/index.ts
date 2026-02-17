import { isFile }             from '@typhonjs-utils/file-util';

import { CardDB }             from '#scrydex/data/db';
import { KindSortOrder }      from '#scrydex/data/sort';

import type { BasicLogger }   from "@typhonjs-utils/logger-color";

/**
 * `find` is a local CLI command that isn't a part of the general SDK due to it primarily being an informational /
 * logged only output.
 *
 * @param config -
 */
export async function find(config: { path: string, filter: CardDB.Options.CardFilter, logger: BasicLogger }):
 Promise<void>
{
   const logger = config.logger;

   let collections: CardDB.Stream.Reader[];

   if (isFile(config.path))
   {
      logger.info(`Attempting to load Scrydex CardDB: ${config.path}`);

      const singleCollection = await CardDB.load({ filepath: config.path });

      if (!singleCollection)
      {
         logger.error(`No card collection found.`);
         return;
      }

      collections = [singleCollection];
   }
   else
   {
      logger.info(`Attempting to find sorted Scrydex CardDBs in directory: ${config.path}`);

      collections = await CardDB.loadAll({
         dirpath: config.path,
         type: new Set(['sorted', 'sorted_format']),
         walk: true
      });

      if (collections.length === 0)
      {
         logger.info(`No 'sorted' or 'sorted_format' card collections found.`);
         return;
      }
   }

   logger.info(`Searching ${collections.length} card collections: ${
    collections.map((entry) => entry.meta.name).join(', ')}`);

   logger.verbose(``);

   for (const collection of collections)
   {
      logger.verbose(`${collection.meta.name} - ${collection.filepath}`);
   }

   const hasFilters = CardDB.CardFilter.hasFilterChecks(config.filter);

   if (hasFilters)
   {
      logger.verbose(``);
      logger.verbose(`[Filter Options]`);
      logger.verbose(`----------------------`);

      if (logger) { CardDB.CardFilter.logConfig(config.filter, logger, 'verbose'); }

      logger.verbose(`----------------------`);
   }

   for (const collection of collections)
   {
      for await (const card of collection.asStream({ filter: config.filter }))
      {
         const gameFormat = collection.meta.type === 'sorted_format' ? collection.meta.format : void 0;

         const isInDeck = collection.isCardGroup(card, 'decks') ? `; In Deck: ${card.filename}` : '';
         const isInExternal = collection.isCardGroup(card, 'external') ? `; In External: ${card.filename}` : ''
         const isProxy = collection.isCardGroup(card, 'proxy') ? `; (Is Proxy)` : ''

         logger.info(`Name: ${card.name}; Quantity: ${card.quantity}; Collection: ${collection.meta.name}; Rarity: ${
          KindSortOrder.rarity(card, gameFormat)}; Category: ${KindSortOrder.categoryName(card)}${isInDeck}${isInExternal}${
           isProxy}`);
      }
   }
}
