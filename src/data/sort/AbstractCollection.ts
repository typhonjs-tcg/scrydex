import { isGroupKind }     from '#scrydex/data/db/util';
import { capitalizeStr }   from '#scrydex/util';

import type { ConfigCmd }  from '#scrydex/commands';

import type {
   Card,
   CardDBMetadataBase,
   CardDBMetadataGroups }  from '#scrydex/data/db';

import type {
   CardSorted,
   SortedCategories }      from '#scrydex/data/sort';

/**
 * Base class for a sorted collection of cards by categories.
 */
export abstract class AbstractCollection
{
   readonly #cards: CardSorted[];

   #categories: Map<string, SortedCategories>;

   /**
    * Card / filename group associations.
    */
   readonly #groups: CardDBMetadataGroups<Set<string>> = {};

   /**
    * The subdirectory for this collection.
    */
   readonly #dirpath: string;

   /**
    * CardDB metadata.
    */
   readonly #meta: CardDBMetadataBase;

   constructor({ cards, categories, dirpath, meta }:
    { cards: CardSorted[], categories: Map<string, SortedCategories>, dirpath: string, meta: CardDBMetadataBase })
   {
      this.#cards = cards;
      this.#categories = categories;
      this.#dirpath = dirpath;
      this.#meta = meta;

      for (const group in meta.groups)
      {
         if (isGroupKind(group) && Array.isArray(meta.groups[group]))
         {
            this.#groups[group] = new Set(meta.groups[group]);
         }
      }
   }

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
    * @returns Collection metadata.
    */
   get meta(): Readonly<CardDBMetadataBase>
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

   /**
    * Calculate any `mark` merging.
    *
    * @param config -
    */
   calculateMarked(config: ConfigCmd.Sort): CardSorted[]
   {
      return this.#cards.length ? this.#calculateMarked(config) : [];
   }

   /**
    * @returns Entry iterator of sorted categories in collection.
    */
   entries(): MapIterator<[string, SortedCategories]>
   {
      return this.#categories.entries();
   }

   /**
    * Returns the group name this card belongs to if any..
    *
    * @param card -
    */
   getCardGroup(card: Card): keyof CardDBMetadataGroups | undefined
   {
      for (const group in this.#groups)
      {
         if (this.#groups?.[group as keyof CardDBMetadataGroups]?.has(card.filename))
         {
            return group as keyof CardDBMetadataGroups;
         }
      }

      return void 0;
   }

   /**
    * Checks the meta _external_ file names for a card file name match.
    *
    * @param card -
    *
    * @param group - External card group to test for inclusion.
    */
   isCardGroup(card: Card, group: keyof CardDBMetadataGroups): boolean
   {
      return this.#groups?.[group]?.has(card.filename) ?? false;
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
    * @returns Any cards that were marked for merging.
    */
   #calculateMarked(config: ConfigCmd.Sort): CardSorted[]
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

      const mark = config.mark;

      for (const card of this.#cards)
      {
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

         if (existingIDCard && existingIDCard.count >= 4)
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
