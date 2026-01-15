import fs                  from 'node:fs';
import zlib                from 'node:zlib';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import { chain }           from 'stream-chain';
import { parser }          from 'stream-json';
import { pick }            from 'stream-json/filters/Pick';
import { streamArray }     from 'stream-json/streamers/StreamArray';
import { streamObject }    from 'stream-json/streamers/StreamObject';

import { isFileGzip }      from '#scrydex/util';

import type { Readable }   from 'node:stream';

/**
 * Provides a reusable / generic streamable interface over the Scryfall card DB.
 */
abstract class ScryfallDB
{
   /**
    * Attempts to load a Scrydex JSON card DB from the given file path.
    *
    * @param options - Options.
    *
    * @param options.filepath - Filepath to load.
    *
    * @returns {@link ScryfallDB.Stream.Reader} instance.
    * @throws Error
    */
   static async load({ filepath }: { filepath: string }): Promise<ScryfallDB.Stream.Reader>
   {
      if (isDirectory(filepath)) { throw new Error(`ScryfallDB.load error: 'filepath' is a directory.`); }
      if (!isFile(filepath)) { throw new Error(`ScryfallDB.load error: 'filepath' is not a valid file.`); }

      return new ScryCardStream(filepath);
   }
}

declare namespace ScryfallDB
{
   export namespace File
   {
      /**
       * Defines the Scrydex / Scryfall DB card DB JSON file format.
       */
      export interface JSON
      {
         /**
          * Scrydex specific metadata.
          */
         meta: Meta.Scrydex;

         /**
          * The Scryfall bulk data object describing this card DB.
          */
         sourceMeta: Meta.ScryfallBulkData;

         /**
          * Array of Scryfall card objects.
          *
          * @privateRemarks
          * TODO: Eventually update with TS types for Scryfall card shape.
          */
         cards: Record<string, any>[];
      }
   }

   /**
    * Defines the metadata objects stored in {@link File.JSON}.
    */
   export namespace Meta
   {
      /**
       * The Scrydex specific metadata stored as `meta` in a `ScryfallDB` data file.
       */
      export interface Scrydex
      {
         type: 'scryfall-db-cards';

         /** Generating CLI version. */
         cliVersion: string;

         /** UTC Date when generated. */
         generatedAt: string;
      }

      /**
       * Scryfall API bulk data object metadata response. This is stored as `sourceMeta` in a `ScryfallDB` data file.
       *
       * @see https://scryfall.com/docs/api/bulk-data/type
       */
      export interface ScryfallBulkData
      {
         object: 'bulk_data';

         /** A unique ID for this bulk item. */
         id: string;

         /** A computer-readable string for the kind of bulk item */
         type: string;

         /** The time when this file was last updated. */
         updated_at: string;

         /** The URI that hosts this bulk file for fetching. */
         uri: string;

         /** A human-readable name for this file. */
         name: string;

         /** A human-readable description for this file. */
         description: string,

         /** The size of this file in integer bytes. */
         size: number;

         /** The URI that hosts this bulk file for fetching. */
         download_uri: string;

         /** The MIME type of this file. */
         content_type: string;

         /** The Content-Encoding encoding that will be used to transmit this file when you download it. */
         content_encoding: string;
      }
   }

   export namespace Stream
   {
      export interface Reader
      {
         /**
          * @returns The associated filepath.
          */
         get filepath(): string;

         /**
          * Stream the card data in the DB asynchronously.
          *
          * @param [options] - Optional options.
          *
          * @returns Asynchronous iterator over validated card entries.
          */
         asStream(options?: StreamOptions): AsyncIterable<Record<string, any>>;
      }

      /**
       * Options for {@link Stream.Reader.asStream}.
       */
      interface StreamOptions
      {
         /**
          * Optional predicate applied to each card in the stream.
          *
          * When provided, the card is yielded only if this function returns `true`. This predicate is applied after all
          * structured stream options (filters, group exclusions, identity selection) have been evaluated.
          *
          * Intended for advanced or ad-hoc use cases. Structured filters should be preferred where possible.
          */
         filterFn?: (card: Record<string, unknown>) => boolean;
      }
   }
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

   /**
    * @param filepath - File path of DB.
    */
   constructor(filepath: string)
   {
      this.#filepath = filepath;
   }

   /**
    * @returns The associated filepath.
    */
   get filepath(): string
   {
      return this.#filepath;
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
      const isGzip = isFileGzip(this.#filepath);

      const input = fs.createReadStream(this.#filepath);

      const source: Readable = isGzip ? input.pipe(zlib.createGunzip()) : input;

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
