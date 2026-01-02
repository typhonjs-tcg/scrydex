import {
   CardDBStore,
   CardFilter }            from '#scrydex/data';

import { logger }          from '#scrydex/util';

import type { ConfigCmd }  from '#scrydex/commands';
import type { Card }       from '#types';

export async function filter(config: ConfigCmd.Filter): Promise<void>
{
   logger.info(`Filtering Scrydex CardDB: ${config.input}`);

   logger.verbose(`[Filter Options]`);
   logger.verbose(`----------------------`);

   CardFilter.logConfig(config.filter, 'verbose');

   logger.verbose(`----------------------`);

   const cards = await CardDBStore.load({ filepath: config.input });

   const outputDB: Card[] = [];

   let totalUnique = 0;

   for await (const card of cards.asStream())
   {
      totalUnique++;

      // Independent filter checks.
      if (!CardFilter.test(card, config.filter)) { continue; }

      outputDB.push(card);
   }

   if (outputDB.length > 0)
   {
      CardDBStore.save({
         filepath: config.output,
         cards: outputDB,
         meta: cards.meta
      });

      logger.info(`Finished filtering Scrydex CardDB: ${config.output}`);
      logger.info(`Filtered ${outputDB.length} / ${totalUnique} unique card entries.`);
   }
   else
   {
      logger.warn(`No output DB file to write.`);
   }
}
