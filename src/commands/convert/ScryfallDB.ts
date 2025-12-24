import fs                        from 'node:fs';
import chain                     from 'stream-chain';
import parser                    from 'stream-json';
import { streamArray }           from 'stream-json/streamers/StreamArray';

import { RarityNormalization }   from './RarityNormalization';
import { ParseCardFaces }        from './ParseCardFaces';
import { ParseTypeLine }         from './ParseTypeLine';

import { CardDBStore }           from '#data';

import { logger }                from '#util';

import type { CSVCollection }    from '#data';
import type {Card, CardDBMetadataGroups, CSVCard} from '#types';
import type { ConfigConvert }    from '#types-command';

/**
 * Provides thorough resolution and normalization of CSV collection cards with multiple streaming passes over the
 * Scryfall DB.
 */
export class ScryfallDB
{
   /**
    * @param config -
    *
    * @param collection -
    */
   static async exportCollection(config: ConfigConvert, collection: CSVCollection): Promise<void>
   {
      const outputDB: Card[] = [];

      const rarityNormalization = new RarityNormalization();

      // This is a first streaming pass across the Scryfall DB collecting the `oracle_id` for cards in the collection.
      await rarityNormalization.scanForOracleID(config, collection);

      logger.info(`Building Scrydex card database - this may take a moment...`);

      const pipeline = chain([
         fs.createReadStream(config.db),
         parser(),
         streamArray()
      ]);

      let totalQuantity = 0;

      for await (const { value: scryCard } of pipeline)
      {
         if (scryCard?.object !== 'card') { continue; }

         rarityNormalization.trackRarity(scryCard);

         const csvCards = collection.get(scryCard.id);

         if (!csvCards) { continue; }

         logger.verbose(`Processing: ${scryCard.name}`);

         for (const csvCard of csvCards)
         {
            const card: Card = {
               object: 'card',
               name: scryCard.name,
               type: ParseTypeLine.resolve(scryCard),
               quantity: csvCard.quantity,
               filename: csvCard.filename,
               rarity: scryCard.rarity,
               set: scryCard.set,
               set_name: scryCard.set_name,
               set_type: scryCard.set_type,
               collector_number: scryCard.collector_number,
               lang: scryCard.lang,
               lang_csv: csvCard.lang_csv,
               cmc: scryCard.cmc,
               colors: scryCard.colors,
               color_identity: scryCard.color_identity,
               border_color: scryCard.border_color,
               defense: scryCard.defense,
               foil: csvCard.foil,
               game_changer: scryCard.game_changer,
               keywords: scryCard.keywords,
               loyalty: scryCard.loyalty,
               reserved: scryCard.reserved,
               mana_cost: scryCard.mana_cost,
               oracle_text: scryCard.oracle_text,
               power: scryCard.power,
               price: this.#priceLookup(scryCard, csvCard),
               produced_mana: scryCard.produced_mana,
               released_at: scryCard.released_at,
               toughness: scryCard.toughness,
               type_line: scryCard.type_line,
               printed_name: scryCard.printed_name,
               rarity_orig: scryCard.rarity,
               rarity_recent: scryCard.rarity,
               card_faces: ParseCardFaces.resolve(scryCard.card_faces),
               legalities: scryCard.legalities ?? {},
               scryfall_uri: scryCard.scryfall_uri,
               oracle_id: scryCard.oracle_id,
               scryfall_id: csvCard.scryfall_id
            };

            totalQuantity += card.quantity;

            outputDB.push(card);
         }

         collection.delete(scryCard.id);

         // Early out if there are no more cards to match.
         if (collection.size === 0) { break; }
      }

      // Second pass to set original / first print rarity.
      for (const card of outputDB) { rarityNormalization.updateRarity(card); }

      rarityNormalization.logChangesAndCleanup();

      logger.info(`Finished processing ${outputDB.length} unique card entries / total quantity: ${totalQuantity}`);

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
         CardDBStore.save({
            filepath: config.output,
            cards: outputDB.sort((a, b) => a.name.localeCompare(b.name)),
            meta: { type: 'inventory', groups: collection.groups }
         });
      }
      else
      {
         logger.warn(`No output DB file to write.`);
      }
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   static #priceLookup(scryCard: Record<string, any>, csvCard: CSVCard): string | null
   {
      // Scryfall `prices` property.
      const index = csvCard.foil === 'normal' ? 'usd' : `usd_${csvCard.foil}`;

      return scryCard?.prices?.[index] ?? null;
   }
}
