import { once }            from 'node:events';

import {
   getFileList,
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import {
   deepFreeze,
   isIterable,
   isObject}               from '@typhonjs-utils/object';

import { chain }           from 'stream-chain';
import { parser }          from 'stream-json';
import { pick }            from 'stream-json/filters/Pick';
import { streamArray }     from 'stream-json/streamers/StreamArray';
import { streamValues }    from 'stream-json/streamers/StreamValues';

import { createReadable }  from '#scrydex/util';

import type {
   File,
   Meta,
   Stream }                from './types-scryfall';

/**
 * Provides a reusable / generic streamable interface over the Scryfall card DB.
 */
abstract class ScryfallDB
{
   /**
    * Type guard for {@link ScryfallDB.File.DBType}.
    *
    * @param type -
    */
   static isValidSourceType(type: unknown): type is ScryfallDB.File.DBType
   {
      return type === 'all_cards' || type === 'default_cards';
   }

   /**
    * Attempts to load a Scrydex JSON card DB from the given file path.
    *
    * @param options - Options.
    *
    * @param options.filepath - Filepath to load.
    *
    * @returns {@link ScryfallDB.Stream.Reader} instance.
    *
    * @throws Error
    */
   static async load({ filepath }: { filepath: string }): Promise<ScryfallDB.Stream.Reader>
   {
      if (isDirectory(filepath)) { throw new Error(`ScryfallDB.load error: 'filepath' is a directory.`); }
      if (!isFile(filepath)) { throw new Error(`ScryfallDB.load error: 'filepath' is not a valid file.`); }

      const result = this.#validateMeta(filepath, await this.#loadMeta(filepath));

      if (typeof result === 'string')
      {
         throw new Error(`ScryfallDB.load error: Meta data failed validation.\n${result}`);
      }
      else
      {
         return new ScryCardStream(filepath, result);
      }
   }

   /**
    * Load all ScryfallDBs in the specified directory path. Additional options allow filtering by DB type.
    *
    * @param options - Options.
    *
    * @param options.dirpath - Directory path to load.
    *
    * @param [options.type] - Match type of CardDB.
    *
    * @param [options.walk] - Walk all subdirectories for CardDB files to load; default: `false`
    *
    * @returns Configured {@link CardDB.Stream.Reader} instances for the found JSON card DB collections.
    */
   static async loadAll({ dirpath, type, walk = false }:
    { dirpath: string, type?: ScryfallDB.File.DBType | Iterable<ScryfallDB.File.DBType>, walk?: boolean }):
     Promise<ScryfallDB.Stream.Reader[]>
   {
      if (!isDirectory(dirpath)) { throw new Error(`ScryfallDB.loadAll error: 'dirpath' is not a directory.`); }
      if (typeof walk !== 'boolean') { throw new TypeError(`ScryfallDB.loadAll error: 'walk' is not a boolean.`); }

      if (type !== void 0 && !this.isValidSourceType(type) && !isIterable(type))
      {
         throw new Error(`ScryfallDB.loadAll error: 'type' is not a valid ScryfallDB.File.DBType or list of DB types.`);
      }

      const results: ScryfallDB.Stream.Reader[] = [];

      const dbFiles = await getFileList({
         dir: dirpath,
         includeFile: /\.json(\.gz)?$/,
         resolve: true,
         walk
      });

      const typeSet: Set<ScryfallDB.File.DBType> | undefined = type && typeof type !== 'string' ? new Set(type) :
       void 0;

      for (const filepath of dbFiles)
      {
         try
         {
            const scryStream = await this.load({ filepath });

            // Reject any CardDB that doesn't match the requested `CardDB.File.DBType`.
            if (type !== void 0 && ((typeof type === 'string' && scryStream.sourceMeta.type !== type) ||
             ((typeSet instanceof Set) && !typeSet.has(scryStream.sourceMeta.type))))
            {
               continue;
            }

            results.push(scryStream);
         }
         catch { /**/ }
      }

      return results;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Loads the `meta` and `sourceMeta` object of a ScryfallDB via streaming.
    *
    * @param filepath - File path to attempt to load.
    *
    * @returns `meta` / `sourceMeta`.
    */
   static async #loadMeta(filepath: string):
    Promise<{ meta: Record<string, any>, sourceMeta: Record<string, any> } | undefined>
   {
      const metaReadable = createReadable(filepath);
      const metaSourceReadable = createReadable(filepath);

      const metaPipeline = chain([
         metaReadable,
         parser(),
         pick({ filter: 'meta' }),
         streamValues()
      ]);

      const [{ value: meta }] = await once(metaPipeline, 'data');

      metaPipeline.destroy();
      metaReadable.destroy();

      const metaSourcePipeline = chain([
         metaSourceReadable,
         parser(),
         pick({ filter: 'sourceMeta' }),
         streamValues()
      ]);

      const [{ value: sourceMeta }] = await once(metaSourcePipeline, 'data');

      metaSourcePipeline.destroy();
      metaSourceReadable.destroy();

      return isObject(meta) && isObject(sourceMeta) ? { meta, sourceMeta } : void 0;
   }

   /**
    * Validates a ScryfallDB meta object.
    *
    * @param filepath - File path meta object loaded from.
    *
    * @param data - Combined metadata.
    *
    * @returns Validated metadata.
    *
    * @throws {Error}
    *
    * @privateRemarks
    * TODO: Eventually more thorough validation.
    */
   static #validateMeta(filepath: string,
    data: { meta: Record<string, any>, sourceMeta: Record<string, any> } | undefined): ScryfallDB.File.Metadata | string
   {
      if (!isObject(data) || !isObject(data?.meta) || !isObject(data?.sourceMeta))
      {
         throw new Error(`ScryfallDB.load error: Could not load metadata for ${filepath}`);
      }

      if (data.meta.type !== 'scryfall-db-cards' || typeof data.meta.cliVersion !== 'string' ||
       typeof data.meta.generatedAt !== 'string')
      {
         throw new Error(`ScryfallDB.load error: Invalid metadata for ${filepath}`);
      }

      return data as ScryfallDB.File.Metadata;
   }
}

declare namespace ScryfallDB
{
   export {
      File,
      Meta,
      Stream
   };
}

export { ScryfallDB };

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Provide a wrapper around a Scryfall Card DB with streaming access to cards.
 */
class ScryCardStream implements ScryfallDB.Stream.Reader
{
   /**
    * File path of DB.
    */
   readonly #filepath: string;

   readonly #metadata: ScryfallDB.File.Metadata;

   /**
    * @param filepath - File path of DB.
    *
    * @param metadata - Combined metadata.
    */
   constructor(filepath: string, metadata: ScryfallDB.File.Metadata)
   {
      this.#filepath = filepath;

      this.#metadata = deepFreeze(metadata);
   }

   /**
    * @returns The associated filepath.
    */
   get filepath(): string
   {
      return this.#filepath;
   }

   /**
    * @returns The Scrydex metadata for a Scryfall DB.
    */
   get meta(): ScryfallDB.Meta.Scrydex
   {
      return this.#metadata.meta;
   }

   /**
    * @returns The Scryfall bulk data object associated with this DB.
    */
   get sourceMeta(): ScryfallDB.Meta.ScryfallBulkData
   {
      return this.#metadata.sourceMeta;
   }

   /**
    * Stream the card data in the DB asynchronously.
    *
    * @param [options] - Optional options.
    *
    * @returns Asynchronous iterator over validated card entries.
    *
    * @privateRemarks
    * TODO: Eventually update with TS types for Scryfall card shape.
    */
   async* asStream({ filterFn }: ScryfallDB.Stream.StreamOptions = {}): AsyncIterable<Record<string, any>>
   {
      const source = createReadable(this.#filepath);

      const pipeline = chain([
         source,
         parser(),
         pick({ filter: 'cards' }),
         streamArray()
      ]);

      for await (const { value: card } of pipeline)
      {
         if (typeof card !== 'object' || card === null || card.object !== 'card') { continue; }

         if (filterFn && !filterFn(card)) { continue; }

         yield card;
      }
   }
}
