import { isObject }              from '@typhonjs-utils/object';

import {
   CardFields,
   parseManaCostColors,
   supportedFormats,
   validLegality }               from '#data';

import { logger }                from '#util';

import type { LogLevel }         from '@typhonjs-utils/logger-color';

import type { Card }             from '#types';
import type { ConfigCardFilter } from '#types-data';

/**
 * Provides a reusable card filter based on optional independent card attributes and regex search string.
 *
 * Used in both the `filter` and `find` commands.
 */
export abstract class CardFilter
{
   private constructor() {}

   /**
    * Checks if there are filter checks to execute in the given config object.
    *
    * @param config -
    *
    * @return Filter check status.
    */
   static hasFilterChecks(config: ConfigCardFilter): boolean
   {
      if (!isObject(config)) { return false; }
      if (!isObject(config.properties)) { return false; }

      return Object.keys(config.properties).length > 0 || isObject(config.regex);
   }

   /**
    * Logs messages for the given configuration object.
    *
    * @param config -
    *
    * @param [logLevel] - Optional level to log message at; default: `info`.
    */
   static logConfig(config: ConfigCardFilter, logLevel: LogLevel = 'info'): void
   {
      if (!isObject(config)) { throw new TypeError(`'config' is not an object.`); }
      if (!isObject(config.properties)) { throw new TypeError(`'config.properties' is not an object.`); }

      if (logLevel === 'off' || logLevel === 'all') { return; }

      const hasProperties = Object.keys(config.properties).length > 0;

      // Regex search ------------------------------------------------------------------------------------------------
      if (isObject(config.regex))
      {
         logger[logLevel](`Search Input: "${config.regex.log.input}"`);

         const logProps = [];

         logger[logLevel](`Card Fields: ${[...config.regex.fields].join(', ')}`)

         if (config.regex.log.caseInsensitive)
         {
            logProps.push(`Case Insensitive: ${config.regex.log.caseInsensitive}`);
         }

         if (config.regex.log.exact)
         {
            logProps.push(`Exact Match: ${config.regex.log.exact}`);
         }

         if (config.regex.log.wordBoundary)
         {
            logProps.push(`Word Boundary: ${config.regex.log.wordBoundary}`);
         }

         if (logProps.length) { logger[logLevel](logProps.join('; ')); }

         // Insert blank line if additional properties logged.
         if (hasProperties) { logger[logLevel](''); }
      }

      // Independent property filters --------------------------------------------------------------------------------

      if (config.properties.border)
      {
         logger[logLevel](`Card borders: ${[...config.properties.border].join(' or ')}`);
      }

      if (config.properties.colorIdentity)
      {
         logger[logLevel](`Color Identity: ${[...config.properties.colorIdentity].join(', ')}`);
      }

      if (config.properties.cmc)
      {
         logger[logLevel](`CMC: ${config.properties.cmc}`);
      }

      if (config.properties.formats?.length)
      {
         logger[logLevel](`Formats: ${config.properties.formats.join(' and ')}`);
      }

      if (config.properties.keywords?.length)
      {
         logger[logLevel](`Keywords: ${config.properties.keywords.join(' and ')}`);
      }

      if (config.properties.manaCost)
      {
         logger[logLevel](`Mana Cost: ${config.properties.manaCost}`);
      }
   }

   static test(card: Card, config: ConfigCardFilter): boolean
   {
      // Start with any regex tests otherwise set `foundRegex` to true.
      const foundRegex = config.regex && config?.regex.fields?.size ? this.#testRegex(card, config) : true;

      if (!foundRegex) { return false; }

      const foundFilters = this.#testProperties(card, config);

      return foundRegex && foundFilters;
   }

   /**
    * Validates CLI options for all filter operations.
    *
    * @param opts - CLI options.
    *
    * @param [regexInput] - Specific input search string to define regex filter test.
    *
    * @returns CardFilter config object or error string indicating why validation failed.
    */
   static validateCLIOptions(opts: Record<string, any>, regexInput?: string): ConfigCardFilter | string
   {
      const result: ConfigCardFilter = { properties: {} };

      // Validate regex checks ---------------------------------------------------------------------------------------

      if (typeof regexInput === 'string')
      {
         // Verify pattern match fields.
         if (opts.b !== void 0 && typeof opts.b !== 'boolean') { return `'b' option must be a boolean.`; }
         if (opts.i !== void 0 && typeof opts.i !== 'boolean') { return `'i' option must be a boolean.`; }
         if (opts.exact !== void 0 && typeof opts.exact !== 'boolean') { return `'exact' option must be a boolean.`; }

         // Verify search surface fields.
         if (opts.name !== void 0 && typeof opts.name !== 'boolean') { return `'name' option must be a boolean.`; }
         if (opts.oracle !== void 0 && typeof opts.oracle !== 'boolean') { return `'oracle' option must be a boolean.`; }
         if (opts.type !== void 0 && typeof opts.type !== 'boolean') { return `'type' option must be a boolean.`; }

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
            if (logger.isLevelEnabled('debug')) { console.error(err); }

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
         if (typeof opts['color-identity'] !== 'string') { return `'color-identity' option must be a string.`; }

         const colorIdentity = parseManaCostColors(opts['color-identity']);
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
         const validationResult = this.validateCLIFormats(opts.formats);

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
         if (typeof opts['mana-cost'] !== 'string') { return `'mana-cost' option must be a string.`; }

         result.properties.manaCost = opts['mana-cost'];
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
   static validateCLIFormats(formats: unknown): string[] | string
   {
      if (typeof formats !== 'string') { return `'formats' option must be a string.`; }

      const result = formats.split(':');

      const seen: Set<string> = new Set();

      for (const format of result)
      {
         if (seen.has(format)) { return `'formats' option contains duplicate format: ${format}`; }

         if (!supportedFormats.has(format)) { return `'formats' option contains an invalid format: ${format}`; }

         seen.add(format);
      }

      return result;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   static #supportedBorder = new Set(['black', 'borderless', 'gold', 'silver', 'white', 'yellow']);

   /**
    * Test independent card properties.
    *
    * @param card -
    *
    * @param config -
    *
    * @returns Tests passed state.
    */
   static #testProperties(card: Card, config: ConfigCardFilter): boolean
   {
      if (config.properties.border && !config.properties.border.has(card.border_color)) { return false; }

      if (config.properties.colorIdentity && Array.isArray(card.color_identity))
      {
         if (!config.properties.colorIdentity.isSupersetOf(new Set(card.color_identity))) { return false; }
      }

      if (config.properties.cmc)
      {
         if (card.card_faces)
         {
            const cmcParts = CardFields.partsCMC(card);
            let result = false;
            for (const cmcPart of cmcParts)
            {
               if (config.properties.cmc === cmcPart) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.properties.cmc !== card.cmc)
         {
            return false;
         }
      }

      if (config.properties.formats?.length)
      {
         for (const format of config.properties.formats)
         {
            if (!validLegality.has(card.legalities?.[format])) { return false; }
         }
      }

      if (config.properties.keywords?.length)
      {
         if (!Array.isArray(card.keywords) || card.keywords.length === 0) { return false; }

         for (const keywordRegex of config.properties.keywords)
         {
            for (const keyword of card.keywords)
            {
               if (!keywordRegex.test(keyword)) { return false; }
            }
         }
      }

      if (config.properties.manaCost)
      {
         if (card.card_faces)
         {
            const manaCostParts = CardFields.partsManaCost(card);
            let result = false;
            for (const manaCost of manaCostParts)
            {
               if (config.properties.manaCost === manaCost) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.properties.manaCost !== card.mana_cost)
         {
            return false;
         }
      }

      return true;
   }

   /**
    * Perform regex search.
    *
    * @param card -
    *
    * @param config -
    *
    * @returns Tests passed state.
    */
   static #testRegex(card: Card, config: ConfigCardFilter): boolean
   {
      if (!config.regex || !config.regex.fields) { return false; }

      if (config.regex.fields.has('name'))
      {
         if (card.card_faces)
         {
            const printedNames = CardFields.partsPrintedName(card);
            for (const printedName of printedNames)
            {
               if (config.regex.op.test(printedName)) { return true; }
            }

            const names = CardFields.partsName(card);
            for (const name of names)
            {
               if (config.regex.op.test(name)) { return true; }
            }
         }

         if (typeof card.printed_name === 'string' && config.regex.op.test(card.printed_name)) { return true; }
         if (typeof card.name === 'string' && config.regex.op.test(card.name)) { return true; }
      }

      if (config.regex.fields.has('oracle_text'))
      {
         if (card.card_faces)
         {
            const oracleTexts = CardFields.partsOracleText(card);
            for (const oracleText of oracleTexts)
            {
               if (config.regex.op.test(oracleText)) { return true; }
            }
         }

         if (typeof card.oracle_text === 'string' && config.regex.op.test(card.oracle_text)) { return true; }
      }

      if (config.regex.fields.has('type_line'))
      {
         if (card.card_faces)
         {
            const typeLines = CardFields.partsTypeLine(card);
            for (const typeLine of typeLines)
            {
               if (config.regex.op.test(typeLine)) { return true; }
            }
         }

         if (typeof card.type_line === 'string' && config.regex.op.test(card.type_line)) { return true; }
      }

      return false;
   }

   /**
    * Parse and validate border colors.
    *
    * @param borders -
    *
    * @returns Parsed `borders` or error string.
    */
   static #validateBorder(borders: unknown): Set<string> | string
   {
      if (typeof borders !== 'string') { return `'border' option must be a string.`; }

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
      if (typeof keywords !== 'string') { return `'keywords' option must be a string.`; }

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
