import fs                  from 'node:fs';
import chain               from 'stream-chain';
import parser              from 'stream-json';
import StreamArray         from 'stream-json/streamers/StreamArray.js';

import { Collection }      from '#data';

import { logger }          from '#util';

/**
 * Converts the ManaBox CSV collection output to Scryfall card data.
 *
 * @param {object}   config - Config options.
 *
 * @returns {Promise<void>}
 */
export async function convert(config)
{
   const outputDB = [];

   const collection = await Collection.load(config.input);

// -----

   const pipeline = chain([
      fs.createReadStream(config.db),
      parser(),
      new StreamArray()
   ]);

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

         outputDB.push(card);
      }

      collection.delete(value.id);
   }

   logger.info(`Finished processing ${outputDB.length} entries.`);

   if (collection.size !== 0)
   {
      logger.warn(`Remaining collection / card map unprocessed: ${collection.size + 1}`);
   }

   if (outputDB.length > 0)
   {
      fs.writeFileSync(config.output, typeof config.indent === 'number' ?
       JSON.stringify(outputDB, null, config.indent) : JSON.stringify(outputDB), 'utf-8');
   }
   else
   {
      logger.warn(`No output DB file to write.`);
   }
}

