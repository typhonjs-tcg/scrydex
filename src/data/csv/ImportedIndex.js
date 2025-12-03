import fs         from 'node:fs';
import path       from 'node:path';

import csv        from 'csv-parser';

/**
 * Parses and stores intermediate card data from a single CSV file.
 *
 * Stores the imported card data by Scryfall ID and combines quantity for duplicate entries.
 */
export class ImportedIndex
{
   /**
    * Basic 8-4-4-4-12 hexadecimal UUID test.
    *
    * @type {RegExp}
    */
   static #regexUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

   /**
    * Stores the imported card data by Scryfall ID.
    *
    * @type {Map<string, import('#types').CSVCard>}
    */
   #data = new Map();

   /**
    * @param {string}   filepath - CSV filepath to load.
    *
    * @returns {Promise<ImportedIndex>} Import index of CSV card data.
    */
   static async fromCSV(filepath)
   {
      return new Promise((resolve, reject) =>
      {
         const filename = path.basename(filepath, '.csv');

         const collection = new ImportedIndex();

         // Read and extract Scryfall IDs.
         const stream = fs.createReadStream(filepath).pipe(csv());

         let rowCntr = 1;

         stream.on('data', (row) =>
         {
            rowCntr++;

            if (row['Quantity'] === void 0 || row['Scryfall ID'] === void 0)
            {
               stream.destroy(
                new Error(`CSV file does not have required 'Quantity' or 'Scryfall ID' fields:\n${filepath}`));
            }

            const quantity = Number(row['Quantity']);
            const scryfall_id = row['Scryfall ID'];
            const foil = row['Foil'] ?? null;

            if (!Number.isInteger(quantity) || quantity < 1)
            {
               stream.destroy(
                new Error(`CSV file on row '${rowCntr}' has invalid quantity '${row['Quantity']}':\n${filepath}`));
            }

            if (!this.#regexUUID.test(scryfall_id))
            {
               stream.destroy(
                new Error(`CSV file on row '${rowCntr}' has invalid UUID '${scryfall_id}':\n${filepath}`));
            }

            /** @type {import('#types').CSVCard} */
            const entry = {
               object: 'card',
               foil,
               quantity,
               scryfall_id,
               filename
            };

            if (collection.has(entry.scryfall_id))
            {
               collection.get(entry.scryfall_id).quantity += entry.quantity;
            }
            else
            {
               collection.set(entry.scryfall_id, entry);
            }
         });

         stream.on('error', reject);
         stream.on('end', () => resolve(collection))
      });
   }

   /**
    * @returns {number} Number of unique cards in index.
    */
   get size()
   {
      return this.#data.size;
   }

   /**
    * Clear all card data stored in this index.
    */
   clear()
   {
      this.#data.clear();
   }

   /**
    * @param {string}   key - Scryfall ID.
    *
    * @returns {boolean} Was the card deleted.
    */
   delete(key)
   {
      return this.#data.delete(key);
   }

   /**
    * @returns {MapIterator<[string, import('#types').CSVCard]>}
    */
   entries()
   {
      return this.#data.entries();
   }

   /**
    * @param {string}   key - Scryfall ID
    *
    * @returns {boolean} Does this index contain the card?
    */
   has(key)
   {
      return this.#data.has(key);
   }

   /**
    * @returns {MapIterator<string>} Scryfall ID iterator.
    */
   keys()
   {
      return this.#data.keys();
   }

   /**
    * @param {string}   key - Scryfall ID
    *
    * @returns {import('#types').CSVCard} CSVCard data.
    */
   get(key)
   {
      return this.#data.get(key);
   }

   /**
    *
    * @param {string}   key - Scryfall ID
    *
    * @param {import('#types').CSVCard}   value - CSVCard data.
    *
    * @returns {this} This instance.
    */
   set(key, value)
   {
      this.#data.set(key, value);
      return this;
   }

   /**
    * @returns {MapIterator<import('#types').CSVCard>} CSVCard iterator.
    */
   values()
   {
      return this.#data.values();
   }
}
