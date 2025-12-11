import fs                     from 'node:fs';
import chain                  from 'stream-chain';
import parser                 from 'stream-json';
import StreamArray            from 'stream-json/streamers/StreamArray.js';

import { validLegality }      from '#data';

import {
   logger,
   stringifyCompact }         from '#util';

import type { Card }          from '#types';
import type { ConfigFilter }  from '#types-command';

export async function filter(config: ConfigFilter): Promise<void>
{
   const pipeline = chain([
      fs.createReadStream(config.input),
      parser(),
      new StreamArray()
   ]);

   const outputDB: Card[] = [];

   for await (const { value: card } of pipeline)
   {
      if (card.object !== 'card') { continue; }

      if (config.formats.length)
      {
         let valid = true;

         for (const format of config.formats)
         {
            if (!validLegality.has(card.legalities?.[format])) { valid = false; }
         }

         if (!valid) { continue; }
      }

      if (config.colorIdentity && Array.isArray(card.color_identity))
      {
         if (!config.colorIdentity.isSupersetOf(new Set(card.color_identity))) { continue; }
      }

      outputDB.push(card);
   }

   if (outputDB.length > 0)
   {
      if (config.compact)
      {
         fs.writeFileSync(config.output, stringifyCompact(outputDB), 'utf-8');
      }
      else
      {
         fs.writeFileSync(config.output, typeof config.indent === 'number' ?
          JSON.stringify(outputDB, null, config.indent) : JSON.stringify(outputDB), 'utf-8');
      }
   }
   else
   {
      logger.warn(`No output DB file to write.`);
   }
}
