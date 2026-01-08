import { CardDB }          from '#scrydex/data/db';
import { CardFilter }      from '#scrydex/data/db/util';

import type { ConfigCmd }  from '../types-command';

export async function filter(config: ConfigCmd.Filter): Promise<void>
{
   const logger = config.logger;

   logger?.info(`Filtering Scrydex CardDB: ${config.input}`);

   logger?.verbose(`[Filter Options]`);
   logger?.verbose(`----------------------`);

   if (logger) { CardFilter.logConfig(config.filter, logger, 'verbose'); }

   logger?.verbose(`----------------------`);

   const cards = await CardDB.load({ filepath: config.input });

   const outputDB: CardDB.Data.Card[] = [];

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
      CardDB.save({
         filepath: config.output,
         cards: outputDB,
         meta: cards.meta
      });

      logger?.info(`Finished filtering Scrydex CardDB: ${config.output}`);
      logger?.info(`Filtered ${outputDB.length} / ${totalUnique} unique card entries.`);
   }
   else
   {
      logger?.warn(`No output DB file to write.`);
   }
}
