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
 * Provides a reusable card filter based on independent card attributes.
 *
 * Used in both the `filter` and `find` commands.
 */
export abstract class CardFilter
{
   private constructor() {}

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

      if (logLevel === 'off' || logLevel === 'all') { return; }

      if (config.border)
      {
         logger[logLevel](`Card borders: ${[...config.border].join(' or ')}`);
      }

      if (config.colorIdentity)
      {
         logger[logLevel](`Color Identity: ${[...config.colorIdentity].join(', ')}`);
      }

      if (config.cmc)
      {
         logger[logLevel](`CMC: ${config.cmc}`);
      }

      if (config.formats?.length)
      {
         logger[logLevel](`Formats: ${config.formats.join(' and ')}`);
      }

      if (config.keywords?.length)
      {
         logger[logLevel](`Keywords: ${config.keywords.join(' and ')}`);
      }

      if (config.manaCost)
      {
         logger[logLevel](`Mana Cost: ${config.manaCost}`);
      }
   }

   static test(card: Card, config: ConfigCardFilter): boolean
   {
      if (config.border && !config.border.has(card.border_color)) { return false; }

      if (config.colorIdentity && Array.isArray(card.color_identity))
      {
         if (!config.colorIdentity.isSupersetOf(new Set(card.color_identity))) { return false; }
      }

      if (config.cmc)
      {
         if (card.card_faces)
         {
            const cmcParts = CardFields.partsCMC(card);
            let result = false;
            for (const cmcPart of cmcParts)
            {
               if (config.cmc === cmcPart) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.cmc !== card.cmc)
         {
            return false;
         }
      }

      if (config.formats?.length)
      {
         for (const format of config.formats)
         {
            if (!validLegality.has(card.legalities?.[format])) { return false; }
         }
      }

      if (config.keywords?.length)
      {
         if (!Array.isArray(card.keywords) || card.keywords.length === 0) { return false; }

         for (const keywordRegex of config.keywords)
         {
            for (const keyword of card.keywords)
            {
               if (!keywordRegex.test(keyword)) { return false; }
            }
         }
      }

      if (config.manaCost)
      {
         if (card.card_faces)
         {
            const manaCostParts = CardFields.partsManaCost(card);
            let result = false;
            for (const manaCost of manaCostParts)
            {
               if (config.manaCost === manaCost) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.manaCost !== card.mana_cost)
         {
            return false;
         }
      }

      return true;
   }

   /**
    * Validates CLI options for all filter operations.
    *
    * @param opts - CLI options.
    *
    * @returns CardFilter config object or error string indicating why validation failed.
    */
   static validateCLIOptions(opts: Record<string, any>): ConfigCardFilter | string
   {
      const result: ConfigCardFilter = {};

      if (opts.border !== void 0)
      {
         const validationResult = this.#validateBorder(opts.border);

         // Error in `border` validation.
         if (typeof validationResult === 'string') { return validationResult; }

         result.border = validationResult;
      }

      if (opts['color-identity'] !== void 0)
      {
         if (typeof opts['color-identity'] !== 'string') { return `'color-identity' option must be a string.`; }

         const colorIdentity = parseManaCostColors(opts['color-identity']);
         if (colorIdentity.size === 0)
         {
            return `'color-identity' option contains no valid WUBRG colors: ${opts['color-identity']}`;
         }

         result.colorIdentity = colorIdentity;
      }

      if (opts.cmc !== void 0)
      {
         const cmc = parseFloat(opts.cmc);
         if (!Number.isFinite(cmc) || cmc < 0) { return `'cmc' option must be 0 to a positive number.`; }

         result.cmc = cmc;
      }

      if (opts.formats !== void 0)
      {
         const validationResult = this.validateCLIFormats(opts.formats);

         // Error in `formats` validation.
         if (typeof validationResult === 'string' ) { return validationResult; }

         result.formats = validationResult;
      }


      if (opts.keywords !== void 0)
      {
         const validationResult = this.#validateKeywords(opts.keywords);

         // Error in `keywords` validation.
         if (typeof validationResult === 'string' ) { return validationResult; }

         result.keywords = validationResult;
      }

      if (opts['mana-cost'] !== void 0)
      {
         if (typeof opts['mana-cost'] !== 'string') { return `'mana-cost' option must be a string.`; }

         result.manaCost = opts['mana-cost'];
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
