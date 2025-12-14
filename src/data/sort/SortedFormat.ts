import { SortedRarity } from './SortedRarity';

import { logger }       from '#util';

import type {
   CardSorted,
   ConfigSort }         from '#types-command';

export class SortedFormat
{
   readonly #cards: CardSorted[];

   readonly #format: string;

   #rarity: Map<string, SortedRarity>;

   /**
    * @param config -
    *
    * @param format -
    *
    * @param cards -
    */
   constructor(config: ConfigSort, format: string, cards: CardSorted[])
   {
      this.#cards = cards;
      this.#format = format;

      this.#rarity = new Map();

      if (cards.length) { this.#sortRarity(config, cards); }
   }

   /**
    * @returns All cards for the format.
    */
   get cards(): CardSorted[]
   {
      return this.#cards;
   }

   /**
    * @returns Format name / ID.
    */
   get name(): string
   {
      return this.#format;
   }

   /**
    * @returns Count of cards in this format.
    */
   get size(): number
   {
      return this.#cards.length;
   }

   /**
    * Calculate any `mark` merging.
    *
    * @param config -
    */
   calculateMarked(config: ConfigSort): boolean
   {
      return this.#cards.length ? this.#calculateMarked(config) : false;
   }

   /**
    * @returns Entry iterator of rarity groups.
    */
   entries(): MapIterator<[string, SortedRarity]>
   {
      return this.#rarity.entries();
   }

   /**
    * @returns Iterator of rarity groups.
    */
   values(): MapIterator<SortedRarity>
   {
      return this.#rarity.values();
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param config -
    *
    * @returns Whether any cards were marked for this format.
    */
   #calculateMarked(config: ConfigSort): boolean
   {
      /**
       * Tracks if any cards were marked in this format.
       */
      let result = false;

      /**
       * Scryfall oracle ID map.
       */
      const oracleMap: Map<string, { count: number }> = new Map();

      /**
       * Scryfall card ID map.
       */
      const idMap: Map<string, { count: number }> = new Map();

      const mark = config.mark;

      for (const card of this.#cards)
      {
         // Skip if is part of `marked` filenames.
         if (mark.has(card.filename)) { continue; }

         const existingOracleCard = oracleMap.get(card.oracle_id);

         if (existingOracleCard)
         {
            existingOracleCard.count += card.quantity;
         }
         else
         {
            oracleMap.set(card.oracle_id, { count: card.quantity });
         }

         const existingIDCard = idMap.get(card.scryfall_id);

         if (existingIDCard)
         {
            existingIDCard.count += card.quantity;
         }
         else
         {
            idMap.set(card.scryfall_id, { count: card.quantity });
         }
      }

      for (const card of this.#cards)
      {
         if (!mark.has(card.filename)) { continue; }

         if (!oracleMap.has(card.oracle_id))
         {
            result = true;
            card.mark = 'ok';
            continue;
         }

         const existingIDCard = idMap.get(card.scryfall_id);

         if (existingIDCard && existingIDCard.count >= 4)
         {
            result = true;
            card.mark = 'error';
            continue;
         }

         if (oracleMap.has(card.oracle_id))
         {
            result = true;
            card.mark = 'warning';
         }
      }

      return result;
   }

   /**
    * @param config -
    *
    * @param cards -
    */
   #sortRarity(config: ConfigSort, cards: CardSorted[])
   {
      for (const card of cards)
      {
         // For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
         // recent rarity. Fallback if necessary to the actual card rarity.
         const rarity = (this.#format === 'oldschool' || this.#format === 'premodern' ? card.rarity_orig :
          card.rarity_recent) ?? card.rarity;

         let sortRarity = this.#rarity.has(rarity) ? this.#rarity.get(rarity) : void 0;
         if (!sortRarity)
         {
            sortRarity = new SortedRarity(rarity);
            this.#rarity.set(rarity, sortRarity);
         }

         sortRarity.add(card);
      }

      for (const sortRarity of this.#rarity.values())
      {
         sortRarity.sortAlpha();
      }

      if (config.sortByType)
      {
         for (const sortRarity of this.#rarity.values())
         {
            sortRarity.sortType();
         }
      }

      logger.verbose(`Sorting format '${this.name}' - unique card count: ${cards.length}`);
   }
}
