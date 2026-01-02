import { once }            from 'node:events';
import fs                  from 'node:fs';
import path                from 'node:path';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { CardDBStore }     from '#scrydex/data/db';

import { logger }          from '#scrydex/util';

import {
   exportCards,
   exportDir }             from '../common';

import type { ConfigCmd }  from '#scrydex/commands';
import type { CardStream } from '#scrydex/data/db';

/**
 * Exports a single Scrydex CardDB to a text file or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportTxt(config: ConfigCmd.Export): Promise<void>
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

      return exportDir({ config, exportFn: exportDB, extension: 'txt' });
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Coalesces unique card entries and exports to a text file.
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
   // Ensure `output` directory exists.
   fs.mkdirSync(path.dirname(output), { recursive: true });

   const outputStream = fs.createWriteStream(output);

   for await (const card of exportCards({ coalesce, db }))
   {
      const finish = card.foil === 'foil' || card.foil === 'etched' ? ` *${card.foil[0].toUpperCase()}*` : '';

      const line =`${card.quantity} ${card.name} (${card.set.toUpperCase()}) ${card.collector_number}${finish}\n`;

      if (!outputStream.write(line)) { await once(outputStream, 'drain'); }
   }

   outputStream.end();
   await once(outputStream, 'finish');
}
