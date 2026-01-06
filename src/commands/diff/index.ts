import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { CardDBStore }     from '#scrydex/data/db';

import type { ConfigCmd }  from '../types-command';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function diff(config: ConfigCmd.Diff): Promise<void>
{
   const logger = config.logger;

   if (isDirectory(config.baseline) && isDirectory(config.comparison))
   {
      logger?.verbose(`Comparing the following directory paths:`);
      logger?.verbose(`A) ${config.baseline}`);
      logger?.verbose(`B) ${config.comparison}`);
   }
   else if (isFile(config.baseline) && isFile(config.comparison))
   {
      logger?.verbose(`Comparing the following file paths:`);
      logger?.verbose(`Baseline - ${config.baseline}`);
      logger?.verbose(`Comparison - ${config.comparison}`);

      const baseline = await CardDBStore.load({ filepath: config.baseline });
      const comparison = await CardDBStore.load({ filepath: config.comparison });

      const result = await baseline.diff(comparison, { isExportable: true });

      logger?.verbose(`!!! result.added: ${JSON.stringify([...result.added], null, 2)}`);
      logger?.verbose(`!!! result.removed: ${JSON.stringify([...result.removed], null, 2)}`);
      logger?.verbose(`!!! result.changed: ${JSON.stringify(Object.fromEntries(result.changed), null, 2)}`);

      logger?.verbose(`!!! Removed cards:`);

      for await (const card of baseline.asStream({ uniqueKeys: result.removed }))
      {
         logger?.verbose(`!!! name: ${card.name}`);
      }

      logger?.verbose(`!!! Changed cards:`);

      for await (const card of baseline.asStream({ uniqueKeys: result.changed, uniqueOnce: true }))
      {
         logger?.verbose(`!!! name: ${card.name}`);
      }
   }
}
