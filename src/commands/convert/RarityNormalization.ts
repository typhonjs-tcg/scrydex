import { ScryfallData }             from '#scrydex/data/scryfall';

import type { CardDB }              from '#scrydex/data/db';
import type { ImportCollection }    from '#scrydex/data/import';
import type { ScryfallDB }          from '#scrydex/data/scryfall';

import type { ConfigCmd }           from '../types-command';

/**
 * Computes normalized card rarity keyed by `oracle_id`.
 *
 * This class intentionally performs a full Scryfall DB scan in {@link RarityNormalization.scanForOracleID} and
 * retains only minimal / primitive rarity data.
 */
export class RarityNormalization
{
   /**
    * Old school rarity change cut-off.
    */
   #oldschoolCutoff = Date.parse('2003-06-01');

   /**
    * Stores all oracle IDs for cards in the collection during the first pass.
    */
   #oracleIDSet: Set<string> = new Set();

   /**
    * Tracks original / earliest & most recent / latest rarity for same printings. This may be used when sorting older
    * formats like `premodern`.
    */
   #oracleRarityMap: Map<string, OracleRarityInfo> = new Map();

   /**
    * Stores the rarity change over the second pass of collection cards.
    */
   #rarityChangeMap: Map<string, {
      orig_rarity: string,
      orig_set: string,
      recent_rarity: string,
      recent_set: string
   }> = new Map();

   /**
    * Stores set names seen by set code for later logging.
    */
   #raritySetNameMap: Map<string, string> = new Map();

   /**
    * Stores the first card `rarity` character to the actual rarity name.
    */
   #rarityCodeMap: Map<string | undefined, string> = new Map();

   /**
    * Final logging and cleanup of data associated with rarity normalization.
    */
   logChangesAndCleanup(config: ConfigCmd.Convert)
   {
      const logger = config.logger;

      if (this.#rarityChangeMap.size > 0)
      {
         logger?.verbose(`--------------------`);

         logger?.verbose(`Various cards printed before June 2003 changed rarity between editions without ` +
         `further movement in future years.`);

         logger?.verbose(`To preserve historical identity the most recent rarity among pre-Mirrodin block ` +
          `printings are utilized as the original rarity.`);

         logger?.verbose(`--------------------`);

         const keys = [...this.#rarityChangeMap.keys()].sort((a, b) => a.localeCompare(b));

         for (const key of keys)
         {
            const changeData = this.#rarityChangeMap.get(key);
            if (!changeData) { continue; }

            logger?.verbose(
             `[Rarity Change]: ${key} - earlier print (${this.#raritySetNameMap.get(changeData.orig_set)}) was '${
              changeData.orig_rarity}'; later print (${this.#raritySetNameMap.get(changeData.recent_set)}) is '${
               changeData.recent_rarity}'.`);
         }
      }

      this.#oracleIDSet.clear();
      this.#oracleRarityMap.clear();
      this.#rarityChangeMap.clear();
      this.#rarityCodeMap.clear();
      this.#raritySetNameMap.clear();
   }

   /**
    * Performs a streaming pass over the Scryfall DB to collect oracle IDs for all cards in the CSV collection.
    *
    * @param config -
    *
    * @param collection -
    */
   async scanForOracleID(config: ConfigCmd.Convert, collection: ImportCollection, scryfallDB: ScryfallDB.Stream.Reader)
   {
      const logger = config.logger;

      logger?.info(
       `Scanning Scryfall database to identify oracle IDs used by cards in the collection - this may take a moment...`);

      for await (const scryCard of scryfallDB.asStream())
      {
         if (scryCard?.object !== 'card') { continue; }

         if (scryCard.lang === 'en' && typeof scryCard.oracle_id === 'string' && collection.has(scryCard.id))
         {
            this.#oracleIDSet.add(scryCard.oracle_id);
         }
      }

      logger?.info(`Oracle ID scan complete.`);
   }

   /**
    * Tracks original / earliest and latest rarity for any card that shares an oracle ID in the CSV collection being
    * processed.
    *
    * @param scryCard - Scryfall card data.
    */
   trackRarity(scryCard: Record<string, any>)
   {
      const oracle_id = scryCard.oracle_id;

      // Only update if the card is in English and the oracle
      if (scryCard.lang !== 'en' || typeof oracle_id !== 'string' || !this.#oracleIDSet.has(oracle_id)) { return; }

      //  Exclude special / promo sets so normalized rarity reflects tournament-legal printings.
      if (ScryfallData.isExcludedSetType(scryCard.set_type) || ScryfallData.isExcludedSet(scryCard.set) ||
       scryCard.rarity === 'special')
      {
         return;
      }

      const rarityChar = scryCard.rarity[0];

      // Cache `rarity` to first character of rarity.
      if (!this.#rarityCodeMap.has(rarityChar)) { this.#rarityCodeMap.set(rarityChar, scryCard.rarity); }

      // Cache full set name to set code.
      if (!this.#raritySetNameMap.has(scryCard.set)) { this.#raritySetNameMap.set(scryCard.set, scryCard.set_name); }

      const releasedAt = Date.parse(scryCard.released_at);

      let info = this.#oracleRarityMap.get(oracle_id);
      if (!info)
      {
         info = { e: null, l: null };
         this.#oracleRarityMap.set(oracle_id, info);
      }

      // Earliest / original rarity.
      if (!info.e || releasedAt < info.e.ra) { info.e = { r: rarityChar, ra: releasedAt, s: scryCard.set }; }

      // Recent / latest rarity.
      if (!info.l || releasedAt > info.l.ra) { info.l = { r: rarityChar, ra: releasedAt, s: scryCard.set }; }
   }

   /**
    * Update any rarity changes to the given card.
    *
    * @param card -
    */
   updateRarity(card: CardDB.Data.Card)
   {
      const oracleId = card.oracle_id;

      const rarityInfo = this.#oracleRarityMap.get(oracleId);

      card.rarity_orig = this.#rarityCodeMap.get(rarityInfo?.e?.r) ?? card.rarity;

      if (rarityInfo?.l)
      {
         card.rarity_recent = this.#rarityCodeMap.get(rarityInfo?.l.r) ?? card.rarity;

         // Special case for pre-Mirrodin block cards when the latest rarity
         if (rarityInfo.l.ra < this.#oldschoolCutoff && card.rarity_recent !== card.rarity_orig)
         {
            if (!this.#rarityChangeMap.has(card.name))
            {
               this.#rarityChangeMap.set(card.name, {
                  orig_rarity: card.rarity_orig,
                  orig_set: rarityInfo?.e?.s ?? '<Unknown>',
                  recent_rarity: card.rarity_recent,
                  recent_set: rarityInfo?.l?.s ?? '<Unknown>'
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
}

/**
 * Data used in rarity normalization. Stores original / earliest rarity and the most recent / latest rarity.
 *
 * - `r` -> `rarity` - First character of `rarity`
 * - `ra` -> `released_at` - Date
 * - `s` - > `set` - Set code
 */
interface OracleRarityInfo
{
   /** Earliest rarity. */
   e: { r: string; ra: number; s: string } | null;

   /** Latest rarity. */
   l: { r: string; ra: number; s: string } | null;
}
