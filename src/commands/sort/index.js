import fs               from 'node:fs';

import { SortedFormat } from '#data';

import { logger }       from '#util';

const s_validLegality = new Set(['legal', 'restricted']);

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param {object}   config - Config options.
 *
 * @returns {Promise<void>}
 */
export async function sort(config)
{
   logger.info(`Sorting Scryfall card collection: ${config.input}`);
   logger.info(`Formats: ${config.formats.join(', ')}`);



   // console.log(`!!! TEST:\n${JSON.stringify(Object.fromEntries(collection), null, 2)}`);
   // console.log(`!!! Unsorted:\n${JSON.stringify(collection.get('unsorted'), null, 2)}`);
}

/**
 * @param config -
 *
 * @returns {SortedFormat[]}
 */
function formatSort(config)
{
   /**
    * @type {Map<string, object[]>}
    */
   const presortFormat = new Map(config.formats.map((entry) => [entry, []]));

   presortFormat.set('unsorted', []);

   const db = JSON.parse(fs.readFileSync(config.input, 'utf8'));

   for (const card of db)
   {
      let sorted = false;

      for (const format of config.formats)
      {
         if (s_validLegality.has(card.legalities?.[format]))
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
