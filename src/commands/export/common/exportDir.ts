import path                from 'node:path';

import { CardDB }          from '#scrydex/data/db';

import type { ConfigCmd }  from '../../types-command';

/**
 * Defines the DB export implementation.
 */
export type ExportFn = ({ config, db, output }:
 { config: ConfigCmd.Export, db: CardDB.Stream.Reader, output?: string }) => Promise<void>

/**
 * Finds all sorted CardDBs in a given input directory and exports each to the given output directory.
 *
 * @param options - Options.
 *
 * @param options.config - The export config.
 *
 * @param options.exportFn - DB export implementation.
 *
 * @param options.extension - Export file extension.
 */
export async function exportDir({ config, exportFn, extension }:
 { config: ConfigCmd.Export, exportFn: ExportFn, extension: string }): Promise<void>
{
   const cards = await CardDB.loadAll({
      dirpath: config.input,
      type: ['sorted', 'sorted_format'],
      walk: true
   });

   const logger = config.logger;

   if (cards.length === 0)
   {
      logger?.warn(`No sorted CardDB collections found in:\n${config.input}`);
      return;
   }
   else
   {
      logger?.info(`Exporting ${cards.length} sorted CardDB collections.`);
      logger?.info(`Export output target directory: ${config.output}`);

      for (const db of cards)
      {
         const dbPath = path.resolve(config.output, `./${db.meta.name}.${extension}`);

         logger?.verbose(`${db.meta.name} - ${dbPath}`);

         await exportFn({ config, db, output: dbPath });
      }

      logger?.info(`Finished exporting sorted CardDB collections.`);
   }
}
