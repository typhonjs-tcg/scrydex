import fs               from 'node:fs';
import chain            from 'stream-chain';
import parser           from 'stream-json';
import StreamArray      from 'stream-json/streamers/StreamArray.js';

import {
   logger,
   stringifyCompact }   from '#util';

export class ScryfallDB
{
   /**
    * @param {import('#types-command').ConfigConvert}   config -
    *
    * @param {Collection}  collection -
    *
    * @returns {Promise<void>}
    */
   static async exportCollection(config, collection)
   {
      /** @type {import('#types').Card[]} */
      const outputDB = [];

      /** @type {Map<string, { rarity: string, released_at: number }>} */
      const oracleRarityMap = new Map();

      const pipeline = chain([
         fs.createReadStream(config.db),
         parser(),
         new StreamArray()
      ]);

      let totalQuantity = 0;

      for await (const { value: scryCard } of pipeline)
      {
         if (scryCard.object !== 'card') { continue; }

         // Save original rarity for earliest oracle ID.
         const oracle_id = scryCard.oracle_id;
         if (typeof oracle_id === 'string' && (!oracleRarityMap.has(oracle_id) || (oracleRarityMap.has(oracle_id) &&
          Date.parse(scryCard.released_at) < oracleRarityMap.get(oracle_id).released_at)))
         {
            oracleRarityMap.set(oracle_id, { rarity: scryCard.rarity, released_at: Date.parse(scryCard.released_at) });
         }

         const csvCards = collection.get(scryCard.id);

         if (!csvCards) { continue; }

         logger.verbose(`Processing: ${scryCard.name}`);

         for (const csvCard of csvCards)
         {
            /** @type {import('#types').Card} */
            const card = {
               object: 'card',
               name: scryCard.printed_name ?? scryCard.name,
               lang: scryCard.lang,
               rarity: scryCard.rarity,
               quantity: csvCard.quantity,
               foil: csvCard.foil,
               filename: csvCard.filename,
               set: scryCard.set,
               set_name: scryCard.set_name,
               set_type: scryCard.set_type,
               collector_number: scryCard.collector_number,
               reserved: scryCard.reserved,
               game_changer: scryCard.game_changer,
               keywords: scryCard.keywords,
               type_line: scryCard.type_line,
               mana_cost: scryCard.mana_cost,
               cmc: scryCard.cmc,
               colors: scryCard.colors,
               color_identity: scryCard.color_identity,
               released_at: scryCard.released_at,
               oracle_text: scryCard.oracle_text,
               produced_mana: scryCard.produced_mana,
               legalities: scryCard.legalities ?? {},
               oracle_id: scryCard.oracle_id,
               scryfall_id: csvCard.scryfall_id,
               scryfall_uri: scryCard.scryfall_uri
            };

            totalQuantity += card.quantity;

            outputDB.push(card);
         }

         collection.delete(scryCard.id);
      }

      // Second pass to set original / first print rarity.
      for (const card of outputDB)
      {
         card.orig_rarity = oracleRarityMap.has(card.oracle_id) ? oracleRarityMap.get(card.oracle_id).rarity :
          card.rarity;
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
