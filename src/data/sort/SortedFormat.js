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
   get format()
   {
      return this.#format;
   }
}
