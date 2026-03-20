import { once }            from 'node:events';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { isObject }        from '@typhonjs-utils/object';

import { parse }           from 'csv-parse';
import { stringify }       from 'csv-stringify';

import {
   createReadable,
   createWritable }        from '#scrydex/util';

/**
 * Provides a basic API to stream and serialize a CSV file allowing custom programs performing simple filtering /
 * modifications. The CSV files must have a header row describing the column keys.
 *
 * @example
 * ```js
 * \// This example processes a Manabox CSV file altering the original `Purchase price` column data.
 * import { CSVFile } from '@typhonjs-tcg/scrydex/data/import/csv';
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
    * @param [options.signal] - {@link AbortSignal} via {@link AbortController} to stop iteration and cleanup streaming.
    *
    * @returns Asynchronous iterator over each row as an object keyed by column header name.
    */
   static async *asStream({ filepath, signal }: { filepath: string, signal?: AbortSignal }):
    AsyncGenerator<{ [key: string]: string }>
   {
      if (!isFile(filepath)) { throw new Error(`'filepath' is not a valid file path.`); }

      if (signal?.aborted) { throw signal.reason; }

      const stream = createReadable({ filepath });

      const parser = stream.pipe(parse({
         columns: true,
         skip_empty_lines: true,
         trim: true
      }));

      const abort = (err?: any) =>
      {
         stream.destroy?.(err);
         parser.destroy?.(err);
      };

      if (signal) { signal.addEventListener('abort', () => abort(signal.reason), { once: true }); }

      // Use manual iteration and not `for await` so we can check `AbortSignal` before awaiting parser.next(). This
      // ensures immediate cancellation, avoids stalls, and makes the abort path deterministic / testable.

      try
      {
         const iter = parser[Symbol.asyncIterator]();

         while (true)
         {
            if (signal?.aborted)
            {
               abort(signal.reason);
               throw signal.reason;
            }

            const { value, done } = await iter.next();

            if (done) break;

            yield value as { [key: string]: string };
         }
      }
      finally
      {
         abort();
      }
   }

   /**
    * Get CSV column headers defined on the first line of a CSV file.
    *
    * @param options - Options.
    *
    * @param options.filepath - A valid CSV file path.
    *
    * @returns An array of parsed column headers.
    */
   static async getHeaders({ filepath }: { filepath: string }): Promise<string[]>
   {
      if (!isFile(filepath)) { throw new Error(`'filepath' is not a valid file path.`); }

      const stream = createReadable({ filepath });

      return new Promise((resolve, reject) =>
      {
         const parser = parse({
            skip_empty_lines: true,
            trim: true,
            columns: (header) =>
            {
               resolve(header);
               parser.destroy();
               return header;
            }
         })

         parser.on('error', reject);

         stream.pipe(parser);
      });
   }

   /**
    * Return all rows of the given CSV file path.
    *
    * @param options - Options.
    *
    * @param options.filepath - Output CSV file path.
    *
    * @returns An array of rows as an object keyed by column header name.
    */
   static async getRows({ filepath }: { filepath: string }): Promise<{ [key: string]: string }[]>
   {
      if (!isFile(filepath)) { throw new Error(`'filepath' is not a valid file path.`); }

      const rows: { [key: string]: string }[] = [];

      for await (const row of this.asStream({ filepath })) { rows.push(row as { [key: string]: string }); }

      return rows;
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
      if (typeof filepath !== 'string') { throw new Error(`'filepath is not a string.`); }
      if (isDirectory(filepath)) { throw new Error(`'filepath' is an existing directory.`); }
      if (!Array.isArray(rows)) { throw new TypeError(`'rows' is not an array.`); }
      if (rows.length === 0) { throw new Error(`'rows' is an empty array.`); }
      if (!isObject(rows[0])) { throw new TypeError(`'rows[0]' is not an object.`); }

      const columns = Object.keys(rows[0]);

      const stringifier = stringify({
         header: true,
         columns
      });

      const out = createWritable({ filepath });

      const errorHandler = (err: any) =>
      {
         stringifier.destroy(err);
         out.destroy(err);
      };

      stringifier.on('error', errorHandler);
      out.on('error', errorHandler);

      stringifier.pipe(out);

      try
      {
         for (const row of rows)
         {
            /* v8 ignore next 1 */ // Sanity case.
            if (!stringifier.write(row)) { await once(stringifier, 'drain'); }
         }

         stringifier.end();

         await once(out, 'finish');
      }
      finally
      {
         stringifier.destroy();
         out.destroy();
      }
   }
}
