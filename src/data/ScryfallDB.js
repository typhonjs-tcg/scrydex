import fs                  from 'node:fs';
import chain               from 'stream-chain';
import parser              from 'stream-json';
import StreamArray         from 'stream-json/streamers/StreamArray.js';

import { logger }          from '#util';

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

         const cards = collection.get(value.id);

         if (!cards) { continue; }

         logger.verbose(`Processing: ${value.name}`);

         for (const card of cards)
         {
            card.name = value.name;
            card.rarity = value.rarity;
            card.released_at = value.released_at;
            card.mana_cost = value.mana_cost;
            card.type_line = value.type_line;
            card.oracle_text = value.oracle_text;
            card.colors = value.colors;
            card.color_identity = value.color_identity;
            card.keywords = value.keywords;
            card.produced_mana = value.produced_mana;
            card.reserved = value.reserved;
            card.game_changer = value.game_changer;
            card.set = value.set;
            card.set_name = value.set_name;
            card.set_type = value.set_type;
            card.collector_number = value.collector_number;
            card.legalities = value.legalities ?? {};

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
            let output = `[\n`;
            for (let i = 0; i < outputDB.length; i++)
            {
               const notLast = i !== outputDB.length - 1;
               output += `  ${JSON.stringify(outputDB[i])}${notLast ? ',': ''}\n`;
            }
            output += `]\n`;

            fs.writeFileSync(config.output, output, 'utf-8');
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
