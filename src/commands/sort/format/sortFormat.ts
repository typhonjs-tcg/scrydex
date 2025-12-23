import { ExportCollection }   from '../ExportCollection';

import {
   CardDBStore,
   isSupportedFormat,
   SortedFormat,
   SortOrder,
   validLegality }            from '#data';

import { logger }             from '#util';

import type { Card }          from '#types';

import type {
   ConfigSortFormat }         from '#types-command';

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param config - Config options.
 */
export async function sortFormat(config: ConfigSortFormat): Promise<void>
{
   logger.info(`Sorting Scryfall card collection: ${config.input}`);
   logger.info(`Formats: ${config.formats.join(', ')}`);

   await ExportCollection.generate(config, await generate(config));

   logger.info(`Finished sorting Scryfall card collection: ${config.output}`);
}

/**
 * Generates all game format sorted collections.
 *
 * @param config -
 *
 * @returns All game format sorted collections.
 */
async function generate(config: ConfigSortFormat): Promise<SortedFormat[]>
{
   /**
    */
   const presortFormat: Map<string, Card[]> = new Map(config.formats.map((entry) => [entry, []]));

   presortFormat.set('basic-land', []);
   presortFormat.set('unsorted', []);

   const db = await CardDBStore.load({ filepath: config.input });

   for await (const card of db.asStream())
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

   for (const [name, cards] of presortFormat)
   {
      const format = isSupportedFormat(name) ? name : void 0;

      const sortedFormat = new SortedFormat({
         cards,
         name,
         format,
         sourceMeta: db.meta
      });

      sortedFormat.sort({ alpha: true, type: config.sortByType });

      logger.verbose(`Sorting '${name}' - unique card entry count: ${cards.length}`);

      // if (format !== 'basic-land' && format !== 'unsorted')
      // {
      //    sortedFormat.extractBinder();
      // }

      if (config.mark.size)
      {
         const cardsMarked = sortedFormat.calculateMarked(config);
         if (cardsMarked.length)
         {
            const markedRarity: Set<string> = new Set<string>();
            for (const card of cardsMarked) { markedRarity.add(SortOrder.rarity(card, format)); }

            logger.verbose(`  - ${cardsMarked.length} card entries marked for merging in: ${
             [...markedRarity].sort((a, b) => a.localeCompare(b)).join(', ')}`);
         }
      }

      sortedFormats.push(sortedFormat);
   }

   return sortedFormats;
}
