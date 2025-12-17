import fs               from 'node:fs';

import {
   getFileList,
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamArray }  from 'stream-json/streamers/StreamArray';
import { streamObject } from 'stream-json/streamers/StreamObject';

import { execTime }     from '#data';

import { VERSION }      from '#version';

import type {
   Card,
   CollectionMetaData } from '#types';

export class CardDBStore
{
   /**
    * Load all JSON card DBs in the specified directory path. Additional options allow filtering by DB type and DB name.
    *
    * @param options - Options.
    *
    * @param options.dirpath - Directory path to load.
    *
    * @param [options.name] - Match exact name of DB.
    *
    * @param [options.type] - Match type of JSON card DB.
    *
    * @param [options.walk] - Walk all subdirectories for JSON card DBs to load; default: `false`
    *
    * @returns Configured CardStream instances for the found JSON card DB collections.
    */
   static async loadAll({ dirpath, name, type, walk = false }:
    { dirpath: string, name?: string, type?: 'game_format' | 'collection', walk?: boolean }): Promise<CardStream[]>
   {
      if (!isDirectory(dirpath)) { throw new Error(`CardDB.loadAll error: 'dirpath' is not a directory.`); }
      if (typeof walk !== 'boolean') { throw new TypeError(`CardDB.loadAll error: 'walk' is not a boolean.`); }

      if (name !== void 0 && typeof name !== 'string')
      {
         throw new TypeError(`CardDB.loadAll error: 'name' is not a string.`);
      }

      if (type !== void 0 && type !== 'collection' && type !== 'game_format')
      {
         throw new Error(`CardDB.loadAll error: 'type' is not a 'collection' or 'game_format'.`);
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

            if (name !== void 0 && cardStream.name !== type) { continue; }
            if (type !== void 0 && cardStream.type !== type) { continue; }

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
    *
    * @param options.filepath - File path to save to.
    *
    * @param options.cards - Cards to serialize / save.
    *
    * @param options.type - Type of Card DB collection.
    *
    * @param options.name - Name of the collection; often the game format.
    */
   static save({ filepath, cards, type, name }: { filepath: string; cards: Card[], type: string, name?: string })
   {
      if (isDirectory(filepath)) { throw new Error(`'filepath' is a directory.`); }
      if (!Array.isArray(cards)) { throw new TypeError(`'cards' is not an array.`); }
      if (typeof type !== 'string') { throw new TypeError(`'type' is not a string.`); }

      if (type !== 'collection' && type !== 'game_format')
      {
         throw new Error(`CardDB.save error: 'type' must be 'collection' or 'game_format'.`);
      }

      if (type === 'game_format' && typeof name !== 'string')
      {
         throw new TypeError(`CardDB.save error: Game formats must include 'name' as a string.`);
      }

      const meta = {
         type,
         name,
         cliVersion: VERSION.package,
         schemaVersion: VERSION.schema,
         generatedAt: execTime.toISOString()
      }

      let output = `{\n  "meta": ${JSON.stringify(meta)},\n  "cards": [\n`;

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
   static #validateMeta(filepath: string, meta: unknown): CollectionMetaData | string
   {
      if (!meta) { throw new Error(`CardDB.load error: Could not load meta data for ${filepath}`); }

      return meta as CollectionMetaData;
   }
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
   readonly #meta: CollectionMetaData;

   /**
    * @param filepath - File path of DB.
    *
    * @param meta - Metadata object of DB.
    */
   constructor(filepath: string, meta: CollectionMetaData)
   {
      this.#filepath = filepath;
      this.#meta = Object.freeze(meta);
   }

   /**
    * @returns CLI version that generated DB.
    */
   get cliVersion(): string
   {
      return this.#meta.cliVersion;
   }

   /**
    * @returns The associated filepath.
    */
   get filepath(): string
   {
      return this.#filepath;
   }

   /**
    * @returns The date when a DB was generated.
    */
   get generatedAt(): Date
   {
      return new Date(this.#meta.generatedAt);
   }

   /**
    * @returns Name of JSON card DB.
    */
   get name(): string | undefined
   {
      return this.#meta.name;
   }

   /**
    * Schema version of the DB.
    */
   get schemaVersion(): string
   {
      return this.#meta.schemaVersion;
   }

   /**
    * Type of JSON card DB.
    */
   get type(): 'collection' | 'game_format'
   {
      return this.#meta.type;
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
      const db = JSON.parse(fs.readFileSync(this.#filepath, 'utf-8')) as { cards: Card[] };

      return Array.isArray(db.cards) ? db.cards : [];
   }
}
