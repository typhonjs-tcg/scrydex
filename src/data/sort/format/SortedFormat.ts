import fs                        from 'node:fs';

import { SortedCollection }      from '../SortedCollection';

import {
   SortedColor,
   validLegality }               from '#data';

import { logger }                from '#util';

import type {
   CardSorted,
   SortedCategories }            from '#types-data';

import type { Card }             from '#types';
import type { ConfigSortFormat } from '#types-command';

export class SortedFormat extends SortedCollection
{
   /**
    * @param format -
    *
    * @param cards -
    */
   constructor(format: string, cards: CardSorted[])
   {
      super(format, cards, SortedFormat.#sortRarity(format, cards));
   }

   /**
    * Generates all game format sorted collections.
    *
    * @param config -
    *
    * @returns All game format sorted collections.
    */
   static generate(config: ConfigSortFormat): SortedFormat[]
   {
      /**
       */
      const presortFormat: Map<string, Card[]> = new Map(config.formats.map((entry) => [entry, []]));

      presortFormat.set('basic-land', []);
      presortFormat.set('unsorted', []);

      /**
       */
      const db: Card[] = JSON.parse(fs.readFileSync(config.input, 'utf8'));

      for (const card of db)
      {
         // Separate all basic land.
         if (card.type.startsWith('Land - Basic'))
         {
            presortFormat.get('basic-land')?.push(card);
            continue;
         }

         let sorted = false;

         for (const format of config.formats)
         {
            if (validLegality.has(card.legalities?.[format]))
            {
               presortFormat.get(format)?.push(card);
               sorted = true;
               break;
            }
         }

         if (!sorted) { presortFormat.get('unsorted')?.push(card); }
      }

      for (const format of presortFormat.keys())
      {
         const formatSort = presortFormat.get(format);
         if (!formatSort) { continue; }

         presortFormat.set(format, formatSort.sort((a, b) => a.name.localeCompare(b.name)));
      }

      const sortedFormats: SortedFormat[] = [];

      for (const [format, cards] of presortFormat)
      {
         const sortedFormat = new SortedFormat(format, cards);

         sortedFormat.sort({ alpha: true, type: config.sortByType });

         logger.verbose(`Sorting format '${format}' - unique card entry count: ${cards.length}`);

         // if (format !== 'basic-land' && format !== 'unsorted')
         // {
         //    sortedFormat.extractBinder();
         // }

         if (config.mark.size)
         {
            const hasMarked = sortedFormat.calculateMarked(config);
            if (hasMarked)
            {
               logger.verbose(`  - Some cards marked for merging.`);
            }
         }

         sortedFormats.push(sortedFormat);
      }

      return sortedFormats;
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
    * @param format -
    *
    * @param cards -
    */
   static #sortRarity(format: string, cards: CardSorted[]): Map<string, SortedCategories>
   {
      if (cards.length === 0) { return new Map<string, SortedCategories>(); }

      const sortedCategories = new Map<string, SortedCategories>();

      for (const card of cards)
      {
         // For just the `oldschool` & `premodern` formats use original rarity otherwise for all other formats use
         // recent rarity. Fallback if necessary to the actual card rarity.
         const rarity = (format === 'oldschool' || format === 'premodern' ? card.rarity_orig : card.rarity_recent) ??
          card.rarity;

         let sortRarity = sortedCategories.has(rarity) ? sortedCategories.get(rarity) : void 0;
         if (!sortRarity)
         {
            sortRarity = new SortedColor(rarity);
            sortedCategories.set(rarity, sortRarity);
         }

         sortRarity.add(card);
      }

      return sortedCategories;
   }
}
