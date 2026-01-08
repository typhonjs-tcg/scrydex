// import fs                     from 'node:fs';
//
// import { chain }              from 'stream-chain';
// import { parser }             from 'stream-json';
// import { pick }               from 'stream-json/filters/Pick';
// import { streamArray }        from 'stream-json/streamers/StreamArray';
//
// import { CardFilter }         from '#scrydex/data/db/util';
//
// import { CardDB }             from './CardDB';
//
// import type { BasicLogger }   from '@typhonjs-utils/logger-color';
//
// /**
//  * Provide a wrapper around a JSON Card DB with streaming access to cards.
//  */
// export class CardStream implements CardDB.Stream.Reader
// {
//    /**
//     * File path of DB.
//     */
//    readonly #filepath: string;
//
//    /**
//     * Card / filename group associations.
//     */
//    readonly #groups: CardDB.File.MetadataGroups<Set<string>> = {};
//
//    /**
//     * Metadata object in DB.
//     */
//    readonly #meta: CardDB.File.Metadata;
//
//    /**
//     * @param filepath - File path of DB.
//     *
//     * @param meta - Metadata object of DB.
//     */
//    constructor(filepath: string, meta: CardDB.File.Metadata)
//    {
//       this.#filepath = filepath;
//       this.#meta = Object.freeze(meta);
//
//       for (const group in meta.groups)
//       {
//          if (!CardDB.isGroupKind(group)) { continue; }
//
//          if (Array.isArray(meta.groups[group])) { this.#groups[group] = new Set(meta.groups[group]); }
//       }
//    }
//
//    /**
//     * @returns The associated filepath.
//     */
//    get filepath(): string
//    {
//       return this.#filepath;
//    }
//
//    /**
//     * @returns CardDB metadata.
//     */
//    get meta(): Readonly<CardDB.File.Metadata>
//    {
//       return this.#meta;
//    }
//
//    /**
//     * Stream the card data in the DB asynchronously.
//     *
//     * @param [options] - Optional options.
//     *
//     * @returns Asynchronous iterator over validated card entries.
//     */
//    async *asStream({ filter, filterFn, groups, isExportable, uniqueKeys, uniqueOnce }: CardDB.Stream.Options = {}):
//     AsyncIterable<CardDB.Data.Card>
//    {
//       const pipeline = chain([
//          fs.createReadStream(this.#filepath),
//          parser(),
//          pick({ filter: 'cards' }),
//          streamArray()
//       ]);
//
//       const hasFilterChecks = CardFilter.hasFilterChecks(filter);
//
//       // Group checks to enable.
//       let excludeDecks = typeof groups?.decks === 'boolean' && !groups.decks;
//       let excludeExternal = typeof groups?.external === 'boolean' && !groups.external;
//       let excludeProxy = typeof groups?.proxy === 'boolean' && !groups.proxy;
//
//       // Automatically set all non-exportable groups to be tested.
//       if (isExportable)
//       {
//          excludeDecks = true;
//          excludeExternal = true;
//          excludeProxy = true;
//       }
//
//       // When `uniqueOnce` is true track seen unique keys; rejecting duplicate like cards.
//       const uniqueKeysSeen = typeof uniqueOnce === 'boolean' && uniqueOnce ? new Set<string>() : null;
//
//       for await (const { value: card } of pipeline)
//       {
//          if (typeof card !== 'object' || card === null || card.object !== 'card') { continue; }
//
//          if (excludeDecks && this.isCardGroup(card, 'decks')) { continue; }
//          if (excludeExternal && this.isCardGroup(card, 'external')) { continue; }
//          if (excludeProxy && this.isCardGroup(card, 'proxy')) { continue; }
//
//          if (hasFilterChecks && !CardFilter.test(card, filter)) { continue; }
//
//          if (uniqueKeys)
//          {
//             const uniqueKey = CardDB.uniqueCardKey(card);
//
//             if (!uniqueKeys.has(uniqueKey) || uniqueKeysSeen?.has(uniqueKey)) { continue; }
//
//             if (uniqueKeysSeen) { uniqueKeysSeen.add(uniqueKey); }
//          }
//
//          if (filterFn && !filterFn(card)) { continue; }
//
//          yield card;
//       }
//    }
//
//    /**
//     * Computes a quantity-based diff between this card stream and a comparison card stream instance.
//     *
//     * Cards are compared using a composite identity key (`scryfall_id + foil + lang`) via {@link uniqueCardKey} so that
//     * physically distinct printings are treated independently.
//     *
//     * The diff is asymmetric:
//     * - `this` card stream instance is treated as the baseline card pool.
//     * - `comparison` is treated as the comparison target.
//     *
//     * The result captures:
//     * - cards newly **added** in `comparison`.
//     * - cards **removed** since `baseline`.
//     * - cards whose quantities **changed** between the two card streams.
//     *
//     * This function is intentionally card-data–light. It operates only on identity keys and quantities. Any card
//     * metadata required for reporting should be collected in a subsequent streaming pass.
//     *
//     * @param comparison - Comparison card stream.
//     *
//     * @param [streamOptions] - Optional card stream options. By default, only `exportable` cards are compared.
//     *
//     * @returns CardStreamDiff object.
//     */
//    async diff(comparison: CardStream, streamOptions?: CardDB.Stream.Options): Promise<CardDB.Stream.Diff>
//    {
//       // Build identity → quantity maps for both streams.
//       const mapB = await this.getQuantityMap(streamOptions);
//       const mapC = await comparison.getQuantityMap(streamOptions);
//
//       // Extract identity key sets for structural comparison.
//       const keysB = new Set(mapB.keys());
//       const keysC = new Set(mapC.keys());
//
//       // Cards present only in the comparison stream.
//       const added = keysC.difference(keysB);
//
//       // Cards no longer present in the comparison stream.
//       const removed = keysB.difference(keysC);
//
//       // Cards present in both streams (potential quantity changes).
//       const shared = keysB.intersection(keysC);
//
//       // Quantity changes for shared keys.
//       const changed = new Map<string, number>();
//
//       for (const key of shared)
//       {
//          const qtyA = mapB.get(key)!;
//          const qtyB = mapC.get(key)!;
//
//          const delta = qtyB - qtyA;
//          if (delta !== 0) { changed.set(key, delta); }
//       }
//
//       return { added, removed, changed };
//    }
//
//    /**
//     * Return synchronously all card data in the DB.
//     *
//     * Note: Individual entries are not validated for typeof `object` or the Scryfall `object: 'card'` association.
//     *
//     * @returns All cards in the collection.
//     */
//    getAll(): CardDB.Data.Card[]
//    {
//       const db = JSON.parse(fs.readFileSync(this.#filepath, 'utf-8')) as CardDB.File.JSON;
//
//       return Array.isArray(db.cards) ? db.cards : [];
//    }
//
//    /**
//     * Builds a quantity map for cards in this card stream.
//     *
//     * Cards are grouped by their composite identity key (`scryfall_id + foil + lang`), and the quantities of
//     * matching entries are summed.
//     *
//     * This method is streaming and memory-efficient: it does not retain card objects, only identity keys and
//     * aggregated quantities.
//     *
//     * The returned map is suitable for:
//     * - diff operations
//     * - export coalescing
//     * - analytics and reporting
//     *
//     * @param [options] - Optional stream selection options.
//     *
//     * @param [logger] - Optional logging.
//     *
//     * @returns A map of unique card identity keys to total quantities.
//     */
//    async getQuantityMap(options?: CardDB.Stream.Options, logger?: BasicLogger): Promise<Map<string, number>>
//    {
//       const map: Map<string, number> = new Map();
//
//       for await (const card of this.asStream(options))
//       {
//          if (Number.isInteger(card.quantity) && card.quantity > 0)
//          {
//             const key = CardDB.uniqueCardKey(card);
//             map.set(key, (map.get(key) ?? 0) + card.quantity);
//          }
//          else if (options?.logger)
//          {
//             logger?.warn(`Skipping card (${card.name}) from '${this.meta.name}' due to invalid quantity: ${
//              card.quantity}`);
//          }
//       }
//
//       return map;
//    }
//
//    /**
//     * Verifies that the card is not part of a non-exportable group. Presently all groups are non-exportable.
//     * IE `decks`, `external` or `proxy`.
//     *
//     * @param card -
//     *
//     * @returns Whether card can be exported.
//     */
//    isCardExportable(card: CardDB.Data.Card): boolean
//    {
//       for (const group in this.#groups)
//       {
//          if (this.#groups?.[group as keyof CardDB.File.MetadataGroups]?.has(card.filename)) { return false; }
//       }
//
//       return true;
//    }
//
//    /**
//     * Checks the meta _external_ file names for a card file name match.
//     *
//     * @param card -
//     *
//     * @param group - External card group to test for inclusion.
//     *
//     * @returns Whether card is part of given group.
//     */
//    isCardGroup(card: CardDB.Data.Card, group: keyof CardDB.File.MetadataGroups): boolean
//    {
//       return this.#groups?.[group]?.has(card.filename) ?? false;
//    }
// }
