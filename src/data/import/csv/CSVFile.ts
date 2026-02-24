import { once }            from 'node:events';
import fs                  from 'node:fs';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { isObject }        from '@typhonjs-utils/object';

import { parse }           from 'csv-parse';
import { stringify }       from 'csv-stringify';

import { createWritable }  from '#scrydex/util';

/**
 * Provides a basic API to stream and serialize a CSV file allowing custom programs performing simple filtering /
 * modifications. The CSV files must have a header row describing the column keys.
 *
 * @example
 * ```js
 * \// This example processes a Manabox CSV file altering the original `Purchase price` column data.
 * import { CSVFile } from '@typhonjs-tcg/scrydex/data/import';
 *
 * const rows = [];
 *
 * for await (const row of CSVFile.asStream({ filepath: './manabox-file.csv' }))
 * {
 *    const price = Number(row['Purchase price']);
 *
 *    \// If `Purchase price` is a finite number reduce it by a factor of 65% or passthrough original value.
 *    row['Purchase price'] = Number.isFinite(price) ? (price * .65).toFixed(2) : row['Purchase price'];
 *    rows.push(row);
 * }
 *
 * await CSVFile.save({ filepath: './manabox-processed.csv', rows });
 * ```
 */
export abstract class CSVFile
{
   /* v8 ignore next 1 */
   private constructor() {}

   /**
    * Stream row by row the given CSV file.
    *
    * @param options - Options.
    *
    * @param options.filepath - A valid CSV file path.
    *
    * @returns Asynchronous iterator over each row as an object keyed by column header name.
    */
   static async *asStream({ filepath }: { filepath: string }): AsyncIterable<{ [key: string]: string }>
   {
      if (!isFile(filepath)) { throw new Error(`'filepath' is not a valid file path.`); }

      const parser = fs.createReadStream(filepath).pipe(parse({
         columns: true,
         skip_empty_lines: true,
         trim: true
      }));

      for await (const row of parser)
      {
         yield row as { [key: string]: string };
      }
   }

   /**
    * Save CSV row data to the given file path.
    *
    * @param options - Options.
    *
    * @param options.filepath - Output CSV file path.
    *
    * @param options.rows - CSV row data to write.
    */
   static async save({ filepath, rows }: { filepath: string, rows: { [key: string]: string }[] }): Promise<void>
   {
      if (isDirectory(filepath)) { throw new Error(`'filepath' is not a valid file path.`); }
      if (!Array.isArray(rows)) { throw new TypeError(`'rows' is not an array.`); }
      if (!isObject(rows[0])) { throw new TypeError(`'rows[0]' is not an object.`); }

      const columns = Object.keys(rows[0]);

      const stringifier = stringify({
         header: true,
         columns
      });

      const out = createWritable({ filepath });

      stringifier.pipe(out);

      for (const row of rows)
      {
         if (!stringifier.write(row)) { await once(stringifier, 'drain'); }
      }

      stringifier.end();

      await once(out, 'finish');
   }
}
