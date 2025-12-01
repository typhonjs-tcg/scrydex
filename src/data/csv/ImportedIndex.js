import fs         from 'node:fs';
import path       from 'node:path';

import csv        from 'csv-parser';

/**
 * Parses and stores intermediate card data from a single ManaBox CSV file.
 *
 * Stores the imported card data by Scryfall ID and combines quantity for duplicate entries.
 */
export class ImportedIndex
{
   /**
    * Stores the imported card data by Scryfall ID.
    *
    * @type {Map<string, object>}
    */
   #data = new Map();

   static fromCSV(filepath)
   {
      const filename = path.basename(filepath, '.csv');

      const collection = new ImportedIndex();

      // Read and extract Scryfall IDs
      fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) =>
      {
         const entry = {
            object: 'card',
            quantity: Number(row['Quantity']),
            name: row['Name'] ?? '',
            tags: row['Tags'],
            scryfall_id: row['Scryfall ID'],
            filename
         };

         if (collection.has(entry.scryfall_id))
         {
            collection.get(entry.scryfall_id).quantity += Number(entry.quantity);
         }
         else
         {
            collection.set(entry.scryfall_id, entry);
         }
      })

      return collection;
   }

   get size()
   {
      return this.#data.size;
   }

   clear()
   {
      this.#data.clear();
   }

   delete(key)
   {
      return this.#data.delete(key);
   }

   /**
    * @returns {MapIterator<[string, Object]>}
    */
   entries()
   {
      return this.#data.entries();
   }

   has(key)
   {
      return this.#data.has(key);
   }

   /**
    * @returns {MapIterator<string>}
    */
   keys()
   {
      return this.#data.keys();
   }

   get(key)
   {
      return this.#data.get(key);
   }

   set(key, value)
   {
      this.#data.set(key, value);
      return this;
   }

   /**
    * @returns {MapIterator<object>}
    */
   values()
   {
      return this.#data.values();
   }
}
