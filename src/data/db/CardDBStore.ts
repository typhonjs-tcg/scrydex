import fs               from 'node:fs';
import path             from 'node:path';

import {
   getFileList,
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import { isObject }     from '@typhonjs-utils/object';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamArray }  from 'stream-json/streamers/StreamArray';
import { streamObject } from 'stream-json/streamers/StreamObject';

import {
   execTime,
   supportedFormats }   from '#data';

import { VERSION }      from '#version';

import type {
   Card,
   CardDB,
   CardDBMetadata,
   CardDBType }         from '#types';

import type {
   CardDBMetaSave }     from '#types-data';

export class CardDBStore
{
   /**
    * Load all JSON card DBs in the specified directory path. Additional options allow filtering by DB type and DB name.
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
    * @returns Configured CardStream instances for the found JSON card DB collections.
    */
   static async loadAll({ dirpath, format, type, walk = false }:
    { dirpath: string, format?: string, type?: CardDBType, walk?: boolean }): Promise<CardStream[]>
   {
      if (!isDirectory(dirpath)) { throw new Error(`CardDB.loadAll error: 'dirpath' is not a directory.`); }
      if (typeof walk !== 'boolean') { throw new TypeError(`CardDB.loadAll error: 'walk' is not a boolean.`); }

      if (format !== void 0 && typeof format !== 'string')
      {
         throw new TypeError(`CardDB.loadAll error: 'format' is not a string.`);
      }

      if (type !== void 0 && type !== 'inventory' && type !== 'sorted' && type !== 'sorted_format')
      {
         throw new Error(`CardDB.loadAll error: 'type' is not a 'inventory', 'sorted', or 'sorted_format'.`);
      }

      const results: CardStream[] = [];

      const dbFiles = await getFileList({
         dir: dirpath,
         includeFile: /\.json$/,
         resolve: true,
         walk
      });

      for (const filepath of dbFiles)
      {
         try
         {
            const cardStream = await this.load({ filepath });

            if (type !== void 0 && cardStream.meta.type !== type) { continue; }

            // If format requested reject any CardDB that isn't a `sorted_format` type of the format mismatches.
            if (format !== void 0 && (cardStream.meta.type !== 'sorted_format' ||
             (cardStream.meta.type === 'sorted_format' && cardStream.meta.format !== format)))
            {
               continue;
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
    * @returns CardStream instance.
    * @throws Error
    */
   static async load({ filepath }: { filepath: string }): Promise<CardStream>
   {
      if (isDirectory(filepath)) { throw new Error(`CardDB.load error: 'filepath' is a directory.`); }
      if (!isFile(filepath)) { throw new Error(`CardDB.load error: 'filepath' is not a valid file.`); }

      const result = this.#validateMeta(filepath, await this.#loadMeta(filepath));

      if (typeof result === 'string')
      {
         throw new Error(`CardDB.load error: Meta data failed validation.\n${result}`);
      }
      else
      {
         return new CardStream(filepath, result);
      }
   }

   /**
    * Save a Card array as a JSON card DB collection.
    *
    * @param options - Options
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
         throw new Error(`CardDB.save error: 'type' must be 'inventory', 'sorted', or 'sorted_format'.`);
      }

      if (meta.type === 'sorted_format' && !supportedFormats.has(meta.format))
      {
         throw new TypeError(
          `CardDB.save error: A sorted format must include a supported game format in 'meta.format'.`);
      }

      const name = meta.name === void 0 && typeof meta.name !== 'string' ? path.basename(filepath, '.json') : meta.name;

      const metadata: CardDBMetadata = {
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
   static #validateMeta(filepath: string, meta: unknown): CardDBMetadata | string
   {
      if (!meta) { throw new Error(`CardDB.load error: Could not load meta data for ${filepath}`); }

      return meta as CardDBMetadata;
   }
}

/**
 * Options for {@link CardDBStore.save}. If you do not include an explicit `meta.name` field the filename will be used.
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
   cards: Card[];

   /**
    * Partial CardDB metadata.
    */
   meta: CardDBMetaSave;
}

/**
 * Provide a wrapper around a JSON Card DB with streaming access to cards.
 */
class CardStream
{
   /**
    * File path of DB.
    */
   readonly #filepath: string;

   /**
    * Metadata object in DB.
    */
   readonly #meta: CardDBMetadata;

   /**
    * @param filepath - File path of DB.
    *
    * @param meta - Metadata object of DB.
    */
   constructor(filepath: string, meta: CardDBMetadata)
   {
      this.#filepath = filepath;
      this.#meta = Object.freeze(meta);
   }

   /**
    * @returns The associated filepath.
    */
   get filepath(): string
   {
      return this.#filepath;
   }

   get meta(): Readonly<CardDBMetadata>
   {
      return this.#meta;
   }

   /**
    * Stream the card data in the DB asynchronously.
    */
   async *asStream(): AsyncIterable<Card>
   {
      const pipeline = chain([
         fs.createReadStream(this.#filepath),
         parser(),
         pick({ filter: 'cards' }),
         streamArray()
      ]);

      for await (const { value } of pipeline) { yield value; }
   }

   /**
    * Return synchronously all card data in the DB.
    */
   getAll(): Card[]
   {
      const db = JSON.parse(fs.readFileSync(this.#filepath, 'utf-8')) as CardDB;

      return Array.isArray(db.cards) ? db.cards : [];
   }
}
