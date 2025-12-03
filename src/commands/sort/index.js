import fs                     from 'node:fs';
import path                   from 'node:path';

import { isDirectory }        from '@typhonjs-utils/file-util';

import { ExportSpreadsheet }  from './ExportSpreadsheet.js';

import {
   SortedFormat,
   validLegality }            from '#data';

import {
   logger,
   stringifyCompact }         from '#util';

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param {import('#types-command').ConfigSort}   config - Config options.
 *
 * @returns {Promise<void>}
 */
export async function sort(config)
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
}

/**
 * @param {import('#types-command').ConfigSort} config -
 *
 * @returns {SortedFormat[]}
 */
function formatSort(config)
{
   /**
    * @type {Map<string, import('#types').Card[]>}
    */
   const presortFormat = new Map(config.formats.map((entry) => [entry, []]));

   presortFormat.set('unsorted', []);

   /** @type {import('#types').Card[]} */
   const db = JSON.parse(fs.readFileSync(config.input, 'utf8'));

   for (const card of db)
   {
      let sorted = false;

      for (const format of config.formats)
      {
         if (validLegality.has(card.legalities?.[format]))
         {
            presortFormat.get(format).push(card);
            sorted = true;
            break;
         }
      }

      if (!sorted) { presortFormat.get('unsorted').push(card); }
   }

   for (const format of presortFormat.keys())
   {
      presortFormat.set(format, presortFormat.get(format).sort((a, b) => a.name.localeCompare(b.name)))
   }

   /**
    * @type {SortedFormat[]}
    */
   const sortedFormats = [];

   for (const [format, cards] of presortFormat) { sortedFormats.push(new SortedFormat(format, cards)) }

   return sortedFormats;
}
