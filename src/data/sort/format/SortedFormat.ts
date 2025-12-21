import { AbstractCollection } from '../AbstractCollection';

import {
   isSupportedFormat,
   SortedKind,
   SortOrder }                from '#data';

import type {
   Card,
   GameFormat }               from '#types';

import type {
   CardDBMetaSave,
   CardSorted,
   SortedCategories }         from '#types-data';

export class SortedFormat extends AbstractCollection
{
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
   readonly #meta: CardDBMetaSave;

   /**
    * @param cards -
    *
    * @param decks -
    *
    * @param external -
    *
    * @param name -
    *
    * @param format -
    */
   constructor({ cards, decks, external, name, format }:
    { cards: CardSorted[], decks: string[], external: string[], name: string, format?: GameFormat })
   {
      super(name, cards, SortedFormat.#sortRarity(cards, format));

      this.#meta = isSupportedFormat(format) ? Object.freeze({ name, type: 'sorted_format', format, decks, external }) :
       { name, type: 'sorted', decks, external };

      this.#decks = new Set(Array.isArray(decks) ? decks : []);
      this.#external = new Set(Array.isArray(external) ? external : []);
   }

   get meta(): Readonly<CardDBMetaSave>
   {
      return this.#meta;
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
    * @param cards -
    *
    * @param [format] -
    */
   static #sortRarity(cards: CardSorted[], format?: GameFormat): Map<string, SortedCategories>
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
            categoryRarity = new SortedKind(rarity);
            sortedCategories.set(rarity, categoryRarity);
         }

         categoryRarity.add(card);
      }

      return sortedCategories;
   }
}
