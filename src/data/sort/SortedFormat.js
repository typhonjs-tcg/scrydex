import { SortedRarity } from './SortedRarity.js';

import { logger }       from '#util';

export class SortedFormat
{
   /**
    * @type {import('#types').Card[]}
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
    * @param {string} format -
    *
    * @param {import('#types').Card[]} cards -
    */
   constructor(format, cards)
   {
      this.#cards = cards;
      this.#format = format;

      this.#rarity = new Map();

      this.#sortRarity(cards);
   }

   /**
    * @returns {import('#types').Card[]} All cards for the format.
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
    * @param {import('#types').Card[]} cards -
    */
   #sortRarity(cards)
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

      logger.verbose(`Sorting format '${this.name}' - card count: ${this.#cards.length}`);
   }
}
