import fs                     from 'node:fs';
import path                   from 'node:path';

import { isDirectory }        from '@typhonjs-utils/file-util';

import { ExportSpreadsheet }  from './ExportSpreadsheet';

import {
   SortedFormat,
   validLegality }            from '#data';

import {
   logger,
   stringifyCompact }         from '#util';

import type { Card }          from '#types';
import type { ConfigSort }    from '#types-command';

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param config - Config options.
 */
export async function sort(config: ConfigSort): Promise<void>
{
   logger.info(`Sorting Scryfall card collection: ${config.input}`);
   logger.info(`Formats: ${config.formats.join(', ')}`);

   const sortedFormats = formatSort(config);

   for (const format of sortedFormats)
   {
      if (format.size > 0)
      {
         // Store spreadsheets in format subdirectories.
         const formatDirPath = path.resolve(config.output, format.name);

         // Create format subdirectory if it doesn't exist already.
         if (!isDirectory(formatDirPath)) { fs.mkdirSync(formatDirPath); }

         // Export format cards to JSON DB.
         fs.writeFileSync(path.resolve(formatDirPath, `${format.name}-all.json`), stringifyCompact(format.cards),
          'utf-8');

         for (const rarity of format.values())
         {
            if (rarity.size > 0)
            {
               await ExportSpreadsheet.exportFormatRarity(config, format, rarity, formatDirPath);
            }
         }
      }
   }

   logger.info(`Finished sorting Scryfall card collection: ${config.output}`);
}

/**
 * @param config -
 *
 * @returns All sorted formats.
 */
function formatSort(config: ConfigSort): SortedFormat[]
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
      const sortedFormat = new SortedFormat(config, format, cards);

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
