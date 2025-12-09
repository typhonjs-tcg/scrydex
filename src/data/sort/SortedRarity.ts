import type {
   CardSorted } from '#types-command';

export class SortedRarity
{
   /**
    */
   #categories: Map<string, CardSorted[]> = new Map();

   /**
    * Rarity value for this collection of cards.
    */
   readonly #rarity: string;

   #regexArtifact = /\bartifact\b/i;
   #regexBasicLand = /\bbasic\s+land\b/i;
   #regexLand = /\bland\b/i

   /**
    * @param rarity - Rarity value for this collection of cards.
    */
   constructor(rarity: string)
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
    * @returns Rarity name for this group of cards.
    */
   get name(): string
   {
      return this.#rarity;
   }

   /**
    * @returns The total amount of cards at this rarity.
    */
   get size(): number
   {
      let result = 0;

      for (const cards of this.#categories.values()) { result += cards.length; }

      return result;
   }

   /**
    * @param card - Card to add.
    */
   add(card: CardSorted)
   {
      if (!Array.isArray(card.colors))
      {
         this.#categories.get('Unsorted')?.push(card);
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
    * @returns Entry iterator for category / cards.
    */
   entries(): MapIterator<[string, CardSorted[]]>
   {
      return this.#categories.entries();
   }

   /**
    * Sort all categories by alpha / name.
    */
   sortAlpha()
   {
      for (const cards of this.#categories.values())
      {
         cards.sort((a, b) => a.name.localeCompare(b.name));
      }
   }

   /**
    * Sort all categories by normalized type line.
    */
   sortType()
   {
      for (const cards of this.#categories.values())
      {
         cards.sort((a, b) => a.type.localeCompare(b.type));
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param card -
    */
   #sortColorless(card: CardSorted)
   {
      if (this.#regexArtifact.test(card.type_line))
      {
         this.#categories.get('Artifact (Colorless)')?.push(card);
      }
      else if (this.#regexBasicLand.test(card.type_line))
      {
         this.#categories.get('Basic Land')?.push(card);
      }
      else if (this.#regexLand.test(card.type_line))
      {
         this.#categories.get('Non-basic Land')?.push(card);
      }
      else
      {
         this.#categories.get('Non-artifact (Colorless)')?.push(card);
      }
   }

   /**
    * @param card -
    *
    * @param colorSource -
    */
   #sortMono(card: CardSorted, colorSource: string[])
   {
      const color = colorSource[0];

      const category = this.#categories.get(color.toUpperCase());

      category?.push(card);
   }

   /**
    * @param card -
    */
   #sortMulti(card: CardSorted)
   {
      const category = this.#categories.get('Multicolor');

      category?.push(card);
   }
}
