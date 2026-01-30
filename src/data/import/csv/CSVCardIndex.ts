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
   #data: Map<string, Map<string, CSVCard>> = new Map();

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
         const user_lang = ScryfallData.normalizeLangCode(row['Language'] ?? row['language']);
         const finish = ScryfallData.normalizeFinish(row['Foil'] ?? row['foil'] ?? row['Finish'] ?? row['finish']) ??
          'normal';

         // Verify minimum requirements of Scryfall ID and quantity. -------------------------------------------------

         if (!Number.isInteger(quantity) || quantity < 1)
         {
            parser.destroy(new Error(`CSV file on row '${rowCntr}' has invalid quantity '${
             row['Quantity'] ?? row['quantity']}':\n${filepath}`));
         }

         if (!this.#regexUUID.test(scryfall_id))
         {
            parser.destroy(
             new Error(`CSV file on row '${rowCntr}' has invalid UUID '${scryfall_id}':\n${filepath}`));
         }

         // Delete parsed column data. -------------------------------------------------------------------------------

         delete row['Name'];
         delete row['card name'];
         delete row['Quantity'];
         delete row['quantity'];
         delete row['Scryfall ID'];
         delete row['scryfall ID'];
         delete row['Finish'];
         delete row['Foil'];
         delete row['Language'];
         delete row['language'];

         // TODO: Determine additional derived CSV column data that can be removed and not considered `extra`.

         // Delete Manabox Scryfall derived column data.
         delete row['Collector number'];
         delete row['Rarity'];
         delete row['Set code'];
         delete row['Set name'];

         // Delete Archidekt Scryfall derived column data.
         delete row['Collector Number'];
         delete row['Edition Code'];
         delete row['Edition Name'];
         delete row['Multiverse Id'];

         // Derived `user_tags` --------------------------------------------------------------------------------------

         const userTagSet: Set<string> = new Set();

         /**
          * @param value - tag value to split and normalize.
          */
         function addTags(value: unknown)
         {
            if (typeof value !== 'string') { return; }

            for (const tag of value.split(','))
            {
               const normalized = tag.trim().toLowerCase();
               if (normalized) { userTagSet.add(normalized); }
            }
         }

         // Presently Archidekt supports collection `tags`, but not deck `tags`. It is expected Manabox may soon
         // support this.
         addTags(row.Tags ?? row.tags);

         // Support Archidekt `category` and `secondary categories` CSV fields in deck CSV exports.
         addTags(row.Category ?? row.category);
         addTags(row['Secondary Categories'] ?? row['secondary categories']);

         // Save any additional raw unprocessed CSV data. ------------------------------------------------------------

         const csv_extra = row;

         // Serialize data -------------------------------------------------------------------------------------------

         const existingCard = cardIndex.getVariant({ scryfall_id, finish, user_lang });

         if (existingCard)
         {
            existingCard.quantity += quantity;
         }
         else
         {
            cardIndex.add({
               object: 'card',
               name,
               finish,
               quantity,
               scryfall_id,
               filename,
               user_lang,
               user_tags: [...userTagSet],
               csv_extra
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
    * @returns Number of unique cards by Scryfall ID in index.
    */
   get size(): number
   {
      return this.#data.size;
   }

   /**
    * @param card - CSVCard to add to index.
    *
    * @returns This instance.
    */
   add(card: CSVCard): this
   {
      const variantKey = CSVCardIndex.#variantKey(card);

      let variants = this.#data.get(card.scryfall_id);

      if (!variants)
      {
         variants = new Map();
         this.#data.set(card.scryfall_id, variants);
      }

      const existing = variants.get(variantKey);

      if (existing)
      {
         existing.quantity += card.quantity;
      }
      else
      {
         variants.set(variantKey, card);
      }

      return this;
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
    */
   delete(key: string): boolean
   {
      return this.#data.delete(key);
   }

   /**
    * @returns Iterator over entries.
    */
   *entries(): IterableIterator<[string, readonly CSVCard[]]>
   {
      for (const [key, variants] of this.#data)
      {
         yield [key, [...variants.values()]];
      }
   }

   /**
    * Does this index contain any card w/ matching Scryfall ID?
    *
    * @param key - Scryfall ID.
    *
    * @returns Does this index contain the card?
    */
   has(key: string): boolean
   {
      return this.#data.has(key);
   }

   /**
    * Does this index contain a specific variant by Scryfall ID?
    *
    * @param query - Specific variant query.
    *
    * @param query.scryfall_id - Scryfall ID
    *
    * @param [query.finish] - Finish; default: `normal`.
    *
    * @param [query.user_lang] - User defined language code; default: `en`.
    */
   hasVariant(query: { scryfall_id: string, finish?: ScryfallData.CardFinish, user_lang?: string }): boolean
   {
      const variantKey = CSVCardIndex.#variantKey(query);

      return this.#data.get(query.scryfall_id)?.has(variantKey) ?? false;
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
    * @returns CSVCard data for all variants.
    */
   get(key: string): readonly CSVCard[] | undefined
   {
      const variants = this.#data.get(key);
      return variants ? [...variants.values()] : void 0;
   }

   /**
    * @param query - Specific variant query.
    *
    * @param query.scryfall_id - Scryfall ID
    *
    * @param [query.finish] - Finish; default: `normal`.
    *
    * @param [query.user_lang] - User defined language code; default: `en`.
    */
   getVariant(query: { scryfall_id: string, finish?: ScryfallData.CardFinish, user_lang?: string }): CSVCard | undefined
   {
      const variantKey = CSVCardIndex.#variantKey(query);

      return this.#data.get(query.scryfall_id)?.get(variantKey);
   }

   /**
    * @returns CSVCard iterator.
    */
   *values(): IterableIterator<CSVCard>
   {
      for (const variants of this.#data.values())
      {
         for (const card of variants.values()) { yield card; }
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * @param card - Object containing `finish` / `user_lang` keys.
    *
    * @returns Variant key.
    */
   static #variantKey({ finish = 'normal', user_lang = 'en' }:
    { finish?: ScryfallData.CardFinish, user_lang?: string }): string
   {
      return `${finish ?? 'normal'}:${user_lang ?? 'en'}`;
   }
}
