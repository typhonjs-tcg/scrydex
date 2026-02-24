import fs                     from 'node:fs';
import path                   from 'node:path';

import { isDirectory }        from '@typhonjs-utils/file-util';

import { CardDB }             from '#scrydex/data/db';
import { ExportExcel }        from '#scrydex/data/export';

import type {
   AbstractCollection }       from '#scrydex/data/sort';

import type { ConfigCmd }     from '../types-command';

/**
 * Export all `SortedFormat` instances as spreadsheets by rarity.
 */
export abstract class ExportCollection
{
   /* v8 ignore next 1 */
   private constructor() {}

   static async generate(config: ConfigCmd.Sort, collections: Iterable<AbstractCollection>): Promise<void>
   {
      for (const collection of collections)
      {
         if (collection.size > 0)
         {
            // Store spreadsheets in format subdirectories.
            const collectionDirPath = path.resolve(config.output, collection.dirpath);

            // Create collection subdirectory if it doesn't exist already.
            if (!isDirectory(collectionDirPath)) { fs.mkdirSync(collectionDirPath, { recursive: true }); }

            // Export collection cards to JSON DB.
            await CardDB.save({
               filepath: path.resolve(collectionDirPath, `${collection.name}.json`),
               cards: collection.cards,
               compress: config.compress,
               meta: collection.meta
            });

            for (const category of collection.values())
            {
               if (category.size > 0)
               {
                  const workbook = await ExportExcel.collectionCategory({
                     collection,
                     category,
                     theme: config.theme
                  });

                  const outputPath = path.resolve(collectionDirPath, `${collection.name}-${category.name}.xlsx`);

                  await workbook.xlsx.writeFile(outputPath);
               }
            }
         }
      }
   }
}
