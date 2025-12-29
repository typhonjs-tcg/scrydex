import path                   from 'node:path';

import { CardDBStore }        from '#data';
import { logger }             from '#util';

import type { CardStream }    from '#data';

import type { ConfigExport }  from '#types-command';

/**
 * Defines the DB export implementation.
 */
export type ExportFn = ({ coalesce, db, output }: { coalesce: boolean, db: CardStream, output: string }) =>
 Promise<void>

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
 { config: ConfigExport, exportFn: ExportFn, extension: string }): Promise<void>
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
         const dbPath = path.resolve(config.output, `./${db.meta.name}.${extension}`);

         logger.verbose(`${db.meta.name} - ${dbPath}`);

         await exportFn({ coalesce: config.coalesce, db, output: dbPath });
      }

      logger.info(`Finished exporting sorted CardDB collections.`);
   }
}
