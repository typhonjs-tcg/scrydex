import fs                  from 'node:fs';
import path                from 'node:path';
import { parse }           from 'csv-parse';

import { ScryfallData }    from '#scrydex/data/scryfall';

import type { CSVCard }    from '../types-import';

/**
 * Parses and stores intermediate card data from a single CSV file.
 *
 * Stores the imported card data by Scryfall ID and combines quantity for duplicate entries.
 */
export class CSVCardIndex
{
   /**
    * Basic 8-4-4-4-12 hexadecimal UUID test.
    */
   static #regexUUID: RegExp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

   /**
    * Stores the imported card data by Scryfall ID.
    */
   #data: Map<string, CSVCard> = new Map();

   /**
    * Stores the CSV file name.
    */
   #filename: string = '';

   /**
    * @param filepath - CSV filepath to load.
    *
    * @returns Import index of CSV card data.
    */
   static async fromCSV(filepath: string): Promise<CSVCardIndex>
   {
      const cardIndex = new CSVCardIndex();

      const filename = path.basename(filepath, '.csv');

      cardIndex.#filename = filename;

      // Read and extract Scryfall IDs.
      const parser = fs.createReadStream(filepath).pipe(parse({
         columns: true,
         skip_empty_lines: true,
         trim: true
      }));

      let rowCntr = 1;

      for await (const row of parser)
      {
         rowCntr++;

         // This handles ManaBox and Archidekt CSV fields.
         if ((row['Quantity'] === void 0 && row['quantity'] === void 0) ||
          (row['Scryfall ID'] === void 0 && row['scryfall ID'] === void 0))
         {
            parser.destroy(
             new Error(`CSV file does not have required 'Quantity' or 'Scryfall ID' fields:\n${filepath}`));
         }

         const name = row['Name'] ?? row['card name'];
         const quantity = Number(row['Quantity'] ?? row['quantity']);
         const scryfall_id = row['Scryfall ID'] ?? row['scryfall ID'];
         const foil = row['Foil'] ?? 'normal';
         const lang_user = ScryfallData.normalizeLangCode(row['Language']);

         if (!Number.isInteger(quantity) || quantity < 1)
         {
            parser.destroy(
             new Error(`CSV file on row '${rowCntr}' has invalid quantity '${row['Quantity']}':\n${filepath}`));
         }

         if (!this.#regexUUID.test(scryfall_id))
         {
            parser.destroy(
             new Error(`CSV file on row '${rowCntr}' has invalid UUID '${scryfall_id}':\n${filepath}`));
         }

         const existingCard = cardIndex.get(scryfall_id);

         // TODO: Must consider foil state.
         if (existingCard)
         {
            existingCard.quantity += quantity;
         }
         else
         {
            cardIndex.set(scryfall_id, {
               object: 'card',
               name,
               foil,
               lang_user,
               quantity,
               scryfall_id,
               filename
            });
         }
      }

      return cardIndex;
   }

   /**
    * @returns File name associated with this index.
    */
   get filename(): string
   {
      return this.#filename;
   }

   /**
    * @returns Number of unique cards in index.
    */
   get size(): number
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
    * @param key - Scryfall ID.
    *
    * @returns Was the card deleted.
    *
    * @privateRemarks
    * TODO: Must consider foil state.
    */
   delete(key: string): boolean
   {
      return this.#data.delete(key);
   }

   /**
    * @returns Iterator over entries.
    */
   entries(): MapIterator<[string, CSVCard]>
   {
      return this.#data.entries();
   }

   /**
    * @param key - Scryfall ID.
    *
    * @returns Does this index contain the card?
    *
    * @privateRemarks
    * TODO: Must consider foil state.
    */
   has(key: string): boolean
   {
      return this.#data.has(key);
   }

   /**
    * @returns Scryfall ID iterator.
    */
   keys(): MapIterator<string>
   {
      return this.#data.keys();
   }

   /**
    * @param key - Scryfall ID
    *
    * @returns CSVCard data.
    *
    * @privateRemarks
    * TODO: Must consider foil state.
    */
   get(key: string): CSVCard | undefined
   {
      return this.#data.get(key);
   }

   /**
    * @param key - Scryfall ID.
    *
    * @param value - CSVCard data.
    *
    * @returns This instance.
    */
   set(key: string, value: CSVCard): this
   {
      this.#data.set(key, value);
      return this;
   }

   /**
    * @returns CSVCard iterator.
    */
   values(): MapIterator<CSVCard>
   {
      return this.#data.values();
   }
}
