import { CardDB }       from '#scrydex/data/db';
import { ScryfallData } from "#scrydex/data/scryfall";

/**
 * CLI option validation.
 */
export abstract class Validate
{
   /* v8 ignore next 1 */
   private constructor() {}

   /**
    * Validates CLI options for all filter operations.
    *
    * @param opts - CLI options.
    *
    * @param [regexInput] - Specific input search string to define regex filter test.
    *
    * @returns CardFilter config object or error string indicating why validation failed.
    */
   static filterOptions(opts: Record<string, any>, regexInput?: string): CardDB.Options.CardFilter | string
   {
      const result: CardDB.Options.CardFilter = { properties: {} };

      // Validate regex checks ---------------------------------------------------------------------------------------

      if (typeof regexInput === 'string')
      {
         // Verify pattern match fields.
         if (opts.b !== void 0 && typeof opts.b !== 'boolean') { return `'b' option is not a boolean.`; }
         if (opts.i !== void 0 && typeof opts.i !== 'boolean') { return `'i' option is not a boolean.`; }
         if (opts.exact !== void 0 && typeof opts.exact !== 'boolean') { return `'exact' option is not a boolean.`; }

         // Verify search surface fields.
         if (opts.name !== void 0 && typeof opts.name !== 'boolean') { return `'name' option is not a boolean.`; }
         if (opts.oracle !== void 0 && typeof opts.oracle !== 'boolean') { return `'oracle' option is not a boolean.`; }
         if (opts.type !== void 0 && typeof opts.type !== 'boolean') { return `'type' option is not a boolean.`; }

         const regexFields: string[] = [];

         // Name field is searched by default when no options provided.
         if (!opts.name && !opts.oracle && !opts.type)
         {
            regexFields.push('name');
         }
         else
         {
            // Specific fields requested.
            if (opts.name) { regexFields.push('name'); }
            if (opts.oracle) { regexFields.push('oracle_text'); }
            if (opts.type) { regexFields.push('type_line'); }
         }

         let searchText = regexInput;

         // Wrap w/ word boundaries.
         if (opts.b) { searchText = `\\b${searchText}\\b`; }

         // Wrap with exact pattern match.
         if (opts.exact) { searchText = `^${searchText}$`; }

         let regex: RegExp | null = null;

         try
         {
            regex = new RegExp(searchText, opts.i ? 'i' : void 0);
         }
         catch (err: unknown)
         {
            let message = typeof err === 'string' ? err : 'Unknown error';

            if (err instanceof Error) { message = err.message; }

            return message;
         }

         if (regex && regexInput.length)
         {
            result.regex = {
               op: regex,
               fields: new Set(regexFields),
               log: {
                  input: regexInput,

                  caseInsensitive: opts.i ?? false,
                  exact: opts.exact ?? false,
                  wordBoundary: opts.b ?? false
               }
            }
         }
      }

      // Validate card property checks -------------------------------------------------------------------------------

      if (opts.border !== void 0)
      {
         const validationResult = this.#validateBorder(opts.border);

         // Error in `border` validation.
         if (typeof validationResult === 'string') { return validationResult; }

         result.properties.border = validationResult;
      }

      if (opts['color-identity'] !== void 0)
      {
         if (typeof opts['color-identity'] !== 'string') { return `'color-identity' option is not a string.`; }

         const colorIdentity = ScryfallData.parseManaCostColors(opts['color-identity']);
         if (colorIdentity.size === 0)
         {
            return `'color-identity' option contains no valid WUBRG colors: ${opts['color-identity']}`;
         }

         result.properties.colorIdentity = colorIdentity;
      }

      if (opts.cmc !== void 0)
      {
         const cmc = parseFloat(opts.cmc);
         if (!Number.isFinite(cmc) || cmc < 0) { return `'cmc' option must be 0 to a positive number.`; }

         result.properties.cmc = cmc;
      }

      if (opts.formats !== void 0)
      {
         const validationResult = this.gameFormats(opts.formats);

         // Error in `formats` validation.
         if (typeof validationResult === 'string' ) { return validationResult; }

         result.properties.formats = validationResult;
      }


      if (opts.keywords !== void 0)
      {
         const validationResult = this.#validateKeywords(opts.keywords);

         // Error in `keywords` validation.
         if (typeof validationResult === 'string' ) { return validationResult; }

         result.properties.keywords = validationResult;
      }

      if (opts['mana-cost'] !== void 0)
      {
         if (typeof opts['mana-cost'] !== 'string') { return `'mana-cost' option is not a string.`; }

         result.properties.manaCost = opts['mana-cost'];
      }

      if (opts.price !== void 0)
      {
         if (typeof opts.price !== 'string')
         {
            return `'price' option is not a string. Ensure quotes are used IE ">10"`;
         }

         const priceFilter = CardDB.Price.parseFilter(opts.price);

         if (!priceFilter) { return `'price' option is an invalid price filter.` }

         result.properties.price = priceFilter;
      }

      return result;
   }

   /**
    * Parse and validate game formats from CLI option.
    *
    * @param formats -
    *
    * @returns Parsed `formats` or error string.
    */
   static gameFormats(formats: unknown): string[] | string
   {
      if (typeof formats !== 'string') { return `'formats' option is not a string.`; }

      const result = formats.split(':');

      const seen: Set<string> = new Set();

      for (const format of result)
      {
         if (seen.has(format)) { return `'formats' option contains duplicate format: ${format}`; }

         if (!ScryfallData.isSupportedFormat(format))
         {
            return `'formats' option contains an invalid format: ${format}`;
         }

         seen.add(format);
      }

      return result;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   static #supportedBorder = new Set(['black', 'borderless', 'gold', 'silver', 'white', 'yellow']);

   /**
    * Parse and validate border colors.
    *
    * @param borders -
    *
    * @returns Parsed `borders` or error string.
    */
   static #validateBorder(borders: unknown): Set<string> | string
   {
      if (typeof borders !== 'string') { return `'border' option is not a string.`; }

      const entries = borders.split(':');

      const seen: Set<string> = new Set();

      for (const border of entries)
      {
         if (seen.has(border)) { return `'border' option contains duplicate border: ${border}`; }

         if (!this.#supportedBorder.has(border)) { return `'border' option contains an invalid format: ${border}`; }

         seen.add(border);
      }

      return seen;
   }

   /**
    * Parse and validate `keywords` into separate RegExp instances.
    *
    * @param keywords -
    *
    * @returns Parsed `keywords` or error string.
    */
   static #validateKeywords(keywords: unknown): RegExp[] | string
   {
      if (typeof keywords !== 'string') { return `'keywords' option is not a string.`; }

      const result = keywords.split(':');

      const seen: Map<string, RegExp> = new Map();

      for (const keyword of result)
      {
         if (keyword.length === 0) { return `'keywords' option contains empty / zero length entry.`; }

         if (seen.has(keyword)) { return `'keywords' option contains duplicate keyword: ${keyword}`; }

         seen.set(keyword, new RegExp(`\\b${keyword}\\b`, 'i'));
      }

      return [...seen.values()];
   }
}
