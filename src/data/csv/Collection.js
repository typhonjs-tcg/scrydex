import {
   getFileList,
   isDirectory }           from '@typhonjs-utils/file-util';

import { ImportedIndex }   from './ImportedIndex.js';

import { logger }          from "#util";

export class Collection
{
   /** @type {ImportedIndex[]} */
   #index;

   constructor()
   {
      this.#index = [];
   }

   /**
    * Load collection.
    *
    * @param {string}   path - A single CSV file path or a directory path to load all `.csv` files.
    *
    * @returns {Promise<Collection>} A new collection of all CSV card data.
    */
   static async load(path)
   {
      return this.#loadPath(path);
   }

   /**
    * @returns {number} Total count of all unique cards in the collection
    */
   get size()
   {
      let result = 0;

      for (let i = 0; i < this.#index.length; i++) { result += this.#index[i].size; }

      return result;
   }

   /**
    * Deletes card from all collection indexes.
    *
    * @param {string}   key - Scryfall ID.
    */
   delete(key)
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         this.#index[i].delete(key);
      }
   }

   /**
    * @returns {Generator<[string,import('#types').CSVCard], void, *>}
    */
   *entries()
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
    * @param {string} key - Scryfall ID
    *
    * @returns {boolean} Does any collection index have the given card.
    */
   has(key)
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         if (this.#index[i].has(key)) { return true; }
      }

      return false;
   }

   /**
    * @returns {Generator<string, void, *>} All unique Scryfall IDs contained in this collection.
    */
   *keys()
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
    * @param {string}   key - Scryfall ID.
    *
    * @returns {import('#types').CSVCard[] | undefined} An array of all CSV card entries matching the given key.
    */
   get(key)
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
    * @returns {Generator<import('#types').CSVCard, void, *>} All CSV card entries stored in this collection. May
    *          contain duplicate cards from separate CSV index files.
    */
   *values()
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
    * @param {string}   path - A single CSV file path or a directory path to load all `.csv` files.
    *
    * @returns {Promise<Collection>} A new collection of all CSV card data.
    */
   static async #loadPath(path)
   {
      const collection = new Collection();

      if (isDirectory(path))
      {
         logger.verbose(`Loading directory path: ${path}`);

         const files = await getFileList({ dir: path, includeFile: /\.csv$/, sort: true, resolve: true });

         for (const file of files)
         {
            logger.verbose(`Loading file path: ${file}`);

            collection.#index.push(await ImportedIndex.fromCSV(file));
         }

         logger.info('Done extracting ManaBox collections.');
      }
      else
      {
         logger.verbose(`Loading file path: ${path}`);

         collection.#index.push(await ImportedIndex.fromCSV(path));

         logger.info('Done extracting ManaBox collection.');
      }

      return collection;
   }
}
