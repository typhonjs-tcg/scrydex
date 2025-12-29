import path                   from 'node:path';

import { CardDBStore }        from '#data';
import { logger }             from '#util';

import type { CardStream }    from '#data';

/**
 * Finds all sorted CardDBs in a given input directory and exports each to the given output directory.
 *
 * @param options - Options.
 *
 * @param options.dirpath - Input directory path to find sorted CardDBs.
 *
 * @param options.exportFn - DB export implementation.
 *
 * @param options.extension - Export file extension.
 *
 * @param options.output - Output directory.
 */
export async function exportDir({ dirpath, exportFn, extension, output }:
 { dirpath: string, exportFn: (db: CardStream, filepath: string) => Promise<void>, extension: string, output: string }):
  Promise<void>
{
   const cards = await CardDBStore.loadAll({
      dirpath,
      type: ['sorted', 'sorted_format'],
      walk: true
   });

   if (cards.length === 0)
   {
      logger.warn(`No sorted CardDB collections found in:\n${dirpath}`);
      return;
   }
   else
   {
      logger.info(`Exporting ${cards.length} sorted CardDB collections.`);
      logger.info(`Export output target directory: ${output}`);

      for (const db of cards)
      {
         const dbPath = path.resolve(output, `./${db.meta.name}.${extension}`);

         logger.verbose(`${db.meta.name} - ${dbPath}`);

         await exportFn(db, dbPath)
      }

      logger.info(`Finished exporting sorted CardDB collections.`);
   }
}
