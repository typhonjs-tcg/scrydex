import fs                  from 'node:fs';
import path                from 'node:path';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { stringify }       from 'csv-stringify';

import { CardDBStore }     from '#scrydex/data';
import { logger }          from '#scrydex/util';

import {
   exportCards,
   exportDir }             from '../common';

import type { ConfigCmd }  from '#scrydex/commands';
import type { CardStream } from '#scrydex/data';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportCsv(config: ConfigCmd.Export): Promise<void>
{
   if (isFile(config.input))
   {
      logger.verbose(`Loading file path: ${config.input}`);

      if (config.coalesce) { logger.verbose(`Coalescing unique card printings.`); }

      const db = await CardDBStore.load({ filepath: config.input });

      logger.info(`Export output target file: ${config.output}`);

      return exportDB({ coalesce: config.coalesce, db, output: config.output });
   }
   else if (isDirectory(config.input))
   {
      logger.verbose(`Loading directory path: ${config.input}`);

      if (config.coalesce) { logger.verbose(`Coalescing unique card printings.`); }

      return exportDir({ config, exportFn: exportDB, extension: 'csv' });
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Coalesces unique card entries and exports to a CSV file.
 *
 * @param options - Options.
 *
 * @param options.coalesce - Combine unique card printings.
 *
 * @param options.db - CardDB to serialize.
 *
 * @param options.output - Output file path.
 */
async function exportDB({ coalesce, db, output }: { coalesce: boolean, db: CardStream, output: string }): Promise<void>
{
   const stringifier = stringify({
      header: true,
      columns: [
         'Name',
         'Quantity',
         'Set code',
         'Set name',
         'Collector number',
         'Foil',
         'Language',
         'Scryfall ID'
      ]
   });

   // Ensure `output` directory exists.
   fs.mkdirSync(path.dirname(output), { recursive: true });

   stringifier.pipe(fs.createWriteStream(output));

   for await (const card of exportCards({ coalesce, db }))
   {
      stringifier.write({
         Name: card.name,
         Quantity: card.quantity,
         'Set code': card.set,
         'Set name': card.set_name,
         'Collector number': card.collector_number,
         'Foil': card.foil,
         'Language': card.lang_csv ?? card.lang,
         'Scryfall ID': card.scryfall_id
      });
   }
}
