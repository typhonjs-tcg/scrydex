import type { BasicLogger }   from "@typhonjs-utils/logger-color";

import type { CSVCard }       from '#scrydex/data/import';
import type { ScryfallData }  from '#scrydex/data/scryfall';

// Namespace Data ----------------------------------------------------------------------------------------------------

/**
 * Defines the enriched, but reduced set of card data transferred from the Scryfall DB.
 *
 * @see https://scryfall.com/docs/api/cards
 */
interface Card extends CSVCard
{
   /**
    * This card’s border color: black, white, borderless, yellow, silver, or gold
    */
   border_color: string;

   /**
    * An array of Card Face objects, if this card is multifaced.
    */
   card_faces?: CardFace[] | null;

   /**
    * This card’s collector number. Note that collector numbers can contain non-numeric characters, such as letters or
    * `★`.
    */
   collector_number: string;

   /**
    * This card’s colors, if the overall card has colors defined by the rules. Otherwise, the colors will be on
    * the card_faces objects.
    */
   colors: ScryfallData.Colors;

   /**
    * This card’s color identity.
    */
   color_identity: ScryfallData.Colors;

   /**
    * The card’s mana value. Note that some funny cards have fractional mana costs.
    */
   cmc: number;

   /**
    * This card’s defense, if any. Battle cards.
    */
   defense?: string | null;

   /**
    * True if this card is on the Commander Game Changer list.
    *
    * @see https://mtg.wiki/page/Commander_(format)/Game_Changers
    */
   game_changer: boolean;

   /**
    * An array of keywords that this card uses, such as 'Flying' and 'Cumulative upkeep'.
    */
   keywords: string[];

   /**
    * Scryfall language code.
    */
   lang: string;

   /**
    * An object describing the legality of this card across play formats. Possible legalities are `legal`, `not_legal`,
    * `restricted`, and `banned`.
    */
   legalities: Record<string, string>;

   /**
    * This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.
    */
   loyalty?: string | null;

   /**
    * The mana cost for this card. This value will be any empty string "" if the cost is absent. Remember that per the
    * game rules, a missing mana cost and a mana cost of {0} are different values. Multi-faced cards will report this
    * value in card faces.
    */
   mana_cost: string;

   /**
    * The name of this card. If this card has multiple faces, this field will contain both names separated by ␣//␣.
    */
   name: string;

   /**
    * A unique ID for this card’s oracle identity. This value is consistent across reprinted card editions, and unique
    * among different cards with the same name.
    */
   oracle_id: string;

   /**
    * The Oracle text for this card, if any.
    */
   oracle_text: string;

   /**
    * This card’s power, if any. Note that some cards have powers that are not numeric, such as *.
    */
   power?: string | null;

   /**
    * Any USD price derived from Scryfall DB during conversion.
    */
   price: string | null;

   /**
    * The card name as printed in associated language.
    */
   printed_name?: string;

   /**
    * Colors of mana that this card could produce.
    */
   produced_mana?: ScryfallData.Colors;

   /**
    * This card’s rarity. One of `common`, `uncommon`, `rare`, `special`, `mythic`, or `bonus`.
    */
   rarity: string;

   /**
    * Rarity of original / first printing.
    */
   rarity_orig: string;

   /**
    * Rarity of recent / latest printing that isn't in high value (secret lair) / promo sets or is a promo card.
    */
   rarity_recent: string;

   /**
    * The date this card was first released.
    */
   released_at: string;

   /**
    * This card’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.
    */
   toughness?: string | null;

   /**
    * Normalized card type based on `type line` parsing.
    */
   type: string;

   /**
    * The type line of this card.
    */
   type_line: string;

   /**
    * True if this card is on the Reserved List.
    */
   reserved: boolean;

   /**
    * Scryfall URL for card.
    */
   scryfall_uri: string;

   /**
    * This card’s set code.
    *
    * @see https://en.wikipedia.org/wiki/List_of_Magic:_The_Gathering_sets
    */
   set: string;

   /**
    * This card’s full set name.
    */
   set_name: string;

   /**
    * The type of set this printing is in.
    */
   set_type: string;
}

/**
 * Defines the enriched, but reduced set of card face data transferred from the Scryfall DB.
 *
 * @see https://scryfall.com/docs/api/cards
 */
interface CardFace
{
   object: 'card_face';

   /**
    * This card face colors.
    */
   colors?: ScryfallData.Colors | null;

   /**
    * The card face mana value. Note that some funny cards have fractional mana costs.
    */
   cmc?: number | null;

   /**
    * This face’s defense, if any. Battle cards.
    */
   defense?: string | null;

   /**
    * This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.
    */
   loyalty?: string | null;

   /**
    * The mana cost for this card. This value will be any empty string "" if the cost is absent.
    */
   mana_cost: string;

   /**
    * Card face name.
    */
   name: string;

   /**
    * The Oracle text for this card face, if any.
    */
   oracle_text?: string;

   /**
    * This face’s power, if any. Note that some cards have powers that are not numeric, such as *.
    */
   power?: string | null;

   /**
    * This face’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.
    */
   toughness?: string | null;

   /**
    * Normalized card type based on `type line` parsing.
    */
   type?: string | null;

   /**
    * The type line of this card face.
    */
   type_line?: string | null;
}

/**
 * Represents a parsed price comparison expression.
 *
 * This is the normalized form of a user-provided price filter such as `<10`, `>=2.50`, or `<= 0.99`.
 *
 * The `rawValue` field is retained for diagnostics, logging, and future serialization, while `value` should be
 * used exclusively for evaluation.
 */
interface PriceExpression
{
   /**
    * Comparison operator to apply.
    */
   operator: '<' | '>' | '<=' | '>=';

   /**
    * Preserves the original numeric string.
    */
   rawValue: string;

   /**
    * Parsed numeric value used for all comparisons.
    */
   value: number;
}

/**
 *
 */
type PriceFilter =
   | { kind: 'comparison'; expr: PriceExpression }
   | { kind: 'null' };

declare namespace Data
{
   export {
      Card,
      CardFace,
      PriceExpression,
      PriceFilter
   }
}

// Namespace File ----------------------------------------------------------------------------------------------------

/**
 * The different types / categories of Card DBs.
 */
type DBType = 'inventory' | 'sorted' | 'sorted_format';

/**
 * CardDB metadata that is generated on creation.
 */
interface MetadataGenerated
{
   /** Generating CLI version. */
   cliVersion: string;

   /** UTC Date when generated. */
   generatedAt: string;

   /** CardDB schema version. */
   schemaVersion: string;
}

/**
 * CardDB metadata that is common across all DBs.
 */
interface MetadataCommon extends MetadataGenerated
{
   /** Name of CardDB */
   name: string;

   /** Card / filename group associations. */
   groups: MetadataGroups;
}

/**
 * Defines groups of cards that are not considered part of the main collection and may not be exported.
 *
 * Each array stores a list of CSV file names associated with that group.
 *
 * @typeParam T - data type; default metadata is `string[]`.
 */
interface MetadataGroups<T = string[]>
{
   /**
    * Active decks.
    */
   decks?: T;

   /**
    * Manual / human organized collections.
    */
   external?: T;

   /**
    * Self-printed proxies (price = 0, no value logic)
    */
   proxy?: T;
}

/**
 * CardDB metadata for a sorted game format.
 */
interface MetadataSortedFormat extends MetadataCommon
{
   /** Type of CardDB. */
   type: 'sorted_format';

   /** Game format of CardDB. */
   format: ScryfallData.GameFormat;
}

/**
 * CardDB metadata for a sorted collection of cards not associated with a game format.
 */
interface MetadataSorted extends MetadataCommon
{
   /** Type of CardDB. */
   type: 'sorted';
}

/**
 * CardDB metadata for an `inventory` of cards after initial conversion.
 */
interface MetadataInventory extends MetadataCommon
{
   /** Type of CardDB. */
   type: 'inventory';
}

/**
 * Combined CardDB metadata definition.
 */
type Metadata = MetadataInventory | MetadataSorted | MetadataSortedFormat;

/**
 * CardDB metadata base shape required during runtime without DB generated keys.
 *
 * @privateRemarks
 * This type is derived from the persisted CardDB metadata definition with generated fields
 * (CLI version, schema version, timestamp) removed.
 */
type MetadataBase =
   Metadata extends infer T
      ? T extends any
         ? Omit<T, keyof MetadataGenerated>
         : never
      : never;

/**
 * Defines the card DB JSON file format.
 */
interface JSON
{
   /**
    * Metadata about this card DB.
    */
   meta: Metadata;

   /**
    * List of associated cards.
    */
   cards: Card[];
}

declare namespace File
{
   export {
      DBType,
      JSON,
      Metadata,
      MetadataBase,
      MetadataGenerated,
      MetadataGroups
   }
}

// Namespace Options -------------------------------------------------------------------------------------------------

/**
 * Provides the configuration object for {@link CardFilter.filter}.
 */
interface CardFilter
{
   /**
    * Independent card properties to filter.
    */
   properties: {
      /**
       * Card border colors to filter.
       */
      border?: Set<string>;

      /**
       * WUBRG color identity set.
       */
      colorIdentity?: Set<string>;

      /**
       * Match card `CMC`.
       */
      cmc?: number;

      /**
       * Game format legality.
       */
      formats?: string[];

      /**
       * An array of RegExp instances for keywords that a card uses such as 'Flying' and 'Cumulative upkeep'.
       */
      keywords?: RegExp[];

      /**
       * Match exact mana cost.
       */
      manaCost?: string;

      /**
       * Price filter to match.
       */
      price?: PriceFilter;
   };

   /**
    * Defines a possible regex test that occurs before independent property tests.
    */
   regex?: {
      /**
       * Regex operation.
       */
      op: RegExp;

      /**
       * The card fields to search.
       */
      fields: Set<string>,

      /**
       * Info for logging config.
       */
      log: {
         input: string,

         caseInsensitive: boolean,
         exact: boolean,
         wordBoundary: boolean;
      }
   }
}

declare namespace Options
{
   export { CardFilter };
}

// Namespace Stream --------------------------------------------------------------------------------------------------

/**
 * Result of diffing two card stream instances.
 *
 * All keys are composite card identities (`scryfall_id + foil + lang`) via {@link uniqueCardKey}.
 */
interface Diff
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
 * Options for {@link Stream.Reader.asStream}.
 */
interface StreamOptions
{
   /**
    * Optional card-level filtering configuration.
    */
   filter?: CardFilter;

   /**
    * Optional predicate applied to each card in the stream.
    *
    * When provided, the card is yielded only if this function returns `true`. This predicate is applied after all
    * structured stream options (filters, group exclusions, identity selection) have been evaluated.
    *
    * Intended for advanced or ad-hoc use cases. Structured filters should be preferred where possible.
    */
   filterFn?: (card: Data.Card) => boolean;

   /**
    * Exclude cards belonging to specific metadata groups.
    *
    * A group is excluded by specifying `false`.
    */
   groups?: Partial<Record<keyof File.MetadataGroups, false>>;

   /**
    * When true, skip all non-exportable card entries; IE all decks, externals, proxy groups.
    */
   isExportable?: true;

   /**
    * When provided, only cards whose composite identity matches one of these keys are yielded.
    *
    * Any object implementing a `has(key: string): boolean` method may be used; IE `Set`, `Map`, or a custom lookup
    * structure.
    *
    * Composite identity keys are created using {@link uniqueCardKey}.
    */
   uniqueKeys?: { has(key: string): boolean };

   /**
    * When true, only the first card encountered for each unique key is yielded.
    */
   uniqueOnce?: true;

   /**
    * Optional logger for diagnostics. If omitted, no logging is performed.
    */
   logger?: BasicLogger;
}

interface Reader
{
   /**
    * @returns The associated filepath.
    */
   get filepath(): string;

   /**
    * @returns CardDB metadata.
    */
   get meta(): Readonly<File.Metadata>;

   /**
    * Stream the card data in the DB asynchronously.
    *
    * @param [options] - Optional options.
    *
    * @returns Asynchronous iterator over validated card entries.
    */
   asStream(options?: StreamOptions): AsyncIterable<Data.Card>;

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
    * - cards whose quantities **changed** between the two CardStreams.
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
   diff(comparison: Reader, streamOptions?: StreamOptions): Promise<Stream.Diff>;

   /**
    * Return synchronously all card data in the DB.
    *
    * Note: Individual entries are not validated for typeof `object` or the Scryfall `object: 'card'` association.
    *
    * @returns All cards in the collection.
    */
   getAll(): Data.Card[];

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
   getQuantityMap(options?: StreamOptions, logger?: BasicLogger): Promise<Map<string, number>>;

   /**
    * Verifies that the card is not part of a non-exportable group. Presently all groups are non-exportable.
    * IE `decks`, `external` or `proxy`.
    *
    * @param card -
    *
    * @returns Whether card can be exported.
    */
   isCardExportable(card: Data.Card): boolean;

   /**
    * Checks the meta _external_ file names for a card file name match.
    *
    * @param card -
    *
    * @param group - External card group to test for inclusion.
    *
    * @returns Whether card is part of given group.
    */
   isCardGroup(card: Data.Card, group: keyof File.MetadataGroups): boolean;
}

declare namespace Stream
{
   export {
      Diff,
      Reader,
      StreamOptions };
}

export {
   type Data,
   type File,
   type Options,
   type Stream };
