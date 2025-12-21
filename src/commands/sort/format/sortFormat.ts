import { ExportCollection }   from '../ExportCollection';

import {
   CardDBStore,
   isSupportedFormat,
   SortedFormat,
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
      const sortedFormat = new SortedFormat({
         cards,
         name,
         format: isSupportedFormat(name) ? name : void 0,
         decks: db.meta.decks,
         external: db.meta.external
      });

      sortedFormat.sort({ alpha: true, type: config.sortByType });

      logger.verbose(`Sorting '${name}' - unique card entry count: ${cards.length}`);

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
