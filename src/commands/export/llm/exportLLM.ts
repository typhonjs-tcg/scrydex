import path                from 'node:path';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { CardDB }          from '#scrydex/data/db';
import { ExportLLM }       from '#scrydex/data/export';

import type { ConfigCmd }  from '../../types-command';

/**
 * Exports a single Scrydex CardDB to LLM optimized LLMDB or all sorted CardDBs found in a directory.
 *
 * @param config - Config options.
 */
export async function exportLLM(config: ConfigCmd.ExportLLM): Promise<void>
{
   const logger = config.logger;

   if (!config.oracleText) { logger?.verbose(`Rules oracle text is omitted`); }

   if (isFile(config.path))
   {
      logger?.verbose(`Loading file path: ${config.path}`);

      const db = await CardDB.load({ filepath: config.path });

      const tokens = await ExportLLM.cardDB({
         db,
         filepath: config.output,
         oracleText: config.oracleText
      });

      logger?.info(`Export output target file: ${config.output} (token count: ${tokens})`);

      if (config.types)
      {
         const filepath = path.resolve(path.dirname(config.output), `./llmdb.d.ts`);

         const tokensTypes = await ExportLLM.types({ filepath });

         logger?.info(`Export output LLMDB type declarations file: ${filepath} (token count: ${tokensTypes})`);
      }
   }
   else if (isDirectory(config.path))
   {
      logger?.verbose(`Loading directory path: ${config.path}`);

      const cards = await CardDB.loadAll({
         dirpath: config.path,
         type: ['sorted', 'sorted_format'],
         walk: true
      });

      if (cards.length === 0)
      {
         logger?.warn(`No sorted CardDB collections found in:\n${config.path}`);
         return;
      }
      else
      {
         logger?.info(`Exporting ${cards.length} sorted CardDB collections.`);
         logger?.info(`Export output target directory: ${config.output}`);

         for (const db of cards)
         {
            const dbPath = path.resolve(config.output, `./llm-${db.meta.name}.json`);

            const tokens = await ExportLLM.cardDB({
               db,
               filepath: dbPath,
               oracleText: config.oracleText
            });

            logger?.verbose(`${db.meta.name} - ${dbPath} (token count: ${tokens})`);
         }

         if (config.types)
         {
            const filepath = path.resolve(config.output, `./llmdb.d.ts`);

            const tokensTypes = await ExportLLM.types({ filepath });

            logger?.info(`Export output LLMDB type declarations file: ${filepath} (token count: ${tokensTypes})`);
         }

         logger?.info(`Finished exporting sorted CardDB collections.`);
      }
   }
}
