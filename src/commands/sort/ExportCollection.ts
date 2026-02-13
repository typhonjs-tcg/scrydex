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

            for (const categories of collection.values())
            {
               if (categories.size > 0)
               {
                  const workbook = await ExportExcel.collection({
                     collection,
                     categories,
                     theme: config.theme
                  });

                  const outputPath = path.resolve(collectionDirPath, `${collection.name}-${categories.name}.xlsx`);

                  await workbook.xlsx.writeFile(outputPath);
               }
            }
         }
      }
   }
}
