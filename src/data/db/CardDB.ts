import fs                     from 'node:fs';
import path                   from 'node:path';

import {
   getFileList,
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import {
   isIterable,
   isObject }                 from '@typhonjs-utils/object';

import { chain }              from 'stream-chain';
import { parser }             from 'stream-json';
import { pick }               from 'stream-json/filters/Pick';
import { streamArray }        from 'stream-json/streamers/StreamArray';
import { streamObject }       from 'stream-json/streamers/StreamObject';

import { VERSION }            from '#scrydex';

import { ScryfallData }       from '#scrydex/data/scryfall';

import {
   CardFields,
   CardFilter,
   Price,
   PrintCardFields }          from './services';

import type { BasicLogger }   from '@typhonjs-utils/logger-color';

import type {
   Data,
   File,
   Options,
   Stream }                   from './types-db';

import type { Services }      from './services/types-services';

/**
 * Provides loading / saving of Scrydex CardDB files including streaming support.
 */
class CardDB
{
   static get CardFields(): Services.CardFields { return CardFields; }

   static get CardFilter(): Services.CardFilter { return CardFilter; }

   static get Price(): Services.Price { return Price; }

   static get PrintCardFields(): Services.PrintCardFields { return PrintCardFields; }

   /**
    * Provides a type guard for {@link CardDB.File.MetadataGroups} keys.
    *
    * @param value -
    */
   static isGroupKind(value: unknown): value is keyof CardDB.File.MetadataGroups
   {
      return value === 'decks' || value === 'external' || value === 'proxy';
   }

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
      if (!isDirectory(dirpath)) { throw new Error(`CardDB.loadAll error: 'dirpath' is not a directory.`); }
      if (typeof walk !== 'boolean') { throw new TypeError(`CardDB.loadAll error: 'walk' is not a boolean.`); }

      if (format !== void 0 && typeof format !== 'string' && !isIterable(format))
      {
         throw new TypeError(`CardDB.loadAll error: 'format' is not a string or list of strings.`);
      }

      if (type !== void 0 && !this.isValidType(type) && !isIterable(type))
      {
         throw new Error(`CardDB.loadAll error: 'type' is not a valid CardDB.File.DBType or list of DB types.`);
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
         throw new Error(`CardDB.save error: 'type' must be 'inventory', 'sorted', or 'sorted_format'.`);
      }

      if (meta.type === 'sorted_format' && !ScryfallData.isSupportedFormat(meta.format))
      {
         throw new TypeError(
          `CardDB.save error: A sorted format must include a supported game format in 'meta.format'.`);
      }

      const name = meta.name === void 0 && typeof meta.name !== 'string' ? path.basename(filepath, '.json') : meta.name;

      const metadata: CardDB.File.Metadata = {
         ...meta,
         name,
         cliVersion: VERSION.package,
         schemaVersion: VERSION.schema,
         generatedAt: this.#execTime.toISOString()
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

   /**
    * Creates a unique composite key coalescing the <Scryfall ID>:<Foil / Finish>:<Language>.
    *
    * @privateRemarks
    * As things go the Scryfall ID is _mostly_ unique, but the foil / finish status is separate of the Scryfall ID.
    * Language is also a flexible field with many online collection services allowing free user selection of the cards
    * potential language.
    *
    * @param card -
    *
    * @returns Unique card key.
    */
   static uniqueCardKey(card: CardDB.Data.Card)
   {
      return `${card.scryfall_id}:${card.foil ?? 'normal'}:${card.lang_csv ?? card.lang}`;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Provides a consistent `Date` instance for execution time of the CLI ensuring all DB files written share the same
    * `generatedAt` date.
    */
   static #execTime = new Date();

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
      if (!meta) { throw new Error(`CardDB.load error: Could not load meta data for ${filepath}`); }

      return meta as CardDB.File.Metadata;
   }
}

declare namespace CardDB
{
   export {
      Data,
      File,
      Options,
      Services,
      Stream };
}

export { CardDB };

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Provide a wrapper around a JSON Card DB with streaming access to cards.
 */
class CardStream implements CardDB.Stream.Reader
{
   /**
    * File path of DB.
    */
   readonly #filepath: string;

   /**
    * Card / filename group associations.
    */
   readonly #groups: CardDB.File.MetadataGroups<Set<string>> = {};

   /**
    * Metadata object in DB.
    */
   readonly #meta: CardDB.File.Metadata;

   /**
    * @param filepath - File path of DB.
    *
    * @param meta - Metadata object of DB.
    */
   constructor(filepath: string, meta: CardDB.File.Metadata)
   {
      this.#filepath = filepath;
      this.#meta = Object.freeze(meta);

      for (const group in meta.groups)
      {
         if (!CardDB.isGroupKind(group)) { continue; }

         if (Array.isArray(meta.groups[group])) { this.#groups[group] = new Set(meta.groups[group]); }
      }
   }

   /**
    * @returns The associated filepath.
    */
   get filepath(): string
   {
      return this.#filepath;
   }

   /**
    * @returns CardDB metadata.
    */
   get meta(): Readonly<CardDB.File.Metadata>
   {
      return this.#meta;
   }

   /**
    * Stream the card data in the DB asynchronously.
    *
    * @param [options] - Optional options.
    *
    * @returns Asynchronous iterator over validated card entries.
    */
   async *asStream({ filter, filterFn, groups, isExportable, uniqueKeys, uniqueOnce }:
    CardDB.Stream.StreamOptions = {}): AsyncIterable<CardDB.Data.Card>
   {
      const pipeline = chain([
         fs.createReadStream(this.#filepath),
         parser(),
         pick({ filter: 'cards' }),
         streamArray()
      ]);

      const hasFilterChecks = CardFilter.hasFilterChecks(filter);

      // Group checks to enable.
      let excludeDecks = typeof groups?.decks === 'boolean' && !groups.decks;
      let excludeExternal = typeof groups?.external === 'boolean' && !groups.external;
      let excludeProxy = typeof groups?.proxy === 'boolean' && !groups.proxy;

      // Automatically set all non-exportable groups to be tested.
      if (isExportable)
      {
         excludeDecks = true;
         excludeExternal = true;
         excludeProxy = true;
      }

      // When `uniqueOnce` is true track seen unique keys; rejecting duplicate like cards.
      const uniqueKeysSeen = typeof uniqueOnce === 'boolean' && uniqueOnce ? new Set<string>() : null;

      for await (const { value: card } of pipeline)
      {
         if (typeof card !== 'object' || card === null || card.object !== 'card') { continue; }

         if (excludeDecks && this.isCardGroup(card, 'decks')) { continue; }
         if (excludeExternal && this.isCardGroup(card, 'external')) { continue; }
         if (excludeProxy && this.isCardGroup(card, 'proxy')) { continue; }

         if (hasFilterChecks && !CardFilter.test(card, filter)) { continue; }

         if (uniqueKeys)
         {
            const uniqueKey = CardDB.uniqueCardKey(card);

            if (!uniqueKeys.has(uniqueKey) || uniqueKeysSeen?.has(uniqueKey)) { continue; }

            if (uniqueKeysSeen) { uniqueKeysSeen.add(uniqueKey); }
         }

         if (filterFn && !filterFn(card)) { continue; }

         yield card;
      }
   }

   /**
    * Computes a quantity-based diff between this card stream and a comparison card stream instance.
    *
    * Cards are compared using a composite identity key (`scryfall_id + foil + lang`) via {@link uniqueCardKey} so that
    * physically distinct printings are treated independently.
    *
    * The diff is asymmetric:
    * - `this` card stream instance is treated as the baseline card pool.
    * - `comparison` is treated as the comparison target.
    *
    * The result captures:
    * - cards newly **added** in `comparison`.
    * - cards **removed** since `baseline`.
    * - cards whose quantities **changed** between the two card streams.
    *
    * This function is intentionally card-data–light. It operates only on identity keys and quantities. Any card
    * metadata required for reporting should be collected in a subsequent streaming pass.
    *
    * @param comparison - Comparison card stream.
    *
    * @param [streamOptions] - Optional card stream options. By default, only `exportable` cards are compared.
    *
    * @returns CardStreamDiff object.
    */
   async diff(comparison: CardStream, streamOptions?: CardDB.Stream.StreamOptions): Promise<CardDB.Stream.Diff>
   {
      // Build identity → quantity maps for both streams.
      const mapB = await this.getQuantityMap(streamOptions);
      const mapC = await comparison.getQuantityMap(streamOptions);

      // Extract identity key sets for structural comparison.
      const keysB = new Set(mapB.keys());
      const keysC = new Set(mapC.keys());

      // Cards present only in the comparison stream.
      const added = keysC.difference(keysB);

      // Cards no longer present in the comparison stream.
      const removed = keysB.difference(keysC);

      // Cards present in both streams (potential quantity changes).
      const shared = keysB.intersection(keysC);

      // Quantity changes for shared keys.
      const changed = new Map<string, number>();

      for (const key of shared)
      {
         const qtyA = mapB.get(key)!;
         const qtyB = mapC.get(key)!;

         const delta = qtyB - qtyA;
         if (delta !== 0) { changed.set(key, delta); }
      }

      return { added, removed, changed };
   }

   /**
    * Return synchronously all card data in the DB.
    *
    * Note: Individual entries are not validated for typeof `object` or the Scryfall `object: 'card'` association.
    *
    * @returns All cards in the collection.
    */
   getAll(): CardDB.Data.Card[]
   {
      const db = JSON.parse(fs.readFileSync(this.#filepath, 'utf-8')) as CardDB.File.JSON;

      return Array.isArray(db.cards) ? db.cards : [];
   }

   /**
    * Builds a quantity map for cards in this card stream.
    *
    * Cards are grouped by their composite identity key (`scryfall_id + foil + lang`), and the quantities of
    * matching entries are summed.
    *
    * This method is streaming and memory-efficient: it does not retain card objects, only identity keys and
    * aggregated quantities.
    *
    * The returned map is suitable for:
    * - diff operations
    * - export coalescing
    * - analytics and reporting
    *
    * @param [options] - Optional stream selection options.
    *
    * @param [logger] - Optional logging.
    *
    * @returns A map of unique card identity keys to total quantities.
    */
   async getQuantityMap(options?: CardDB.Stream.StreamOptions, logger?: BasicLogger): Promise<Map<string, number>>
   {
      const map: Map<string, number> = new Map();

      for await (const card of this.asStream(options))
      {
         if (Number.isInteger(card.quantity) && card.quantity > 0)
         {
            const key = CardDB.uniqueCardKey(card);
            map.set(key, (map.get(key) ?? 0) + card.quantity);
         }
         else if (options?.logger)
         {
            logger?.warn(`Skipping card (${card.name}) from '${this.meta.name}' due to invalid quantity: ${
             card.quantity}`);
         }
      }

      return map;
   }

   /**
    * Verifies that the card is not part of a non-exportable group. Presently all groups are non-exportable.
    * IE `decks`, `external` or `proxy`.
    *
    * @param card -
    *
    * @returns Whether card can be exported.
    */
   isCardExportable(card: CardDB.Data.Card): boolean
   {
      for (const group in this.#groups)
      {
         if (this.#groups?.[group as keyof CardDB.File.MetadataGroups]?.has(card.filename)) { return false; }
      }

      return true;
   }

   /**
    * Checks the meta _external_ file names for a card file name match.
    *
    * @param card -
    *
    * @param group - External card group to test for inclusion.
    *
    * @returns Whether card is part of given group.
    */
   isCardGroup(card: CardDB.Data.Card, group: keyof CardDB.File.MetadataGroups): boolean
   {
      return this.#groups?.[group]?.has(card.filename) ?? false;
   }
}

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

