export class SortedFormat
{
   /**
    * @type {object[]}
    */
   #cards;

   /**
    * @type {string}
    */
   #format;

   /**
    * @param {string} format -
    *
    * @param {object[]} cards -
    */
   constructor(format, cards)
   {
      this.#cards = cards;
      this.#format = format;
   }

   get cards()
   {
      return this.#cards;
   }

   get format()
   {
      return this.#format;
   }
}
