abstract class ScryfallData
{
   /**
    * Extracts mana cost tokens like `{W}`, `{2}{U/B}`, `{G/P}`, `{X}`.
    */
   static #REGEX_MANA_COST = /\{([^}]+)}/g;

   static get supportedFormats(): ReadonlySet<string>
   {
      return this.#supportedFormats;
   }

   /**
    * Is the given set type / `set_type` excluded from determining a cards recent rarity. Over time a card such as
    * `Force of Will` and `Demonic Tutor` have gone from `Uncommon` to `Rare` / `Mythic Rare`. Ignore these set types
    * in determining highest rarity for a card.
    *
    * @param setType - The card `set_type` field.
    *
    * @returns Whether this cards set is excluded from recent rarity calculation.
    */
   static isExcludedSetType(setType: string): boolean
   {
      return this.#excludedSetTypesRecentRarity.has(setType);
   }

   /**
    * Is the given set code excluded from determining a cards recent rarity. Several early sets are excluded from
    * determining a cards recent rarity.
    *
    * @param setCode - The card `set` field.
    *
    * @returns Whether this cards set is excluded from recent rarity calculation.
    */
   static isExcludedSet(setCode: string): boolean
   {
      return this.#excludedSetsRecentRarity.has(setCode);
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
    * These set types are excluded from determining a cards recent rarity. Over time a card such as `Force of Will`
    * and `Demonic Tutor` have gone from `Uncommon` to `Rare` / `Mythic Rare`. Ignore these set types in determining
    * highest rarity for a card.
    */
   static #excludedSetTypesRecentRarity: ReadonlySet<string> = Object.freeze(new Set([
      'duel_deck',
      'from_the_vault',
      'memorabilia',
      'premium_deck',
      'promo',
      'sld',   // Secret Lair
      'spellbook',
      'starter'
   ]));

   /**
    * These early sets are excluded from determining a cards recent rarity.
    */
   static #excludedSetsRecentRarity: ReadonlySet<string> = Object.freeze(new Set([
      '4bb',   // Fourth Edition Foreign Black Border
      'bchr',  // Chronicles Foreign Black Border
      'ced',   // Collector's Edition
      'cei',   // International Collector's Edition
      'fbb',   // Foreign Black Border
      'sum'    // Summer Magic
   ]));

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
    * Whenever the API presents set of Magic colors, the field will be an array that uses the uppercase, single-character
    * abbreviations for those colors. For example, `['W','U']` represents something that is both white and blue. Colorless
    * sources are denoted with an empty array `[]`.
    *
    * @see https://scryfall.com/docs/api/colors
    */
   export type Colors = string[];

   /**
    * Valid Scryfall game formats.
    */
   export type GameFormat = 'standard' | 'future' | 'historic' | 'timeless' | 'gladiator' | 'pioneer' | 'modern' |
    'legacy' | 'pauper' | 'vintage' | 'penny' | 'commander' | 'oathbreaker' | 'standardbrawl' | 'brawl' | 'alchemy' |
     'paupercommander' | 'duel' | 'oldschool' | 'premodern' | 'predh';
}

export { ScryfallData };
