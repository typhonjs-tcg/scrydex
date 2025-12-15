import fs               from 'node:fs';

import {
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamArray }  from 'stream-json/streamers/StreamArray';
import { streamObject } from 'stream-json/streamers/StreamObject';

import { VERSION }      from '#version';

import {
   Card,
   CollectionMetaData } from '#types';

export class CardDB
{
   static async loadStream({ filepath }: { filepath: string })
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
         generatedAt: new Date().toISOString(),
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

   // TODO: Finish validation
   static #validateMeta(filepath: string, meta: Record<string, any> | undefined): CollectionMetaData | string
   {
      if (!meta) { throw new Error(`CardDB.load error: Could not load meta data for ${filepath}`); }

      return meta as CollectionMetaData;
   }
}

class CardStream
{
   readonly #filepath: string;

   readonly #meta: CollectionMetaData;

   constructor(filepath: string, meta: CollectionMetaData)
   {
      this.#filepath = filepath;
      this.#meta = Object.freeze(meta);
   }

   get type(): 'collection' | 'game_format'
   {
      return this.#meta.type;
   }

   get name(): string | undefined
   {
      return this.#meta.name;
   }

   get cliVersion(): string
   {
      return this.#meta.cliVersion;
   }

   get schemaVersion(): string
   {
      return this.#meta.schemaVersion;
   }

   async *asStream(): AsyncIterable<Card>
   {
      const pipeline = chain([
         fs.createReadStream(this.#filepath),
         parser(),
         pick({ filter: 'cards' }),
         streamArray()
      ]);

      for await (const { value } of pipeline)
      {
         yield value;
      }
   }
}
