import fs               from 'node:fs';
import chain            from 'stream-chain';
import parser           from 'stream-json';
import StreamArray      from 'stream-json/streamers/StreamArray.js';

import {
   logger,
   stringifyCompact }   from '#util';

import {
   excludedSetsRecentRarity,
   excludedSetTypesRecentRarity,
   TypeLineParse }      from '#data';

import type {
   Collection
} from '#data';

import type {
   Card } from "#types";

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

      /**
       * Tracks original / earliest rarity for same printings. This may be used when sorting older formats like
       * `premodern`.
       *
       * @type {Map<string, { rarity: string, released_at: number, set_name: string }>}
       */
      const originalRarityMap = new Map();

      /**
       * Tracks recent / latest rarity for same printings. This may be used when sorting cards by more modern formats.
       *
       * @type {Map<string, { rarity: string, released_at: number, set_name: string }>}
       */
      const recentRarityMap = new Map();

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

         if (typeof oracle_id === 'string')
         {
            // Track lowest / original rarity for unique card printing.
            if (!excludedSetTypesRecentRarity.has(scryCard.set_type) && !excludedSetsRecentRarity.has(scryCard.set) &&
             scryCard.rarity !== 'special' && (!originalRarityMap.has(oracle_id) || (originalRarityMap.has(oracle_id) &&
              Date.parse(scryCard.released_at) < originalRarityMap.get(oracle_id).released_at)))
            {
               originalRarityMap.set(oracle_id, {
                  rarity: scryCard.rarity,
                  released_at: Date.parse(scryCard.released_at),
                  set_name: scryCard.set_name
               });
           }

            // Track most recent rarity for unique card printing that isn't in a special set, Summer Magic, rarity of
            // `special` and is more recent printing.
            if (!excludedSetTypesRecentRarity.has(scryCard.set_type) && !excludedSetsRecentRarity.has(scryCard.set) &&
             scryCard.rarity !== 'special' && (!recentRarityMap.has(oracle_id) ||
              (recentRarityMap.has(oracle_id) && Date.parse(scryCard.released_at) >
               recentRarityMap.get(oracle_id).released_at)))
            {
               recentRarityMap.set(oracle_id, {
                  rarity: scryCard.rarity,
                  released_at: Date.parse(scryCard.released_at),
                  set_name: scryCard.set_name
               });
            }
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
               type: TypeLineParse.resolve(scryCard.type_line),
               rarity: scryCard.rarity,
               quantity: csvCard.quantity,
               filename: csvCard.filename,
               set: scryCard.set,
               set_name: scryCard.set_name,
               set_type: scryCard.set_type,
               collector_number: scryCard.collector_number,
               cmc: scryCard.cmc,
               colors: scryCard.colors,
               color_identity: scryCard.color_identity,
               foil: csvCard.foil,
               game_changer: scryCard.game_changer,
               keywords: scryCard.keywords,
               reserved: scryCard.reserved,
               mana_cost: scryCard.mana_cost,
               oracle_text: scryCard.oracle_text,
               produced_mana: scryCard.produced_mana,
               released_at: scryCard.released_at,
               type_line: scryCard.type_line,
               legalities: scryCard.legalities ?? {},
               scryfall_uri: scryCard.scryfall_uri,
               oracle_id: scryCard.oracle_id,
               scryfall_id: csvCard.scryfall_id
            };

            totalQuantity += card.quantity;

            outputDB.push(card);
         }

         collection.delete(scryCard.id);
      }

      /**
       * Old school rarity change cut-off.
       *
       * @type {number}
       */
      const oldschoolCutoff = Date.parse('2003-06-01');

      /**
       * Card name map that changed rarity before Mirrodin block.
       *
       * @type {Map<string, ({
       *    orig_rarity: string,
       *    orig_set_name: string,
       *    recent_rarity: string,
       *    recent_set_name: string
       * })>}
       */
      const rarityChangeMap = new Map();

      // Second pass to set original / first print rarity.
      for (const card of outputDB)
      {
         const oracleId = card.oracle_id;

         card.rarity_orig = originalRarityMap.has(oracleId) ? originalRarityMap.get(oracleId).rarity : card.rarity;

         if (recentRarityMap.has(oracleId))
         {
            card.rarity_recent = recentRarityMap.get(oracleId).rarity;

            if (recentRarityMap.get(oracleId).released_at < oldschoolCutoff && card.rarity_recent !== card.rarity_orig)
            {
               if (!rarityChangeMap.has(card.name))
               {
                  rarityChangeMap.set(card.name, {
                     orig_rarity: card.rarity_orig,
                     orig_set_name: originalRarityMap.get(oracleId).set_name ?? '<Unknown>',
                     recent_rarity: card.rarity_recent,
                     recent_set_name: recentRarityMap.get(oracleId).set_name ?? '<Unknown>'
                  });
               }

               card.rarity_orig = card.rarity_recent;
            }
         }
         else
         {
            card.rarity_recent = card.rarity;
         }
      }

      if (rarityChangeMap.size > 0)
      {
         logger.verbose(`--------------------`);

         logger.verbose(`Various cards printed before June 2003 changed rarity between editions without further ` +
         `movement in future years.`);

         logger.verbose(`To preserve historical identity the most recent rarity among pre-Mirrodin block ` +
          `printings are utilized.`);

         logger.verbose(`--------------------`);

         const keys = [...rarityChangeMap.keys()].sort((a, b) => a.localeCompare(b));

         for (const key of keys)
         {
            const changeData = rarityChangeMap.get(key);

            logger.verbose(`[Rarity Change]: ${key} - earlier print (${changeData.orig_set_name}) was '${
             changeData.orig_rarity}'; later print (${changeData.recent_set_name}) is '${changeData.recent_rarity}'.`);
         }
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
