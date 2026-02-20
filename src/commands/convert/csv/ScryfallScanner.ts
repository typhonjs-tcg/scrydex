import { CardDB }                from '#scrydex/data/db';
import { ScryfallDB }            from '#scrydex/data/scryfall';

import { RarityNormalization }   from '../RarityNormalization';
import { ParseCardFaces }        from '../ParseCardFaces';
import { ParseTypeLine }         from '../ParseTypeLine';

import type {
   CSVCard,
   CSVCollection }               from '#scrydex/data/import';

import type { ConfigCmd }        from '../../types-command';

/**
 * Provides thorough resolution and normalization of CSV collection cards with multiple streaming passes over the
 * Scryfall DB.
 */
export abstract class ScryfallScanner
{
   /* v8 ignore next 1 */
   private constructor() {}

   /**
    * @param config -
    *
    * @param collection -
    */
   static async exportCollection(config: ConfigCmd.Convert, collection: CSVCollection): Promise<void>
   {
      const logger = config.logger;

      const outputDB: CardDB.Data.Card[] = [];

      const scryfallDB = await ScryfallDB.load({ filepath: config.db });

      const rarityNormalization = new RarityNormalization();

      // This is a first streaming pass across the Scryfall DB collecting the `oracle_id` for cards in the collection.
      await rarityNormalization.scanForOracleID(config, collection, scryfallDB);

      logger?.info(`Building Scrydex card database - this may take a moment...`);

      let totalQuantity = 0;

      for await (const scryCard of scryfallDB.asStream())
      {
         /* v8 ignore next 1 */ // Sanity check
         if (scryCard?.object !== 'card') { continue; }

         rarityNormalization.trackRarity(scryCard);

         const csvCards = collection.get(scryCard.id);

         if (!csvCards) { continue; }

         logger?.verbose(`Processing: ${scryCard.name}`);

         const card_faces = ParseCardFaces.resolve(scryCard.card_faces);
         const type = ParseTypeLine.resolve(scryCard);

         // Properties used to remove semantic duplication in `user_tags`. -------------------------------------------

         /* v8 ignore next 2 */ // Sanity check; `keywords` should always be defined.
         const keywordSet = Array.isArray(scryCard.keywords) ? new Set(scryCard.keywords.map(k => k.toLowerCase())) :
          new Set();

         const typeCheck = type.toLowerCase();

         // Resolve all CSV cards for the given Scryfall card. -------------------------------------------------------

         for (const csvCard of csvCards)
         {
            const isGroupProxy = collection.isCardGroup(csvCard, 'proxy');

            // Remove any user tags that duplicate normalized type line or existing Scryfall keyword.
            const filteredUserTags = csvCard.user_tags.filter((tag) => !keywordSet.has(tag) && tag !== typeCheck);

            const card: CardDB.Data.Card = {
               object: 'card',
               name: scryCard.name,
               norm_type: type,
               quantity: csvCard.quantity,
               filename: csvCard.filename,
               rarity: scryCard.rarity,
               set: scryCard.set,
               set_name: scryCard.set_name,
               set_type: scryCard.set_type,
               collector_number: scryCard.collector_number,
               lang: scryCard.lang,
               user_lang: csvCard.user_lang,
               user_tags: filteredUserTags,
               cmc: scryCard.cmc,
               colors: scryCard.colors,
               color_identity: scryCard.color_identity,
               border_color: scryCard.border_color,
               cardmarket_id: scryCard.cardmarket_id,
               defense: scryCard.defense,
               edhrec_rank: scryCard.edhrec_rank,
               flavor_text: scryCard.flavor_text,
               finish: csvCard.finish,
               game_changer: scryCard.game_changer,
               games: scryCard.games,
               hand_modifier: scryCard.hand_modifier,
               highres_image: scryCard.highres_image,
               image_status: scryCard.image_status,
               keywords: scryCard.keywords,
               layout: scryCard.layout,
               life_modifier: scryCard.life_modifier,
               loyalty: scryCard.loyalty,
               reserved: scryCard.reserved,
               mana_cost: scryCard.mana_cost,
               mtgo_id: scryCard.mtgo_id,
               mtgo_foil_id: scryCard.mtgo_foil_id,
               oracle_text: scryCard.oracle_text,
               power: scryCard.power,
               price: isGroupProxy ? '0.00' : this.#priceLookup(scryCard, csvCard),
               produced_mana: scryCard.produced_mana,
               released_at: scryCard.released_at,
               toughness: scryCard.toughness,
               type_line: scryCard.type_line,
               printed_name: scryCard.printed_name,
               rarity_orig: scryCard.rarity,
               rarity_recent: scryCard.rarity,
               resource_id: scryCard.resource_id,
               security_stamp: scryCard.security_stamp,
               tcgplayer_id: scryCard.tcgplayer_id,
               tcgplayer_etched_id: scryCard.tcgplayer_etched_id,

               // The following may contain a lot of nested data and are reserved toward the end of the Card object.

               all_parts: scryCard.all_parts,
               card_faces,
               image_uris: scryCard.image_uris,
               rulings_uri: scryCard.rulings_uri,
               legalities: scryCard.legalities,
               scryfall_uri: scryCard.scryfall_uri,
               oracle_id: scryCard.oracle_id,
               scryfall_id: csvCard.scryfall_id,
               csv_extra: csvCard.csv_extra
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

      rarityNormalization.logChangesAndCleanup(config);

      logger?.info(`Finished processing ${outputDB.length} unique card entries / total quantity: ${totalQuantity}`);

      if (collection.size !== 0)
      {
         logger?.warn(`Remaining collection / card map unprocessed: ${collection.size}`);
         for (const card of collection.values())
         {
            logger?.warn(`Name: ${card.name ?? '<UNKNOWN>'}; Scryfall ID: ${
             card.scryfall_id ?? '<UNKNOWN>'}; Filename: ${card.filename ?? '<UNKNOWN>'}`);
         }
      }

      if (outputDB.length > 0)
      {
         await CardDB.save({
            cards: outputDB.sort((a, b) => a.name.localeCompare(b.name)),
            compress: config.compress,
            filepath: config.output,
            meta: { type: 'inventory', groups: collection.groups }
         });
      }
      else
      {
         logger?.warn(`No output DB file to write.`);
      }
   }

   // Internal implementation ----------------------------------------------------------------------------------------

   static #priceLookup(scryCard: Record<string, any>, csvCard: CSVCard): string | null
   {
      // Scryfall `prices` property.
      const index = csvCard.finish === 'normal' ? 'usd' : `usd_${csvCard.finish}`;

      return scryCard?.prices?.[index] ?? null;
   }
}
