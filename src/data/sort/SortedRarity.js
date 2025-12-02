export class SortedRarity
{
   /**
    * @type {Map<string, import('#types').Card[]>}
    */
   #categories = new Map();

   constructor()
   {
      this.#categories = new Map();

      this.#categories.set('W', []);
      this.#categories.set('U', []);
      this.#categories.set('B', []);
      this.#categories.set('R', []);
      this.#categories.set('G', []);
      this.#categories.set('Multi', []);
      this.#categories.set('Artifact', []);
      this.#categories.set('NonArtifact', []);
      this.#categories.set('Land', []);
   }

   get categories()
   {
      return this.#categories;
   }

   get size()
   {
      let result = 0;

   }

   /**
    * @param {import('#types').Card}   card -
    */
   add(card)
   {
      switch(card.colors.length)
      {
         case 0:
            this.#sortColorless(card);
            break;

         case 1:
            this.#sortMono(card);
            break;

         default:
            this.#sortMulti(card);
            break;
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   #sortColorless(card)
   {

   }

   #sortMono(card)
   {

   }

   #sortMulti(card)
   {

   }
}
