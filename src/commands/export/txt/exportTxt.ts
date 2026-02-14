import { once }            from 'node:events';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { CardDB }          from '#scrydex/data/db';
import { createWritable }  from '#scrydex/util';

import {
   exportCards,
   exportDir }             from '../common';

import type { ConfigCmd }  from '../../types-command';

/**
 * Exports a single Scrydex CardDB to a text file or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportTxt(config: ConfigCmd.Export): Promise<void>
{
   const logger = config.logger;

   if (isFile(config.path))
   {
      logger?.verbose(`Loading file path: ${config.path}`);

      if (config.coalesce) { logger?.verbose(`Coalescing unique card printings.`); }

      const db = await CardDB.load({ filepath: config.path });

      logger?.info(`Export output target file: ${config.output}`);

      return exportDBTxt({ config, db });
   }
   else if (isDirectory(config.path))
   {
      logger?.verbose(`Loading directory path: ${config.path}`);

      if (config.coalesce) { logger?.verbose(`Coalescing unique card printings.`); }

      return exportDir({ config, exportFn: exportDBTxt, extension: 'txt' });
   }
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Coalesces unique card entries and exports to a text file.
 *
 * @param options - Options.
 *
 * @param options.config -
 *
 * @param options.db - CardDB to serialize.
 *
 * @param [options.output] - Output path override.
 */
async function exportDBTxt({ config, db, output }:
 { config: ConfigCmd.Export, db: CardDB.Stream.Reader, output?: string }): Promise<void>
{
   const outputActual = output ?? config.output;

   const out = createWritable({ filepath: outputActual });

   for await (const card of exportCards({ config, db }))
   {
      const finish = card.finish === 'foil' || card.finish === 'etched' ? ` *${card.finish[0].toUpperCase()}*` : '';

      const line =`${card.quantity} ${card.name} (${card.set.toUpperCase()}) ${card.collector_number}${finish}\n`;

      if (!out.write(line)) { await once(out, 'drain'); }
   }

   out.end();

   await once(out, 'finish');
}
