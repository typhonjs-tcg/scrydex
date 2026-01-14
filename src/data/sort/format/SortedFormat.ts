import { ScryfallData }       from '#scrydex/data/scryfall';

import { AbstractCollection } from '../AbstractCollection';
import { SortedKind }         from '../category/SortedKind';
import { SortOrder }          from '../SortOrder';

import type { CardDB }        from '#scrydex/data/db';

import type {
   CardSorted,
   SortedCategories }         from '../types-sort';

export class SortedFormat extends AbstractCollection
{
   /**
    * @param options - Required options.
    *
    * @param options.cards - Cards associated with this collection.
    *
    * @param options.dirpath - The subdirectory for this collection.
    *
    * @param options.name - Name of this collection.
    *
    * @param options.sourceMeta - CardDB metadata from source of cards.
    *
    * @param [options.format] - Associated game format. When provided this makes this collection type `sorted_format`
    *        otherwise the type is `sorted`.
    */
   constructor({ cards, dirpath, name, sourceMeta, format }:
    { cards: CardSorted[], dirpath: string, name: string, sourceMeta: CardDB.File.MetadataBase,
     format?: ScryfallData.GameFormat })
   {
      super({
         cards,
         categories: SortedFormat.#sortRarity(cards, format),
         dirpath,
         meta: SortedFormat.#createMeta(name, sourceMeta, format),
      });
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
      for (const category of this.values()) { category.sort(options); }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Creates the CardDBMetadataBase object for this collection. Copies `decks` / `external` properties from
    * `sourceMeta`.
    *
    * @param name - Name of collection.
    *
    * @param sourceMeta - CardDB metadata for source of cards in this collection.
    *
    * @param [format] - Optional game format to make this a `sorted_format` collection.
    */
   static #createMeta(name: string, sourceMeta: CardDB.File.MetadataBase, format?: string): CardDB.File.MetadataBase
   {
      return ScryfallData.isSupportedFormat(format) ?
       Object.freeze({ name, type: 'sorted_format', format, groups: sourceMeta.groups }) :
        { name, type: 'sorted', groups: sourceMeta.groups };
   }

   /**
    * @param cards -
    *
    * @param [format] -
    */
   static #sortRarity(cards: CardSorted[], format?: ScryfallData.GameFormat): Map<string, SortedCategories>
   {
      if (cards.length === 0) { return new Map<string, SortedCategories>(); }

      const sortedCategories = new Map<string, SortedCategories>();

      for (const card of cards)
      {
         // For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
         // recent rarity. Fallback if necessary to the actual card rarity.
         const rarity = SortOrder.rarity(card, format);

         let categoryRarity = sortedCategories.has(rarity) ? sortedCategories.get(rarity) : void 0;
         if (!categoryRarity)
         {
            categoryRarity = new SortedKind({ name: rarity });
            sortedCategories.set(rarity, categoryRarity);
         }

         categoryRarity.add(card);
      }

      return sortedCategories;
   }
}
