import fs               from 'node:fs';

import {
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { streamArray }  from 'stream-json/streamers/StreamArray';

import type { Stream }  from './types-scryfall';

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
   export { Stream };
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
    */
   async* asStream({ filterFn }: ScryfallDB.Stream.StreamOptions = {}): AsyncIterable<Record<string, any>>
   {
      const pipeline = chain([
         fs.createReadStream(this.#filepath),
         parser(),
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
