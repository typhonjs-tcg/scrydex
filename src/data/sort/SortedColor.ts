import { SortOrder }    from '#data';

import { logger }       from '#util';

import type {
   CardSorted,
   SortedCategories }   from '#types-data';

export class SortedColor implements SortedCategories
{
   /**
    */
   #categories: Map<string, CardSorted[]> = new Map();

   /**
    * Name for this collection of cards.
    */
   readonly #name: string;

   /**
    * @param name - Name for this collection of cards.
    */
   constructor(name: string)
   {
      this.#name = name;

      this.#categories = new Map();

      this.#categories.set('W', []);
      this.#categories.set('U', []);
      this.#categories.set('B', []);
      this.#categories.set('R', []);
      this.#categories.set('G', []);
      this.#categories.set('Multicolor', []);
      this.#categories.set('Artifact (Colorless)', []);
      this.#categories.set('Non-artifact (Colorless)', []);
      this.#categories.set('Land', []);
      this.#categories.set('Land (Basic)', []);
      this.#categories.set('Unsorted', []);
   }

   /**
    * @returns Rarity name for this group of cards.
    */
   get name(): string
   {
      return this.#name;
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
      const categoryName = SortOrder.categoryName(card);
      const category = this.#categories.get(categoryName)

      if (category)
      {
         category.push(card);
      }
      else
      {
         logger.warn(`SortedColor.add warning: Unknown category name '${categoryName}'.`);
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
    * @param options -
    *
    * @param [options.alpha] - Sort by alphabetical name.
    *
    * @param [options.type] - Sort by normalized type.
    */
   sort(options: { alpha?: boolean, type?: boolean })
   {
      if (options.alpha)
      {
         for (const cards of this.#categories.values())
         {
            cards.sort((a, b) => a.name.localeCompare(b.name));
         }
      }

      if (options.type)
      {
         for (const cards of this.#categories.values())
         {
            cards.sort((a, b) => a.type.localeCompare(b.type));
         }
      }
   }
}
