import fs               from 'node:fs';

import { chain }        from 'stream-chain';
import { parser }       from 'stream-json';
import { pick }         from 'stream-json/filters/Pick';
import { streamArray }  from 'stream-json/streamers/StreamArray';

import {
   CardFilter,
   isGroupKind }        from '#data';

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
   type CardStreamOptions };
