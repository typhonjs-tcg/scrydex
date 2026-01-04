import fs                  from 'node:fs';
import path                from 'node:path';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { stringify }       from 'csv-stringify';

import { CardDBStore }     from '#scrydex/data/db';

import {
   exportCards,
   exportDir }             from '../common';

import type { ConfigCmd }  from '#scrydex/commands';
import type { CardStream } from '#scrydex/data/db';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportCsv(config: ConfigCmd.Export): Promise<void>
{
   const logger = config.logger;

   if (isFile(config.input))
   {
      logger?.verbose(`Loading file path: ${config.input}`);

      if (config.coalesce) { logger?.verbose(`Coalescing unique card printings.`); }

      const db = await CardDBStore.load({ filepath: config.input });

      logger?.info(`Export output target file: ${config.output}`);

      return exportDB({ config, db });
   }
   else if (isDirectory(config.input))
   {
      logger?.verbose(`Loading directory path: ${config.input}`);

      if (config.coalesce) { logger?.verbose(`Coalescing unique card printings.`); }

      return exportDir({ config, exportFn: exportDB, extension: 'csv' });
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Coalesces unique card entries and exports to a CSV file.
 *
 * @param options - Options.
 *
 * @param options.config -
 *
 * @param options.db - CardDB to serialize.
 */
async function exportDB({ config, db }: { config: ConfigCmd.Export, db: CardStream }): Promise<void>
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
   fs.mkdirSync(path.dirname(config.output), { recursive: true });

   stringifier.pipe(fs.createWriteStream(config.output));

   for await (const card of exportCards({ config, db }))
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
