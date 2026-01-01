import fs               from 'node:fs';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamArray }  from 'stream-json/streamers/StreamArray';

import {
   CardFilter,
   isGroupKind,
   uniqueCardKey }      from '#data';

import type {
   Card,
   CardDB,
   CardDBMetadata,
   CardDBMetadataGroups }     from '#types';

import { ConfigCardFilter }   from "#types-data";

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
    * Card / filename group associations.
    */
   readonly #groups: CardDBMetadataGroups<Set<string>> = {};

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

      for (const group in meta.groups)
      {
         if (!isGroupKind(group)) { continue; }

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
   get meta(): Readonly<CardDBMetadata>
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
   async *asStream({ filter, groups, isExportable }: CardStreamOptions = {}): AsyncIterable<Card>
   {
      const pipeline = chain([
         fs.createReadStream(this.#filepath),
         parser(),
         pick({ filter: 'cards' }),
         streamArray()
      ]);

      const hasFilterChecks = CardFilter.hasFilterChecks(filter);

      let excludeDecks = typeof groups?.decks === 'boolean' && !groups.decks;
      let excludeExternal = typeof groups?.external === 'boolean' && !groups.external;
      let excludeProxy = typeof groups?.proxy === 'boolean' && !groups.proxy;

      // Automatically set all non-exportable groups to be tested.
      if (isExportable)
      {
         excludeDecks = false;
         excludeExternal = false;
         excludeProxy = false;
      }

      for await (const { value } of pipeline)
      {
         if (typeof value !== 'object' || value === null || value.object !== 'card') { continue; }

         if (hasFilterChecks && !CardFilter.test(value, filter)) { continue; }

         if (excludeDecks && this.isCardGroup(value, 'decks')) { continue; }
         if (excludeExternal && this.isCardGroup(value, 'external')) { continue; }
         if (excludeProxy && this.isCardGroup(value, 'proxy')) { continue; }

         yield value;
      }
   }

   /**
    * Computes a quantity-based diff between this CardStream and a comparison CardStream instance.
    *
    * Cards are compared using a composite identity key (`scryfall_id + foil + lang`) via {@link uniqueCardKey} so that
    * physically distinct printings are treated independently.
    *
    * The diff is asymmetric:
    * - `this` CardStream instance is treated as the baseline card pool.
    * - `comparison` is treated as the comparison target.
    *
    * The result captures:
    * - cards newly **added** in `comparison`.
    * - cards **removed** since `baseline`.
    * - cards whose quantities **changed** between the two CardStreams.
    *
    * This function is intentionally card-data–light. It operates only on identity keys and quantities. Any card
    * metadata required for reporting should be collected in a subsequent streaming pass.
    *
    * @param comparison - Comparison CardStream.
    *
    * @param [streamOptions] - Optional CardStream options. By default, only `exportable` cards are compared.
    *
    * @returns CardStreamDiff object.
    */
   async diff(comparison: CardStream, streamOptions?: CardStreamOptions): Promise<CardStreamDiff>
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
   getAll(): Card[]
   {
      const db = JSON.parse(fs.readFileSync(this.#filepath, 'utf-8')) as CardDB;

      return Array.isArray(db.cards) ? db.cards : [];
   }

   /**
    * Builds a quantity map for cards in this CardStream.
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
    * @param options - Optional stream selection options; default: exportable cards only.
    *
    * @returns A map of unique card identity keys to total quantities.
    */
   async getQuantityMap(options: CardStreamOptions = { isExportable: true }): Promise<Map<string, number>>
   {
      const map: Map<string, number> = new Map();

      for await (const card of this.asStream(options))
      {
         if (Number.isInteger(card.quantity) && card.quantity > 0)
         {
            const key = uniqueCardKey(card);
            map.set(key, (map.get(key) ?? 0) + card.quantity);
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
   isCardExportable(card: Card): boolean
   {
      for (const group in this.#groups)
      {
         if (this.#groups?.[group as keyof CardDBMetadataGroups]?.has(card.filename)) { return false; }
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
   isCardGroup(card: Card, group: keyof CardDBMetadataGroups): boolean
   {
      return this.#groups?.[group]?.has(card.filename) ?? false;
   }
}

/**
 * Result of diffing two CardStream instances.
 *
 * All keys are composite card identities (`scryfall_id + foil + lang`) via {@link uniqueCardKey}.
 */
interface CardStreamDiff
{
   /**
    * Card identities present only in the comparison stream.
    */
   added: Set<string>;

   /**
    * Card identities present only in the baseline stream.
    */
   removed: Set<string>;

   /**
    * Quantity deltas for card identities present in both streams.
    *
    * Positive values indicate an increase.
    * Negative values indicate a decrease.
    */
   changed: Map<string, number>;
}

/**
 * Options for {@link CardStream.asStream}.
 */
interface CardStreamOptions
{
   /**
    * Optional card-level filtering configuration.
    */
   filter?: ConfigCardFilter;

   /**
    * Exclude cards belonging to specific metadata groups.
    *
    * A group is excluded by specifying `false`.
    */
   groups?: Partial<Record<keyof CardDBMetadataGroups, false>>;

   /**
    * When true, skip all non-exportable card entries; IE all decks, externals, proxy groups.
    */
   isExportable?: true;
}

export {
   CardStream,
   type CardStreamDiff,
   type CardStreamOptions };
