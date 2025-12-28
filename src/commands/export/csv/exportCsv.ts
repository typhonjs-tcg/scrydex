import fs                     from 'node:fs';
import path                   from 'node:path';

import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import { stringify }          from 'csv-stringify';

import { CardDBStore }        from '#data';

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
      const inputDB = await CardDBStore.load({ filepath: config.input });
      return exportDB(inputDB, config.output);
   }
   else if (isDirectory(config.input))
   {
      return exportDir(config);
   }
}

async function exportDir(config: ConfigExport): Promise<void>
{

}

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
   if (!fs.existsSync(output)) { fs.mkdirSync(path.dirname(output), { recursive: true }); }

   stringifier.pipe(fs.createWriteStream(output));

   for await (const card of inputDB.asStream({ isExportable: true }))
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


