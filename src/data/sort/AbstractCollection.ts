import type { ConfigSort } from '#types-command';

import type {
   CardDBMetaSave,
   CardSorted,
   SortedCategories }      from '#types-data';

/**
 * Base class for a sorted collection of cards by categories.
 */
export abstract class AbstractCollection
{
   readonly #cards: CardSorted[];

   #categories: Map<string, SortedCategories>;

   readonly #name: string;

   constructor(name: string, cards: CardSorted[], categories: Map<string, SortedCategories>)
   {
      this.#name = name;
      this.#cards = cards;
      this.#categories = categories;
   }

   /**
    * @returns All cards for the format.
    */
   get cards(): CardSorted[]
   {
      return this.#cards;
   }

   /**
    * Returns the CardDB metadata required for saving this collection.
    *
    * @privateRemarks
    * Override in child class.
    */
   abstract get meta(): CardDBMetaSave;

   /**
    * @returns Format name / ID.
    */
   get name(): string
   {
      return this.#name;
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
    * @returns Entry iterator of sorted categories in collection.
    */
   entries(): MapIterator<[string, SortedCategories]>
   {
      return this.#categories.entries();
   }

   /**
    * Implement this method to forward on the sort options to the collection categories.
    *
    * @param options - Sort options.
    */
   abstract sort(options: Record<string, boolean>): void;

   /**
    * @returns Iterator of category groups.
    */
   values(): MapIterator<SortedCategories>
   {
      return this.#categories.values();
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
}
