import fs               from 'node:fs';
import chain            from 'stream-chain';
import parser           from 'stream-json';
import StreamArray      from 'stream-json/streamers/StreamArray.js';

import {
   logger,
   stringifyCompact }   from '#util';
import csv from "csv-parser";

export class ScryfallDB
{
   /**
    * @param {object}   config -
    *
    * @param {Collection}  collection -
    *
    * @returns {Promise<void>}
    */
   static async exportCollection(config, collection)
   {
      /**
       * @type {import('#types').Card[]}
       */
      const outputDB = [];

      const pipeline = chain([
         fs.createReadStream(config.db),
         parser(),
         new StreamArray()
      ]);

      let totalQuantity = 0;

      for await (const { value } of pipeline)
      {
         if (value.object !== 'card') { continue; }

         const csvCards = collection.get(value.id);

         if (!csvCards) { continue; }

         logger.verbose(`Processing: ${value.name}`);

         for (const csvCard of csvCards)
         {
            /** @type {import('#types').Card} */
            const card = {
               object: 'card',
               name: value.printed_name ?? value.name,
               lang: value.lang,
               rarity: value.rarity,
               quantity: csvCard.quantity,
               set: value.set,
               set_name: value.set_name,
               set_type: value.set_type,
               collector_number: value.collector_number,
               reserved: value.reserved,
               game_changer: value.game_changer,
               keywords: value.keywords,
               type_line: value.type_line,
               mana_cost: value.mana_cost,
               cmc: value.cmc,
               colors: value.colors,
               color_identity: value.color_identity,
               released_at: value.released_at,
               oracle_text: value.oracle_text,
               produced_mana: value.produced_mana,
               legalities: value.legalities ?? {},
               scryfall_id: csvCard.scryfall_id,
            };

            totalQuantity += card.quantity;

            outputDB.push(card);
         }

         collection.delete(value.id);
      }

      logger.info(`Finished processing ${outputDB.length} unique cards / total quantity: ${totalQuantity}`);

      if (collection.size !== 0)
      {
         logger.warn(`Remaining collection / card map unprocessed: ${collection.size}`);
         for (const card of collection.values())
         {
            logger.warn(`Name: ${card.name ?? '<UNKNOWN>'}; Scryfall ID: ${
             card.scryfall_id ?? '<UNKNOWN>'}; Filename: ${card.filename ?? '<UNKNOWN>'}`);
         }
      }

      if (outputDB.length > 0)
      {
         if (typeof config.compact === 'boolean' && config.compact)
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
}
