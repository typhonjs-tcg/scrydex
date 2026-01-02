import { isFile }          from '@typhonjs-utils/file-util';

import {
   CardDBStore,
   CardFilter,
   SortOrder }             from '#data';

import { logger }          from '#util';

import type { CardStream } from '#data';
import type { ConfigFind } from '#types-command';

export async function find(config: ConfigFind)
{
   let collections: CardStream[];

   if (isFile(config.input))
   {
      logger.info(`Attempting to load Scrydex CardDB: ${config.input}`);

      const singleCollection = await CardDBStore.load({ filepath: config.input });

      if (!singleCollection)
      {
         logger.error(`No card collection found.`);
         return;
      }

      collections = [singleCollection];
   }
   else
   {
      logger.info(`Attempting to find sorted Scrydex CardDBs in directory: ${config.input}`);

      collections = await CardDBStore.loadAll({
         dirpath: config.input,
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

   const hasFilters = CardFilter.hasFilterChecks(config.filter);

   if (hasFilters)
   {
      logger.verbose(``);
      logger.verbose(`[Filter Options]`);
      logger.verbose(`----------------------`);

      CardFilter.logConfig(config.filter, 'verbose');

      logger.verbose(`----------------------`);
   }

   for (const collection of collections)
   {
      for await (const card of collection.asStream({ filter: config.filter }))
      {
         const gameFormat = collection.meta.type === 'sorted_format' ? collection.meta.format : void 0;

         const isInDeck = collection.isCardGroup(card, 'decks') ? `; In Deck: ${card.filename}` : '';
         const isInExternal = collection.isCardGroup(card, 'external') ? `; In External: ${card.filename}` : ''

         logger.info(`Name: ${card.name}; Quantity: ${card.quantity}; Collection: ${collection.meta.name}; Rarity: ${
          SortOrder.rarity(card, gameFormat)}; Category: ${SortOrder.categoryName(card)}${isInDeck}${isInExternal}`);
      }
   }
}
