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

   static async load(path)
   {
      return this.#loadPath(path);
   }

   get size()
   {
      let result = 0;

      for (let i = 0; i < this.#index.length; i++) { result += this.#index[i].size; }

      return result;
   }

   delete(key)
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         this.#index[i].delete(key);
      }
   }

   /**
    * @returns {Generator<[string,Object], void, *>}
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

   has(key)
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         if (this.#index[i].has(key)) { return true; }
      }

      return false;
   }

   /**
    * @returns {Generator<string, void, *>}
    */
   *keys()
   {
      for (let i = 0; i < this.#index.length; i++)
      {
         for (const key of this.#index[i].keys())
         {
            yield key;
         }
      }
   }

   /**
    * @param key
    *
    * @returns {*[]|*}
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
    * @returns {Generator<object, void, *>}
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

            collection.#index.push(ImportedIndex.fromCSV(file));
         }

         logger.info('Done extracting ManaBox collections.');
      }
      else
      {
         logger.verbose(`Loading file path: ${path}`);

         collection.#index.push(ImportedIndex.fromCSV(path));

         logger.info('Done extracting ManaBox collection.');
      }

      return collection;
   }
}
