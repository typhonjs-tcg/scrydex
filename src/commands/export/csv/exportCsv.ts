import fs                     from 'node:fs';
import path                   from 'node:path';

import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import { stringify }          from 'csv-stringify';

import {
   CardDBStore,
   uniqueCardKey }            from '#data';

import { logger }             from '#util';

import type { CardStream }    from '#data';
import type { ConfigExport }  from '#types-command';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportCsv(config: ConfigExport): Promise<void>
{
   if (isFile(config.input))
   {
      logger.verbose(`Loading file path: ${config.input}`);

      const inputDB = await CardDBStore.load({ filepath: config.input });

      logger.info(`Export output target file: ${config.output}`);

      return exportDB(inputDB, config.output);
   }
   else if (isDirectory(config.input))
   {
      logger.verbose(`Loading directory path: ${config.input}`);

      return exportDir(config);
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Finds all sorted CardDBs in a given input directory and exports each to the given output directory.
 *
 * @param config
 */
async function exportDir(config: ConfigExport): Promise<void>
{
   const cards = await CardDBStore.loadAll({
      dirpath: config.input,
      type: ['sorted', 'sorted_format'],
      walk: true
   });

   if (cards.length === 0)
   {
      logger.warn(`No sorted CardDB collections found in:\n${config.input}`);
      return;
   }
   else
   {
      logger.info(`Exporting ${cards.length} sorted CardDB collections.`);
      logger.info(`Export output target directory: ${config.output}`);

      for (const db of cards)
      {
         const dbPath = path.resolve(config.output, `./${db.meta.name}.csv`);

         logger.verbose(`${db.meta.name} - ${dbPath}`);

         await exportDB(db, dbPath)
      }

      logger.info(`Finished exporting sorted CardDB collections.`);
   }
}

/**
 * Coalesces unique card entries and exports to a CSV file.
 *
 * @param inputDB - CardDB to serialize.
 *
 * @param output - Output file path.
 */
async function exportDB(inputDB: CardStream, output: string): Promise<void>
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

   // First pass - calculate quantity of unique card entries ---------------------------------------------------------

   const uniqueKeyMap = new Map<string, number>();

   for await (const card of inputDB.asStream({ isExportable: true }))
   {
      if (typeof card.quantity !== 'number' || !Number.isInteger(card.quantity) || card.quantity <= 0)
      {
         logger.warn(`Skipping card (${card.name}) from '${inputDB.meta.name}' due to invalid quantity: ${
          card.quantity}`);

         continue;
      }

      const uniqueKey = uniqueCardKey(card);

      const quantity = uniqueKeyMap.get(uniqueKey);
      uniqueKeyMap.set(uniqueKey, typeof quantity === 'number' ? quantity + card.quantity : card.quantity);
   }

   for await (const card of inputDB.asStream({ isExportable: true }))
   {
      const uniqueKey = uniqueCardKey(card);

      const quantity = uniqueKeyMap.get(uniqueKey);
      if (typeof quantity === 'number')
      {
         stringifier.write({
            Name: card.name,
            Quantity: quantity,
            'Set code': card.set,
            'Set name': card.set_name,
            'Collector number': card.collector_number,
            'Foil': card.foil,
            'Language': card.lang_csv ?? card.lang,
            'Scryfall ID': card.scryfall_id
         });

         uniqueKeyMap.delete(uniqueKey);
      }
   }
}
