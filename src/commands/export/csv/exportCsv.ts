import { once }            from 'node:events';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { isObject }        from '@typhonjs-utils/object';

import { stringify }       from 'csv-stringify';

import { CardDB }          from '#scrydex/data/db';
import { createWritable }  from '#scrydex/util';

import {
   exportCards,
   exportDir }             from '../common';

import type { ConfigCmd }  from '../../types-command';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportCsv(config: ConfigCmd.Export): Promise<void>
{
   const logger = config.logger;

   if (isFile(config.path))
   {
      logger?.verbose(`Loading file path: ${config.path}`);

      if (config.coalesce) { logger?.verbose(`Coalescing unique card printings.`); }

      const db = await CardDB.load({ filepath: config.path });

      logger?.info(`Export output target file: ${config.output}`);

      return exportDB({ config, db });
   }
   else if (isDirectory(config.path))
   {
      logger?.verbose(`Loading directory path: ${config.path}`);

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
 *
 * @param [options.output] - Output path override.
 */
async function exportDB({ config, db, output }:
 { config: ConfigCmd.Export, db: CardDB.Stream.Reader, output?: string }): Promise<void>
{
   const outputActual = output ?? config.output;

   const csvExtraKeys = Array.isArray(db.meta.csvExtraKeys) ? db.meta.csvExtraKeys : [];

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
         'Scryfall ID',
         ...csvExtraKeys,
      ]
   });

   const out = createWritable({ filepath: outputActual });

   stringifier.pipe(out);

   for await (const card of exportCards({ config, db }))
   {
      const data = {
         Name: card.name,
         Quantity: card.quantity,
         'Set code': card.set,
         'Set name': card.set_name,
         'Collector number': card.collector_number,
         'Foil': card.finish,
         'Language': card.user_lang ?? card.lang,
         'Scryfall ID': card.scryfall_id,
         ...(csvExtraKeys.length && isObject(card.csv_extra) ? card.csv_extra : {})
      }

      if (!stringifier.write(data)) { await once(stringifier, 'drain'); }
   }

   stringifier.end();

   await once(out, 'finish');
}
