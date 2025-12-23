import type { ConfigSort } from '#types-command';

import type {
   Card,
   CardDBMetadataBase }    from '#types';

import type {
   CardSorted,
   SortedCategories }      from '#types-data';

/**
 * Base class for a sorted collection of cards by categories.
 */
export abstract class AbstractCollection
{
   readonly #cards: CardSorted[];

   #categories: Map<string, SortedCategories>;

   /**
    * Set instance of meta `decks` tracking.
    */
   readonly #decks: Set<string>;

   /**
    * Set instance of meta `external` tracking.
    */
   readonly #external: Set<string>;

   /**
    * CardDB metadata.
    */
   readonly #meta: CardDBMetadataBase;

   constructor({ cards, categories, meta }:
    { cards: CardSorted[], categories: Map<string, SortedCategories>, meta: CardDBMetadataBase })
   {
      this.#cards = cards;
      this.#categories = categories;
      this.#meta = meta;

      this.#decks = new Set(Array.isArray(meta.decks) ? meta.decks : []);
      this.#external = new Set(Array.isArray(meta.external) ? meta.external : []);
   }

   /**
    * @returns All cards for the format.
    */
   get cards(): CardSorted[]
   {
      return this.#cards;
   }

   /**
    * @returns Collection metadata.
    */
   get meta(): Readonly<CardDBMetadataBase>
   {
      return this.#meta;
   }

   /**
    * @returns Format name / ID.
    */
   get name(): string
   {
      return this.#meta.name;
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
    * Checks the meta _external_ file names for a card file name match.
    *
    * @param card -
    *
    * @param group - External card group to test for inclusion.
    */
   isCardGroup(card: Card, group: 'deck' | 'external'): boolean
   {
      switch (group)
      {
         case 'deck': return this.#decks.has(card.filename);
         case 'external': return this.#external.has(card.filename);

         default: return false;
      }
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
