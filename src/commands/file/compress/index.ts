import { pipeline }        from 'node:stream/promises';

import {
   createReadable,
   createWritable,
   isFileGzip,
   normalizeFilepath }     from '#scrydex/util';

import type { ConfigCmd }  from '../../types-command';

/**
 * Provides basic streaming compression / decompression of the given file path.
 *
 * The output file is the same path and name with either `.gz` extension appended or removed.
 *
 * @param config -
 *
 * @returns Output file path or undefined.
 */
export async function fileCompress(config: ConfigCmd.FileCompress): Promise<string | undefined>
{
   const logger = config.logger;

   logger?.info(`Attempting to ${config.mode}: ${config.path}`);

   switch (config.mode)
   {
      case 'compress':
         if (isFileGzip(config.path))
         {
            logger?.warn(`No operation as file is already compressed.`);
            return void 0;
         }
         break;

      case 'decompress':
         if (!isFileGzip(config.path))
         {
            logger?.warn(`No operation as file is already decompressed.`);
            return void 0;
         }
         break;
   }

   const result = await handleCompress(config.path, config.mode === 'compress');

   if (result)
   {
      logger?.info(`Wrote ${config.mode}ed file to: ${result}`);
   }

   return result;
}

/**
 * Handles the streaming compression / decompression.
 *
 * @param filepath - Target file path.
 *
 * @param compress - When true, compress; when false, decompress.
 *
 * @returns Output file path.
 */
async function handleCompress(filepath: string, compress: boolean): Promise<string>
{
   const outFilepath = normalizeFilepath({ filepath, compress })

   const source = createReadable({ filepath });
   const out = createWritable({ filepath: outFilepath, compress });

   await pipeline(source, out);

   return outFilepath;
}
