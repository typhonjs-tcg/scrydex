import {
   CardDBStore, CardFilter,
   validLegality
} from '#data';

import { logger }             from '#util';

import type { Card }          from '#types';
import type { ConfigFilter }  from '#types-command';

export async function filter(config: ConfigFilter): Promise<void>
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
