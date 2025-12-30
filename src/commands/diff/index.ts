import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import { CardDBStore }        from '#data';
import { logger }             from '#util';

import type { CardStream }    from '#data';
import type { ConfigDiff }    from '#types-command';

/**
 * Exports a single Scrydex CardDB to CSV or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function diff(config: ConfigDiff): Promise<void>
{
   if (isDirectory(config.inputA) && isDirectory(config.inputB))
   {
      logger.verbose(`Comparing the following directory paths:`);
      logger.verbose(`A) ${config.inputA}`);
      logger.verbose(`B) ${config.inputB}`);
   }
   else if (isFile(config.inputA) && isFile(config.inputB))
   {
      logger.verbose(`Comparing the following file paths:`);
      logger.verbose(`A) ${config.inputA}`);
      logger.verbose(`B) ${config.inputB}`);
   }
}
