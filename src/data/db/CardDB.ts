import fs               from 'node:fs';
import path             from 'node:path';

import {
   getFileList,
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import {
   isIterable,
   isObject }           from '@typhonjs-utils/object';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamObject } from 'stream-json/streamers/StreamObject';

import { VERSION }      from '#scrydex';
import { execTime }     from '#scrydex/data/db/util';
import { ScryfallData } from '#scrydex/data/scryfall';

import { CardStream }   from './CardStream';

import type {
   Data,
   File,
   Stream }             from './types-db';

class CardDB
{
   /**
    * Type guard for {@link CardDB.File.DBType}.
    *
    * @param type -
    */
   static isValidType(type: unknown): type is CardDB.File.DBType
   {
      return type === 'inventory' || type === 'sorted' || type === 'sorted_format';
   }

   /**
    * Load all JSON card DBs in the specified directory path. Additional options allow filtering by DB type and game
    * format.
    *
    * @param options - Options.
    *
    * @param options.dirpath - Directory path to load.
    *
    * @param [options.format] - Match exact game format of a `sorted_format` CardDB.
    *
    * @param [options.type] - Match type of CardDB.
    *
    * @param [options.walk] - Walk all subdirectories for CardDB files to load; default: `false`
    *
    * @returns Configured {@link CardDB.Stream.Reader} instances for the found JSON card DB collections.
    */
   static async loadAll({ dirpath, format, type, walk = false }:
    { dirpath: string, format?: ScryfallData.GameFormat | Iterable<ScryfallData.GameFormat>, type?:
     CardDB.File.DBType | Iterable<CardDB.File.DBType>, walk?: boolean }): Promise<CardDB.Stream.Reader[]>
   {
      if (!isDirectory(dirpath)) { throw new Error(`CardDBStore.loadAll error: 'dirpath' is not a directory.`); }
      if (typeof walk !== 'boolean') { throw new TypeError(`CardDBStore.loadAll error: 'walk' is not a boolean.`); }

      if (format !== void 0 && typeof format !== 'string' && !isIterable(format))
      {
         throw new TypeError(`CardDBStore.loadAll error: 'format' is not a string or list of strings.`);
      }

      if (type !== void 0 && !this.isValidType(type) && !isIterable(type))
      {
         throw new Error(`CardDBStore.loadAll error: 'type' is not a valid CardDB.File.DBType or list of CardDBTypes.`);
      }

      const results: CardDB.Stream.Reader[] = [];

      const dbFiles = await getFileList({
         dir: dirpath,
         includeFile: /\.json$/,
         resolve: true,
         walk
      });

      const formatSet: Set<ScryfallData.GameFormat> | undefined = format && typeof format !== 'string' ?
       new Set(format) : void 0;

      const typeSet: Set<CardDB.File.DBType> | undefined = type && typeof type !== 'string' ? new Set(type) : void 0;

      for (const filepath of dbFiles)
      {
         try
         {
            const cardStream = await this.load({ filepath });

            // Reject any CardDB that doesn't match the requested `CardDB.File.DBType`.
            if (type !== void 0 && ((typeof type === 'string' && cardStream.meta.type !== type) ||
             ((typeSet instanceof Set) && !typeSet.has(cardStream.meta.type))))
            {
               continue;
            }

            // If format requested reject any CardDB that isn't a `sorted_format` type or the format mismatches.
            if (format !== void 0)
            {
               if (cardStream.meta.type !== 'sorted_format') { continue; }

               if ((typeof format === 'string' && cardStream.meta.format !== format) ||
                ((formatSet instanceof Set) && !formatSet.has(cardStream.meta.format)))
               {
                  continue;
               }
            }

            results.push(cardStream);
         }
         catch { /**/ }
      }

      return results;
   }

   /**
    * Attempts to load a JSON card DB from the given file path.
    *
    * @param options - Options.
    *
    * @param options.filepath - Filepath to load.
    *
    * @returns {@link CardDB.Stream.Reader} instance.
    * @throws Error
    */
   static async load({ filepath }: { filepath: string }): Promise<CardDB.Stream.Reader>
   {
      if (isDirectory(filepath)) { throw new Error(`CardDBStore.load error: 'filepath' is a directory.`); }
      if (!isFile(filepath)) { throw new Error(`CardDBStore.load error: 'filepath' is not a valid file.`); }

      const result = this.#validateMeta(filepath, await this.#loadMeta(filepath));

      if (typeof result === 'string')
      {
         throw new Error(`CardDBStore.load error: Meta data failed validation.\n${result}`);
      }
      else
      {
         return new CardStream(filepath, result);
      }
   }

   /**
    * Save a Card array as a JSON card DB collection.
    *
    * @param options - Options.
    */
   static save({ filepath, cards, meta }: SaveOptions)
   {
      if (typeof filepath !== 'string') { throw new TypeError(`'filepath' is not a string.`); }
      if (!filepath.endsWith('.json')) { throw new TypeError(`'filepath' does not have the '.json' file extension.`); }
      if (isDirectory(filepath)) { throw new Error(`'filepath' is a directory.`); }

      if (!Array.isArray(cards)) { throw new TypeError(`'cards' is not an array.`); }
      if (!isObject(meta)) { throw new TypeError(`'meta' is not an object.`); }

      if (meta.type !== 'inventory' && meta.type !== 'sorted' && meta.type !== 'sorted_format')
      {
         throw new Error(`CardDBStore.save error: 'type' must be 'inventory', 'sorted', or 'sorted_format'.`);
      }

      if (meta.type === 'sorted_format' && !ScryfallData.isSupportedFormat(meta.format))
      {
         throw new TypeError(
          `CardDBStore.save error: A sorted format must include a supported game format in 'meta.format'.`);
      }

      const name = meta.name === void 0 && typeof meta.name !== 'string' ? path.basename(filepath, '.json') : meta.name;

      const metadata: CardDB.File.Metadata = {
         ...meta,
         name,
         cliVersion: VERSION.package,
         schemaVersion: VERSION.schema,
         generatedAt: execTime.toISOString()
      }

      let output = `{\n  "meta": ${JSON.stringify(metadata)},\n  "cards": [\n`;

      for (let i = 0; i < cards.length; i++)
      {
         const notLast = i !== cards.length - 1;

         output += `    ${JSON.stringify(cards[i])}${notLast ? ',': ''}\n`;
      }

      output += `  ]\n}\n`;

      fs.writeFileSync(filepath, output, 'utf-8');
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Loads the `meta` object of a card DB via streaming.
    *
    * @param filepath - File path to attempt to load.
    *
    * @private
    */
   static async #loadMeta(filepath: string): Promise<Record<string, any> | undefined>
   {
      const metaPipeline = chain([
         fs.createReadStream(filepath),
         parser(),
         pick({ filter: 'meta' }),
         streamObject()
      ]);

      let meta: Record<string, any> = {};

      for await (const { key, value } of metaPipeline) { meta[key] = value; }

      return Object.keys(meta).length ? meta : void 0;
   }

   /**
    * TODO: Finish validation
    *
    * Validates a JSON card DB meta object.
    *
    * @param filepath - File path meta object loaded from.
    *
    * @param meta - Potential Meta object / unknown
    */
   static #validateMeta(filepath: string, meta: unknown): CardDB.File.Metadata | string
   {
      if (!meta) { throw new Error(`CardDBStore.load error: Could not load meta data for ${filepath}`); }

      return meta as CardDB.File.Metadata;
   }
}

declare namespace CardDB
{
   export { Data, File, Stream };
}

export { CardDB };

// Internal Types ----------------------------------------------------------------------------------------------------


/**
 * Make `name` optional in metadata.
 */
type OptionalName<T> =
   T extends { name: string }
      ? Omit<T, 'name'> & { name?: string }
      : T;

/**
 * Metadata shape accepted by `CardDB.save`.
 *
 * @privateRemarks
 * This type is derived from the persisted CardDB metadata definition with generated fields
 * (CLI version, schema version, timestamp) removed.
 *
 * The conditional / `infer` form is used intentionally to *distribute* `Omit` across the `CardDBMetadata` union so
 * that discriminated union narrowing (IE `type === 'sorted_format'` ⇒ `format` is present) is preserved.
 */
type CardDBMetaSave =
   CardDB.File.Metadata extends infer T
      ? T extends any
         ? OptionalName<Omit<T, keyof CardDB.File.MetadataGenerated>>
         : never
      : never;

/**
 * Options for {@link CardDB.save}. If you do not include an explicit `meta.name` field the filename will be used.
 */
interface SaveOptions
{
   /**
    * A valid file path ending with the `.json` file extension.
    */
   filepath: string;

   /**
    * Cards to serialize.
    */
   cards: CardDB.Data.Card[];

   /**
    * Partial CardDB metadata.
    */
   meta: CardDBMetaSave;
}
