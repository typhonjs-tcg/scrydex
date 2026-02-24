import { isObject }              from '@typhonjs-utils/object';

import { ScryfallData }          from '#scrydex/data/scryfall';

import { CardFields }            from './CardFields';

import { Price }                 from './Price';

import type {
   BasicLogger,
   LogLevel }                    from '@typhonjs-utils/logger-color';

import type {
   Data,
   Options }                     from '../types-db';

/**
 * Provides a reusable card filter based on optional independent card attributes and regex search string.
 *
 * Used in both the `filter` and `find` commands.
 */
export abstract class CardFilter
{
   /* v8 ignore next 1 */
   private constructor() {}

   /**
    * Checks if there are filter checks to execute in the given config object.
    *
    * @param [config] -
    *
    * @return Filter check status.
    */
   static hasFilterChecks(config?: Options.CardFilter): config is Options.CardFilter
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
    * @param logger -
    *
    * @param [logLevel] - Optional level to log message at; default: `info`.
    */
   static logConfig(config: Options.CardFilter, logger: BasicLogger, logLevel: LogLevel = 'info'): void
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

      if (config.properties.price)
      {
         if (config.properties.price.kind === 'null')
         {
            logger[logLevel](`Price: null (card entries without a price)`);
         }
         else
         {
            logger[logLevel](`Price: ${config.properties.price.expr.operator}${config.properties.price.expr.rawValue}`);
         }
      }
   }

   /**
    * Test a card against the given filter config.
    *
    * @param card - Card to test.
    *
    * @param config - Filter config.
    */
   static test(card: Data.Card, config: Options.CardFilter): boolean
   {
      // Start with any regex tests otherwise set `foundRegex` to true.
      const foundRegex = config.regex && config?.regex.fields?.size ? this.#testRegex(card, config) : true;

      if (!foundRegex) { return false; }

      const foundFilters = this.#testProperties(card, config);

      return foundRegex && foundFilters;
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Test independent card properties.
    *
    * @param card -
    *
    * @param config -
    *
    * @returns Tests passed state.
    */
   static #testProperties(card: Data.Card, config: Options.CardFilter): boolean
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
            if (!ScryfallData.isLegal(card.legalities?.[format])) { return false; }
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

      if (config.properties.price)
      {
         const price = typeof card.price === 'string' ? parseFloat(card.price) : card.price;

         return Price.matchesFilter(price, config.properties.price);
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
   static #testRegex(card: Data.Card, config: Options.CardFilter): boolean
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
}
