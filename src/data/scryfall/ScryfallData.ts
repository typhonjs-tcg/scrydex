abstract class ScryfallData
{
   /* v8 ignore next 1 */
   private constructor() {}

   static get supportedFormats(): ReadonlySet<string>
   {
      return this.#supportedFormats;
   }

   /**
    * Is the card `legalities` entry legal for the game format?
    *
    * @param legality - Game format entry in `legalities`.
    *
    * @return Is the card legal.
    */
   static isLegal(legality: string): boolean
   {
      return this.#validLegality.has(legality);
   }

   /**
    * Provides a type guard for testing game format support.
    *
    * @param format - Game format to test.
    *
    * @returns Whether the give format is supported.
    */
   static isSupportedFormat(format: string | undefined): format is ScryfallData.GameFormat
   {
      return typeof format === 'string' && this.#supportedFormats.has(format);
   }

   /**
    * Scryfall / ISO language code to name.
    *
    * @param code - ISO language code.
    *
    * @returns Full language name.
    */
   static langCodeToName(code: string): string | undefined
   {
      return this.#langCodeToName.get(code);
   }

   /**
    * Normalizes card finish.
    *
    * @param finish - Finish to normalize.
    *
    * @returns Normalized finish property.
    */
   static normalizeFinish(finish: string): ScryfallData.CardFinish | undefined
   {
      return this.#supportedFinish.get(finish);
   }

   /**
    * Normalizes supported ISO lang codes.
    *
    * @param code - Language code to normalize.
    *
    * @returns Normalized lang code.
    */
   static normalizeLangCode(code: string): string | undefined
   {
      return this.#supportedLang.get(code);
   }

   /**
    * Best-effort parser for Scryfall collector numbers.
    *
    * Collector numbers are identifiers, not ordinals. This function extracts optional numeric tokens for sorting and
    * grouping heuristics only.
    *
    * No guarantees are made about release order or canonical meaning.
    *
    * For sorting by collector number see {@link @typhonjs-tcg/scrydex/data/sort!SortCards.byCollectorNumber}.
    */
   static parseCollectorNumber(value: string): ScryfallData.ParsedCollectorNumber
   {
      const raw = value;

      let leadingNumber: number | undefined;
      let trailingNumber: number | undefined;
      let middle: string | undefined;

      // Extract leading digits
      const leadingMatch = raw.match(/^(\d+)/);
      if (leadingMatch) { leadingNumber = Number(leadingMatch[1]); }

      // Extract trailing digits.
      const trailingMatch = raw.match(/(\d+)$/);
      if (trailingMatch) { trailingNumber = Number(trailingMatch[1]); }

      // Extract middle segment if both ends are numeric and non-overlapping.
      if (leadingMatch || trailingMatch)
      {
         const start = leadingMatch ? leadingMatch[1].length : 0;
         const end = trailingMatch ? raw.length - trailingMatch[1].length : raw.length;

         if (end > start)
         {
            const mid = raw.slice(start, end);
            middle = mid.length ? mid : undefined;
         }
      }

      return {
         raw,
         leadingNumber,
         trailingNumber,
         middle,
         hasLeadingNumber: typeof leadingNumber === 'number',
         hasTrailingNumber: typeof trailingNumber === 'number'
      };
   }

   /**
    * Parses a Scryfall mana_cost string such as `{2}{W}{U/B}{G/P}` and returns a set of MTG color letters actually
    * required to CAST the spell.
    *
    * @param manaCost - `mana_cost` Scryfall data.
    *
    * @returns A set of unique WUBRG colors contained in the mana cost.
    */
   static parseManaCostColors(manaCost: string): Set<string>
   {
      if (typeof manaCost !== 'string' || manaCost.length === 0) { return new Set(); }

      const symbols = manaCost.match(this.#REGEX_MANA_COST);
      if (!symbols) { return new Set(); }

      const colorSet: Set<string> = new Set();

      for (const symbol of symbols)
      {
         // Strip braces → `{W/U}` → `W/U`.
         const inner = symbol.slice(1, -1).toUpperCase();

         // Hybrid (W/U), Phyrexian (W/P), Snow (S), Colorless (C), Numeric (2), X, etc.
         // We only care about actual color letters. Split on non-alphanumeric to catch hybrids cleanly.
         const parts = inner.split(/[^A-Z]/);

         for (const p of parts)
         {
            // p will be -> `W`, `U`, `G`, `P`, `C`, `X`. Only include actual color letters.
            if (p === 'W' || p === 'U' || p === 'B' || p === 'R' || p === 'G') { colorSet.add(p); }
         }
      }

      return colorSet;
   }

   /**
    * Parses a string price value ensuring a finite number or null. The `price` property of cards is a string or null.
    *
    * @param value - Value to parse.
    *
    * @returns Parsed price as number or null.
    */
   static parsePrice(value: string | null): number | null
   {
      if (value === null) { return null; }

      const num = Number(value);
      return Number.isFinite(num) ? num : null;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Extracts mana cost tokens like `{W}`, `{2}{U/B}`, `{G/P}`, `{X}`.
    */
   static #REGEX_MANA_COST = /\{([^}]+)}/g;

   /**
    * Scryfall / ISO language code to name.
    */
   static #langCodeToName: ReadonlyMap<string, string> = Object.freeze(new Map<string, string>([
      ['en', 'English'],
      ['es', 'Spanish'],
      ['fr', 'French'],
      ['de', 'German'],
      ['it', 'Italian'],
      ['ja', 'Japanese'],
      ['ko', 'Korean'],
      ['pt', 'Portuguese'],
      ['ru', 'Russian'],
      ['zhs', 'Simplified Chinese'],
      ['zht', 'Traditional Chinese'],

      // ~50 cards
      ['ph', 'Phyrexian'],

      // Very few cards each.
      ['ar', 'Arabic'],
      ['grc', 'Ancient Greek'],
      ['he', 'Hebrew'],
      ['la', 'Latin'],
      ['qya', 'Quenya'],
      ['sa', 'Sanskrit']
   ]));

   /**
    * Supported Scryfall formats for legality checks.
    */
   static #supportedFormats: ReadonlySet<string> = Object.freeze(new Set(['standard', 'future', 'historic', 'timeless',
    'gladiator', 'pioneer', 'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander', 'oathbreaker',
     'standardbrawl', 'brawl', 'alchemy', 'paupercommander', 'duel', 'oldschool', 'premodern', 'predh']));

   static #supportedFinish: ReadonlyMap<string, ScryfallData.CardFinish> = Object.freeze(
    new Map<string, ScryfallData.CardFinish>([
      ['normal', 'normal'],
      ['etched', 'etched'],
      ['foil', 'foil'],

      ['Normal', 'normal'],
      ['Etched', 'etched'],
      ['Foil', 'foil']
   ]));

   static #supportedLang: ReadonlyMap<string, string> = Object.freeze(new Map<string, string>([
      ['en', 'en'],
      ['es', 'es'],
      ['fr', 'fr'],
      ['de', 'de'],
      ['it', 'it'],
      ['ja', 'ja'],
      ['ko', 'ko'],
      ['pt', 'pt'],
      ['ru', 'ru'],
      ['zhs', 'zhs'],
      ['zht', 'zht'],

      ['EN', 'en'],
      ['ES', 'es'],
      ['FR', 'fr'],
      ['DE', 'de'],
      ['IT', 'it'],
      ['JA', 'ja'],
      ['KO', 'ko'],
      ['PT', 'pt'],
      ['RU', 'ru'],
      ['ZHS', 'zhs'],
      ['ZHT', 'zht'],

      ['English', 'en'],
      ['Spanish', 'es'],
      ['French', 'fr'],
      ['German', 'de'],
      ['Italian', 'it'],
      ['Japanese', 'ja'],
      ['Korean', 'ko'],
      ['Portuguese', 'pt'],
      ['Russian', 'ru'],
      ['Chinese', 'zhs'],
      ['Simplified Chinese', 'zhs'],
      ['Traditional Chinese', 'zht'],

      // The following have few cards each...

      ['ph', 'ph'],  // Phyrexian - ~50 cards

      ['ar', 'ar'],
      ['grc', 'grc'],
      ['he', 'he'],
      ['la', 'la'],
      ['qya', 'qya'],
      ['sa', 'sa'],

      ['PH', 'ph'],  // Phyrexian

      ['AR', 'ar'],
      ['GRC', 'grc'],
      ['HE', 'he'],
      ['LA', 'la'],
      ['QYA', 'qya'],
      ['SA', 'sa'],

      ['Phyrexian', 'ph'],

      ['Arabic', 'ar'],
      ['Ancient Greek', 'grc'],
      ['Hebrew', 'he'],
      ['Latin', 'la'],
      ['Quenya', 'qya'],
      ['Sanskrit', 'sa']
   ]));

   /**
    * Legality values for a valid card in a given format.
    */
   static #validLegality: ReadonlySet<string> = Object.freeze(new Set(['legal', 'restricted']));
}

declare namespace ScryfallData
{
   /**
    * Defines the Scryfall card `layout` which is available in
    * {@link @typhonjs-tcg/scrydex/data/db!CardDB.Data.Card.layout}.
    *
    * See the links below for Scryfall examples of each layout.
    *
    * @see [normal](https://scryfall.com/search?q=layout%3Anormal)
    *
    * @see [split](https://scryfall.com/search?q=layout%3Asplit)
    *
    * @see [flip](https://scryfall.com/search?q=layout%3Aflip)
    *
    * @see [transform](https://scryfall.com/search?q=layout%3Atransform)
    *
    * @see [modal_dfc](https://scryfall.com/search?q=layout%3Amodal_dfc)
    *
    * @see [meld](https://scryfall.com/search?q=layout%3Ameld)
    *
    * @see [leveler](https://scryfall.com/search?q=layout%3Aleveler)
    *
    * @see [class](https://scryfall.com/search?q=layout%3Aclass)
    *
    * @see [case](https://scryfall.com/search?q=layout%3Acase)
    *
    * @see [saga](https://scryfall.com/search?q=layout%3Asaga)
    *
    * @see [adventure](https://scryfall.com/search?q=layout%3Aadventure)
    *
    * @see [mutate](https://scryfall.com/search?q=layout%3Amutate)
    *
    * @see [prototype](https://scryfall.com/search?q=layout%3Aprototype)
    *
    * @see [battle](https://scryfall.com/search?q=layout%3Abattle)
    *
    * @see [planar](https://scryfall.com/search?q=layout%3Aplanar)
    *
    * @see [scheme](https://scryfall.com/search?q=layout%3Ascheme)
    *
    * @see [vanguard](https://scryfall.com/search?q=layout%3Avanguard)
    *
    * @see [token](https://scryfall.com/search?q=layout%3Atoken)
    *
    * @see [double_faced_token](https://scryfall.com/search?q=layout%3Adouble_faced_token)
    *
    * @see [emblem](https://scryfall.com/search?q=layout%3Aemblem)
    *
    * @see [augment](https://scryfall.com/search?q=layout%3Aaugment)
    *
    * @see [host](https://scryfall.com/search?q=layout%3Ahost)
    *
    * @see [art_series](https://scryfall.com/search?q=layout%3Aart_series)
    *
    * @see [reversible_card](https://scryfall.com/search?q=layout%3Areversible_card)
    */
   export type CardLayout =
      /** A standard Magic card with one face. */
      | 'normal'

      /** A split-faced card. */
      | 'split'

      /** Cards that invert vertically with the flip keyword. */
      | 'flip'

      /** Double-sided cards that transform. */
      | 'transform'

      /** Double-sided cards that can be played either-side. */
      | 'modal_dfc'

      /** Cards with meld parts printed on the back. */
      | 'meld'

      /** Cards with Level Up. */
      | 'leveler'

      /** Class-type enchantment cards. */
      | 'class'

      /** Case-type enchantment cards. */
      | 'case'

      /** Saga-type cards. */
      | 'saga'

      /** Cards with an Adventure spell part. */
      | 'adventure'

      /** Cards with Mutate. */
      | 'mutate'

      /** Cards with Prototype. */
      | 'prototype'

      /** Battle-type cards. */
      | 'battle'

      /** Plane and Phenomenon-type cards. */
      | 'planar'

      /** Scheme-type cards. */
      | 'scheme'

      /** Vanguard-type cards. */
      | 'vanguard'

      /** Token cards. */
      | 'token'

      /** Tokens with another token printed on the back. */
      | 'double_faced_token'

      /** Emblem cards. */
      | 'emblem'

      /** Cards with Augment. */
      | 'augment'

      /** Host-type cards. */
      | 'host'

      /** Art Series collectable double-faced cards. */
      | 'art_series'

      /** A Magic card with two sides that are unrelated. */
      | 'reversible_card';

   /**
    * Cards that are closely related to other cards (because they call them by name, or generate a token, or meld, etc)
    * have an `all_parts` property that contains Related Card objects.
    *
    * @see https://scryfall.com/docs/api/cards#related-card-objects
    */
   export interface CardRelated {
      /**
       * A unique ID for this card in Scryfall’s database.
       */
      id: string;

      /**
       * A content type for this object, always related_card.
       */
      object: 'related_card';

      /**
       * A field explaining what role this card plays in this relationship, one of `token`, `meld_part`, `meld_result`,
       * or `combo_piece`.
       */
      component: string;

      /**
       * The name of this particular related card.
       */
      name: string;

      /**
       * The type line of this card.
       */
      type_line: string;

      /**
       * A URI where you can retrieve a full object describing this card on Scryfall’s API.
       */
      uri: string;
   }

   /**
    * Whenever the API presents set of Magic colors, the field will be an array that uses the uppercase,
    * single-character abbreviations for those colors. For example, `['W','U']` represents something that is both white
    * and blue. Colorless sources are denoted with an empty array `[]`.
    *
    * @see https://scryfall.com/docs/api/colors
    */
   export type Colors = string[];

   /**
    * Card finish variant.
    *
    * Mirrors Scryfall finish semantics:
    * - `normal` → non-foil print.
    * - `foil`   → traditional foil print.
    * - `etched` → etched foil print.
    */
   export type CardFinish = 'normal' | 'foil' | 'etched';

   /**
    * Valid Scryfall game formats.
    */
   export type GameFormat = 'standard' | 'future' | 'historic' | 'timeless' | 'gladiator' | 'pioneer' | 'modern' |
    'legacy' | 'pauper' | 'vintage' | 'penny' | 'commander' | 'oathbreaker' | 'standardbrawl' | 'brawl' | 'alchemy' |
     'paupercommander' | 'duel' | 'oldschool' | 'premodern' | 'predh';

   /**
    * Represents a best-effort structural decomposition of a Scryfall collector number.
    *
    * Collector numbers are **identifiers**, not guaranteed ordinals. Their format varies widely across sets, promos,
    * reprints, and special releases (IE variant suffixes, hyphenated set-qualified identifiers such as "CN2-22",
    * symbolic forms, etc.).
    *
    * This structure exposes **optional numeric tokens** and simple flags that may be used for sorting, grouping, or
    * display heuristics. No semantic meaning such as release order or canonical numbering is implied or guaranteed.
    *
    * All extracted fields are advisory and should be treated as heuristics only.
    *
    * @see {@link @typhonjs-tcg/scrydex/data/sort!SortCards}
    */
   export interface ParsedCollectorNumber
   {
      /**
       * The original collector number string exactly as provided by Scryfall.
       * This value is always preserved and should be used as the authoritative identifier.
       */
      raw: string;

      /**
       * A contiguous sequence of digits at the **start** of the collector number, if present.
       *
       * Examples:
       * - "123a"  → 123
       * - "10★"   → 10
       * - "CN2-22" → undefined
       */
      leadingNumber?: number;

      /**
       * A contiguous sequence of digits at the **end** of the collector number, if present.
       *
       * Examples:
       * - "CN2-22"   → 22
       * - "PLIST-001" → 1
       * - "123a"     → undefined
       */
      trailingNumber?: number;

      /**
       * The substring between the leading and trailing numeric components, if any.
       *
       * This may include set codes, separators, variant symbols, or other non-numeric
       * identifiers and carries no assumed semantics.
       *
       * Examples:
       * - "CN2-22" → "CN2-"
       * - "123a"   → "a"
       */
      middle?: string;

      /**
       * Indicates whether the collector number begins with a numeric sequence.
       */
      hasLeadingNumber: boolean;

      /**
       * Indicates whether the collector number ends with a numeric sequence.
       */
      hasTrailingNumber: boolean;
   }
}

export { ScryfallData };
