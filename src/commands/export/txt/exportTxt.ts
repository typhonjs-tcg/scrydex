import { once }               from 'node:events';
import fs                     from 'node:fs';
import path                   from 'node:path';

import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import {
   CardDBStore,
   uniqueCardKey }            from '#data';

import { logger }             from '#util';

import {
   exportCards,
   exportDir }                from '../common';

import type { CardStream }    from '#data';
import type { ConfigExport }  from '#types-command';

/**
 * Exports a single Scrydex CardDB to a text file or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportTxt(config: ConfigExport): Promise<void>
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

      return exportDir({
         dirpath: config.input,
         exportFn: exportDB,
         extension: 'txt',
         output: config.output,
      });
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Coalesces unique card entries and exports to a CSV file.
 *
 * @param db - CardDB to serialize.
 *
 * @param output - Output file path.
 */
async function exportDB(db: CardStream, output: string): Promise<void>
{
   // Ensure `output` directory exists.
   fs.mkdirSync(path.dirname(output), { recursive: true });

   const outputStream = fs.createWriteStream(output);

   for await (const card of exportCards({ db }))
   {
      const finish = card.foil === 'foil' || card.foil === 'etched' ? ` *${card.foil[0].toUpperCase()}*` : '';

      const line =`${card.quantity} ${card.name} (${card.set.toUpperCase()}) ${card.collector_number}${finish}\n`;

      if (!outputStream.write(line)) { await once(outputStream, 'drain'); }
   }

   outputStream.end();
   await once(outputStream, 'finish');
}

// /**
//  * Coalesces unique card entries and exports to a CSV file.
//  *
//  * @param inputDB - CardDB to serialize.
//  *
//  * @param output - Output file path.
//  */
// async function exportDB(inputDB: CardStream, output: string): Promise<void>
// {
//    // Ensure `output` directory exists.
//    fs.mkdirSync(path.dirname(output), { recursive: true });
//
//    const outputStream = fs.createWriteStream(output);
//
//    // First pass - calculate quantity of unique card entries ---------------------------------------------------------
//
//    const uniqueKeyMap = new Map<string, number>();
//
//    for await (const card of inputDB.asStream({ isExportable: true }))
//    {
//       if (typeof card.quantity !== 'number' || !Number.isInteger(card.quantity) || card.quantity <= 0)
//       {
//          logger.warn(`Skipping card (${card.name}) from '${inputDB.meta.name}' due to invalid quantity: ${
//           card.quantity}`);
//
//          continue;
//       }
//
//       const uniqueKey = uniqueCardKey(card);
//
//       const quantity = uniqueKeyMap.get(uniqueKey);
//       uniqueKeyMap.set(uniqueKey, typeof quantity === 'number' ? quantity + card.quantity : card.quantity);
//    }
//
//    for await (const card of inputDB.asStream({ isExportable: true }))
//    {
//       const uniqueKey = uniqueCardKey(card);
//
//       const quantity = uniqueKeyMap.get(uniqueKey);
//       if (typeof quantity === 'number')
//       {
//          const finish = card.foil === 'foil' || card.foil === 'etched' ? ` *${card.foil[0].toUpperCase()}*` : '';
//
//          const line =`${quantity} ${card.name} (${card.set.toUpperCase()}) ${card.collector_number}${finish}\n`;
//
//          if (!outputStream.write(line)) { await once(outputStream, 'drain'); }
//
//          uniqueKeyMap.delete(uniqueKey);
//       }
//    }
//
//    outputStream.end();
//    await once(outputStream, 'finish');
// }
