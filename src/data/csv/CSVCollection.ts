import {
   getFileList,
   isDirectory }           from '@typhonjs-utils/file-util';

import { CSVCardIndex }    from './CSVCardIndex';

import { logger }          from "#util";

import type { CSVCard }    from '#types';

export class CSVCollection
{
   #index: CSVCardIndex[];

   constructor()
   {
      this.#index = [];
   }

   /**
    * Load collection.
    *
    * @param path - A single CSV file path or a directory path to load all `.csv` files.
    *
    * @returns A new collection of all CSV card data.
    */
   static async load(path: string): Promise<CSVCollection>
   {
      return this.#loadPath(path);
   }

   /**
    * @returns Total count of all unique cards in the collection
    */
   get size(): number
   {
      let result = 0;

      for (let i = 0; i < this.#index.length; i++) { result += this.#index[i].size; }

      return result;
   }

   /**
    * Deletes card from all collection indexes.
    *
    * @param key - Scryfall ID.
    */
   delete(key: string)
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         this.#index[i].delete(key);
      }
   }

   /**
    * @returns Entries iterator.
    */
   *entries(): IterableIterator<[string, CSVCard]>
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         for (const entry of this.#index[i].entries())
         {
            yield entry;
         }
      }
   }

   /**
    * @param key - Scryfall ID.
    *
    * @returns Does any collection index have the given card.
    */
   has(key: string): boolean
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         if (this.#index[i].has(key)) { return true; }
      }

      return false;
   }

   /**
    * @returns Iterator for all unique Scryfall IDs contained in this collection.
    */
   *keys(): IterableIterator<string>
   {
      const seen = new Set();

      for (let i = 0; i < this.#index.length; i++)
      {
         for (const key of this.#index[i].keys())
         {
            if (!seen.has(key))
            {
               seen.add(key);
               yield key;
            }
         }
      }
   }

   /**
    * Get all CSV card entries across all CSV indexed files for the given Scryfall ID.
    *
    * @param key - Scryfall ID.
    *
    * @returns An array of all CSV card entries matching the given key.
    */
   get(key: string): CSVCard[] | undefined
   {
      let result = [];

      for (let i = 0; i < this.#index.length; i++)
      {
         const card = this.#index[i].get(key);

         if (card) { result.push(card);}
      }

      return result.length ? result : void 0;
   }

   /**
    * @returns Iterator for all CSV card entries stored in this collection. May contain duplicate cards from separate
    * CSV index files.
    */
   *values(): IterableIterator<CSVCard>
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         for (const value of this.#index[i].values())
         {
            yield value;
         }
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Load collection.
    *
    * @param path - A single CSV file path or a directory path to load all `.csv` files.
    *
    * @returns A new collection of all CSV card data.
    */
   static async #loadPath(path: string): Promise<CSVCollection>
   {
      const collection = new CSVCollection();

      if (isDirectory(path))
      {
         logger.verbose(`Loading directory path: ${path}`);

         const files = await getFileList({ dir: path, includeFile: /\.csv$/, sort: true, resolve: true });

         for (const file of files)
         {
            logger.verbose(`Loading file path: ${file}`);

            collection.#index.push(await CSVCardIndex.fromCSV(file));
         }

         logger.info('Done extracting CSV collection files.');
      }
      else
      {
         logger.verbose(`Loading file path: ${path}`);

         collection.#index.push(await CSVCardIndex.fromCSV(path));

         logger.info('Done extracting CSV collection file.');
      }

      return collection;
   }
}
