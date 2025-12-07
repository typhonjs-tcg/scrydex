import { SortedRarity } from './SortedRarity.js';

import { logger }       from '#util';

export class SortedFormat
{
   /**
    * @type {import('#types-command').CardSorted[]}
    */
   #cards;

   /**
    * @type {string}
    */
   #format;

   /**
    * @type {Map<string, SortedRarity>}
    */
   #rarity;

   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {string} format -
    *
    * @param {import('#types-command').CardSorted[]} cards -
    */
   constructor(config, format, cards)
   {
      this.#cards = cards;
      this.#format = format;

      this.#rarity = new Map();

      this.#sortRarity(config, cards);

      if (config.mark.size)
      {
         this.#calculateMarked(config, cards);
      }
   }

   /**
    * @returns {import('#types-command').CardSorted[]} All cards for the format.
    */
   get cards()
   {
      return this.#cards;
   }

   /**
    * @returns {string} Format name / ID.
    */
   get name()
   {
      return this.#format;
   }

   /**
    * @returns {number} Count of cards in this format.
    */
   get size()
   {
      return this.#cards.length;
   }

   /**
    * @returns {MapIterator<[string, SortedRarity]>} Rarity groups.
    */
   entries()
   {
      return this.#rarity.entries();
   }

   /**
    * @returns {MapIterator<SortedRarity>}
    */
   values()
   {
      return this.#rarity.values();
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {import('#types-command').CardSorted[]} cards -
    */
   #calculateMarked(config, cards)
   {
      /**
       * @type {Map<string, { count: number }>}
       */
      const oracleMap = new Map();

      /**
       * @type {Map<string, { count: number }>}
       */
      const idMap = new Map();

      const mark = config.mark;

      for (const card of cards)
      {
         // Skip marked filenames.
         if (mark.has(card.filename)) { continue; }

         if (oracleMap.has(card.oracle_id))
         {
            oracleMap.get(card.oracle_id).count += card.quantity;
         }
         else
         {
            oracleMap.set(card.oracle_id, { count: card.quantity });
         }

         if (idMap.has(card.scryfall_id))
         {
            idMap.get(card.scryfall_id).count += card.quantity;
         }
         else
         {
            idMap.set(card.scryfall_id, { count: card.quantity });
         }
      }

      for (const card of cards)
      {
         if (!mark.has(card.filename)) { continue; }

         if (!oracleMap.has(card.oracle_id))
         {
            card.mark = 'ok';
            continue;
         }

         if (idMap.has(card.scryfall_id) && idMap.get(card.scryfall_id).count >= 4)
         {
            card.mark = 'error';
            continue;
         }

         if (oracleMap.has(card.oracle_id))
         {
            card.mark = 'warning';
         }
      }
   }

   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {import('#types-command').CardSorted[]} cards -
    */
   #sortRarity(config, cards)
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

      logger.verbose(`Sorting format '${this.name}' - card count: ${this.#cards.length}`);
   }
}
