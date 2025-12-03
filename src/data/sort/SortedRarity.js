export class SortedRarity
{
   /**
    * @type {Map<string, import('#types').Card[]>}
    */
   #categories = new Map();

   /**
    * Rarity value for this collection of cards.
    *
    * @type {string}
    */
   #rarity;

   #regexArtifact = /\bartifact\b/i;
   #regexBasicLand = /\bbasic\s+land\b/i;
   #regexLand = /\bland\b/i

   /**
    * @param {string}   rarity - Rarity value for this collection of cards.
    */
   constructor(rarity)
   {
      this.#rarity = rarity;

      this.#categories = new Map();

      this.#categories.set('W', []);
      this.#categories.set('U', []);
      this.#categories.set('B', []);
      this.#categories.set('R', []);
      this.#categories.set('G', []);
      this.#categories.set('Multicolor', []);
      this.#categories.set('Artifact (Colorless)', []);
      this.#categories.set('Non-artifact (Colorless)', []);
      this.#categories.set('Basic Land', []);
      this.#categories.set('Non-basic Land', []);
      this.#categories.set('Unsorted', []);
   }

   /**
    * @returns {string} Name for this group of cards.
    */
   get name()
   {
      return this.#rarity;
   }

   /**
    * @returns {number} The total amount of cards at this rarity.
    */
   get size()
   {
      let result = 0;

      for (const cards of this.#categories.values()) { result += cards.length; }

      return result;
   }

   /**
    * @param {import('#types').Card}   card - Card to add.
    */
   add(card)
   {
      if (!Array.isArray(card.colors))
      {
         this.#categories.get('Unsorted').push(card);
         return;
      }

      // TODO: Consider color identity option.

      const colorSource = card.colors;

      switch(colorSource?.length)
      {
         case 0:
            this.#sortColorless(card);
            break;

         case 1:
            this.#sortMono(card, colorSource);
            break;

         default:
            this.#sortMulti(card);
            break;
      }
   }

   /**
    * @returns {MapIterator<[string, import('#types').Card[]]>}
    */
   entries()
   {
      return this.#categories.entries();
   }

   sortAlpha()
   {
      for (const cards of this.#categories.values())
      {
         cards.sort((a, b) => a.name.localeCompare(b.name));
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param {import('#types').Card}   card -
    */
   #sortColorless(card)
   {
      if (this.#regexArtifact.test(card.type_line))
      {
         this.#categories.get('Artifact (Colorless)').push(card);
      }
      else if (this.#regexBasicLand.test(card.type_line))
      {
         this.#categories.get('Basic Land').push(card);
      }
      else if (this.#regexLand.test(card.type_line))
      {
         this.#categories.get('Non-basic Land').push(card);
      }
      else
      {
         this.#categories.get('Non-artifact (Colorless)').push(card);
      }
   }

   /**
    * @param {import('#types').Card}   card -
    *
    * @param {string[]} colorSource -
    */
   #sortMono(card, colorSource)
   {
      const color = colorSource[0];

      const category = this.#categories.get(color.toUpperCase());

      category.push(card);
   }

   /**
    * @param {import('#types').Card}   card -
    */
   #sortMulti(card)
   {
      const category = this.#categories.get('Multicolor');

      category.push(card);
   }
}
