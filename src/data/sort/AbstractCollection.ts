import { CardDB }          from '#scrydex/data/db';
import { capitalizeStr }   from '#scrydex/util';

import type {
   CardSorted,
   SortedCategories,
   SortOptions }           from './types-sort';

/**
 * Base class for a sorted collection of cards by categories.
 */
export abstract class AbstractCollection
{
   readonly #cards: CardSorted[];

   #categories: Map<string, SortedCategories>;

   /**
    * Potentially contains a set of collection import file names marked for merging.
    */
   #mergeMark?: Set<string>

   /**
    * Card / filename group associations.
    */
   readonly #groups: CardDB.File.MetadataGroups<Set<string>> = {};

   /**
    * The subdirectory for this collection.
    */
   readonly #dirpath: string;

   /**
    * CardDB metadata.
    */
   readonly #meta: CardDB.File.MetadataBase;

   constructor({ cards, categories, dirpath, meta }:
    { cards: CardSorted[], categories: Map<string, SortedCategories>, dirpath: string, meta: CardDB.File.MetadataBase })
   {
      this.#cards = cards;
      this.#categories = categories;
      this.#dirpath = dirpath;
      this.#meta = meta;

      for (const group in meta.groups)
      {
         if (CardDB.isGroupKind(group) && Array.isArray(meta.groups[group]))
         {
            this.#groups[group] = new Set(meta.groups[group]);
         }
      }
   }

   // Abstract Methods -----------------------------------------------------------------------------------------------

   /**
    * Returns the most recently applied sort configuration.
    *
    * @returns Any sort options applied.
    */
   abstract getSortOptions(): Readonly<SortOptions> | undefined;

   /**
    * Applies sorting to the collection using the provided configuration.
    *
    * Implementations must:
    * ```
    * - Reorder the collection deterministically according to the supplied options.
    * - Propagate sorting behavior to any underlying categories or grouped views.
    * - Persist the applied sort configuration so it may be retrieved later by `getSortOptions`.
    * ```
    *
    * Calling this method should fully define the active ordering state of the collection.
    *
    * @param options - Sorting configuration flags.
    */
   abstract sort(options: SortOptions): void;

   // Accessors ------------------------------------------------------------------------------------------------------

   /**
    * @returns All cards for the format.
    */
   get cards(): CardSorted[]
   {
      return this.#cards;
   }

   /**
    * Returns the subdirectory for this collection.
    */
   get dirpath(): string
   {
      return this.#dirpath;
   }

   /**
    * Returns any set of collection import file names marked for merging.
    */
   get mergeMark(): Set<string> | undefined
   {
      return this.#mergeMark;
   }

   /**
    * @returns Collection metadata.
    */
   get meta(): Readonly<CardDB.File.MetadataBase>
   {
      return this.#meta;
   }

   /**
    * @returns Collection name / ID.
    */
   get name(): string
   {
      return this.#meta.name;
   }

   /**
    * @returns A printable / punctuated version of the collection name.
    */
   get printName(): string
   {
      const name = this.#meta.name;

      const parts = name.split(/[-_\s]+/);

      return parts.length === 1 ? `${capitalizeStr(parts[0])}` :
       `${capitalizeStr(parts[0])} - ${parts.slice(1).map((part) => capitalizeStr(part)).join(' ')}`;
   }

   /**
    * @returns Count of cards in this format.
    */
   get size(): number
   {
      return this.#cards.length;
   }

   // Methods --------------------------------------------------------------------------------------------------------

   /**
    * Calculate any `mark` merging.
    *
    * @param mark - A set of CSV file names in the conversion process to mark / highlight for merging.
    */
   calculateMarked(mark: Set<string>): CardSorted[]
   {
      this.#mergeMark = new Set(mark);

      return this.#cards.length ? this.#calculateMarked(mark) : [];
   }

   /**
    * @returns Entry iterator of sorted categories in collection.
    */
   entries(): MapIterator<[string, SortedCategories]>
   {
      return this.#categories.entries();
   }

   /**
    * Get a specific sorted category.
    *
    * @param key - SortedCategory key / name.
    */
   get(key: string): SortedCategories | undefined
   {
      return this.#categories.get(key);
   }

   /**
    * Returns the group name this card belongs to if any..
    *
    * @param card -
    */
   getCardGroup(card: CardDB.Data.Card): keyof CardDB.File.MetadataGroups | undefined
   {
      for (const group in this.#groups)
      {
         if (this.#groups?.[group as keyof CardDB.File.MetadataGroups]?.has(card.filename))
         {
            return group as keyof CardDB.File.MetadataGroups;
         }
      }

      return void 0;
   }

   /**
    * Does this collection have a specific sorted category.
    *
    * @param key - SortedCategory key / name.
    *
    * @returns Whether this collection has the sorted category.
    */
   has(key: string): boolean
   {
      return this.#categories.has(key);
   }

   /**
    * Checks the meta _external_ file names for a card file name match.
    *
    * @param card -
    *
    * @param group - External card group to test for inclusion.
    */
   isCardGroup(card: CardDB.Data.Card, group: keyof CardDB.File.MetadataGroups): boolean
   {
      return this.#groups?.[group]?.has(card.filename) ?? false;
   }

   /**
    * @returns Key iterator of sorted categories in collection.
    */
   keys(): MapIterator<string>
   {
      return this.#categories.keys();
   }

   /**
    * Resets any cards marked for merging.
    */
   resetMarked()
   {
      this.#mergeMark = void 0;

      for (const card of this.#cards) { card.mark = void 0; }
   }

   /**
    * @returns Iterator of category groups.
    */
   values(): MapIterator<SortedCategories>
   {
      return this.#categories.values();
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param mark - A set of CSV file names in the conversion process to mark / highlight for merging.
    *
    * @returns Any cards that were marked for merging.
    */
   #calculateMarked(mark: Set<string>): CardSorted[]
   {
      /**
       * Collects any cards were marked.
       */
      const result = [];

      /**
       * Scryfall oracle ID map.
       */
      const oracleMap: Map<string, { count: number }> = new Map();

      /**
       * Scryfall card ID map.
       */
      const idMap: Map<string, { count: number }> = new Map();

      for (const card of this.#cards)
      {
         // Remove any previous mark.
         delete card.mark;

         // Skip proxy cards.
         if (this.isCardGroup(card, 'proxy')) { continue; }

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
         // Skip proxy cards.
         if (this.isCardGroup(card, 'proxy')) { continue; }

         // Skip non-marked cards.
         if (!mark.has(card.filename)) { continue; }

         if (!oracleMap.has(card.oracle_id))
         {
            card.mark = 'ok';
            result.push(card);
            continue;
         }

         const existingIDCard = idMap.get(card.scryfall_id);

         if (existingIDCard && (existingIDCard.count + card.quantity) > 4)
         {
            card.mark = 'error';
            result.push(card);
            continue;
         }

         if (oracleMap.has(card.oracle_id))
         {
            card.mark = 'warning';
            result.push(card);
         }
      }

      return result;
   }
}
