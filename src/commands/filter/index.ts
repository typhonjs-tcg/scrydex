import {
   CardDB,
   validLegality }            from '#data';

import { logger }             from '#util';

import type { Card }          from '#types';
import type { ConfigFilter }  from '#types-command';

export async function filter(config: ConfigFilter): Promise<void>
{
   logger.info(`Filtering Scryfall card collection: ${config.input}`);

   if (config.border)
   {
      logger.info(`Card borders: ${[...config.border].join(' or ')}`);
   }

   if (config.colorIdentity)
   {
      logger.info(`Color Identity: ${[...config.colorIdentity].join(', ')}`);
   }

   if (config.formats?.length)
   {
      logger.info(`Formats: ${config.formats.join(' and ')}`);
   }

   const cards = await CardDB.loadStream({ filepath: config.input });

   const outputDB: Card[] = [];

   let totalUnique = 0;

   for await (const card of cards.asStream())
   {
      if (card.object !== 'card') { continue; }

      totalUnique++;

      if (config.border && !config.border.has(card.border_color)) { continue; }

      if (config.colorIdentity && Array.isArray(card.color_identity))
      {
         if (!config.colorIdentity.isSupersetOf(new Set(card.color_identity))) { continue; }
      }

      if (config.formats?.length)
      {
         let valid = true;

         for (const format of config.formats)
         {
            if (!validLegality.has(card.legalities?.[format])) { valid = false; }
         }

         if (!valid) { continue; }
      }

      outputDB.push(card);
   }

   if (outputDB.length > 0)
   {
      CardDB.save({
         filepath: config.output,
         type: cards.type,
         name: cards.name,
         cards: outputDB
      });

      logger.info(`Finished filtering Scryfall card collection: ${config.output}`);
      logger.info(`Filtered ${outputDB.length} / ${totalUnique} unique cards.`);
   }
   else
   {
      logger.warn(`No output DB file to write.`);
   }
}
