import fs                     from 'node:fs';
import path                   from 'node:path';

import { isDirectory }        from '@typhonjs-utils/file-util';

import { CardDBStore }        from '#scrydex/data/db';

import { ExportSpreadsheet }  from './ExportSpreadsheet';

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
            CardDBStore.save({
               filepath: path.resolve(collectionDirPath, `${collection.name}.json`),
               cards: collection.cards,
               meta: collection.meta
            });

            await ExportSpreadsheet.writeCollection({ config, collection });
         }
      }
   }
}
