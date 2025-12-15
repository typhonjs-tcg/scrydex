import path             from 'node:path';

import {
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import {
   convert,
   filter,
   sortFormat }         from '#commands';

import {
   parseManaCostColors,
   supportedFormats }   from '#data';

import { logger }       from '#util';

import type {
   ConfigConvert,
   ConfigFilter,
   ConfigSortFormat }   from '#types-command';

/**
 * Invokes `convert` with the given config.
 *
 * @param input - Manabox collection CSV input file path or directory path.
 *
 * @param opts - CLI options.
 */
export async function commandConvert(input: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(input) && !isDirectory(input)) { exit(`'input' option is not a file or directory path.`); }
   if (!isFile(opts.db)) { exit(`'db' option is not a file path.`); }

   if (opts.decks !== void 0 && !isFile(opts.decks) && !isDirectory(opts.decks))
   {
      exit(`'decks' option is not a file or directory path.`);
   }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if(!isDirectory(path.dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   const config: ConfigConvert = {
      input,
      output: opts.output,
      db: opts.db,
      decks: opts.decks
   };

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await convert(config);
   }
   catch (err: unknown)
   {
      if (logger.isLevelEnabled('debug')) { console.error(err); }

      let message = typeof err === 'string' ? err : 'Unknown error';

      if (err instanceof Error) { message = err.message; }

      exit(message);
   }
}

/**
 * Invokes `filter` with the given config.
 *
 * @param input - Existing JSON card DB.
 *
 * @param opts - CLI options.
 */
export async function commandFilter(input: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(input)) { exit(`'input' option is not a file.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (isDirectory(opts.output)) { exit(`'output' option is an already existing directory.`); }

   if(!isDirectory(path.dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts.border !== void 0 && typeof opts.border !== 'string') { exit(`'border' option is not defined.`); }

   const border = opts.border ? validateBorder(opts.border) : null;

   if (opts.formats !== void 0 && typeof opts.formats !== 'string') { exit(`'formats' option is not defined.`); }

   const formats = opts.formats ? validateFormats(opts.formats) : null;

   if (opts['color-identity'] !== void 0 && typeof opts['color-identity'] !== 'string')
   {
      exit(`'color-identity' option must be a string.`);
   }

   let colorIdentity: Set<string> | null;

   if (opts['color-identity'])
   {
      colorIdentity = parseManaCostColors(opts['color-identity']);
      if (colorIdentity.size === 0)
      {
         exit(`'color-identity' option contains no valid WUBRG colors: ${opts['color-identity']}`);
      }
   }
   else
   {
      colorIdentity = null;
   }

   // Abort as no filtering options are provided.
   if (!border && !colorIdentity && !formats)
   {
      exit(`Aborting as no filtering options provided.`);
   }

   const config: ConfigFilter = {
      input,
      output: opts.output,
      border,
      colorIdentity,
      formats
   };

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await filter(config);
   }
   catch (err: unknown)
   {
      if (logger.isLevelEnabled('debug')) { console.error(err); }

      let message = typeof err === 'string' ? err : 'Unknown error';

      if (err instanceof Error) { message = err.message; }

      exit(message);
   }
}

export async function commandFindFormat(input: string, directory: string)
{
   console.log(`!!! commandFindFormat - input: `, input);
   console.log(`!!! commandFindFormat - directory: `, directory);
}

/**
 * Invokes `sort` with the given config and `dotenv` options.
 *
 * @param {string}   input - Scryfall converted card DB.
 *
 * @param {object}   opts - CLI options.
 *
 * @returns {Promise<void>}
 */
export async function commandSortFormat(input: string, opts: Record<string, any>): Promise<void>
{
   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (!isDirectory(opts.output)) { exit(`'output' option is not a directory: ${opts.output}`); }

   if (typeof opts.formats !== 'string') { exit(`'formats' option is not defined`); }

   const formats = validateFormats(opts.formats);

   if (formats.length === 0) { exit(`'formats' option is empty.`); }

   if (opts.mark !== void 0 && typeof opts.mark !== 'string') { exit(`'mark' option is not defined.`); }

   const mark: Set<string> = typeof opts.mark === 'string' ? new Set(opts.mark.split(':')) : new Set();

   if (opts.theme !== void 0)
   {
      if (typeof opts.theme !== 'string') { exit(`'theme' option is not defined.`); }

      if (opts.theme !== 'light' && opts.theme !== 'dark') { exit(`'theme' option is invalid: '${opts.theme}'.`); }
   }

   const theme = opts.theme === 'dark' ? 'dark' : 'light';

   const config: ConfigSortFormat = {
      input,
      output: opts.output,
      formats,
      mark,
      sortByType: opts['by-type'] ?? false,
      theme
   };

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await sortFormat(config);
   }
   catch (err)
   {
      if (logger.isLevelEnabled('debug')) { console.error(err); }

      let message = typeof err === 'string' ? err : 'Unknown error';

      if (err instanceof Error) { message = err.message; }

      exit(message);
   }
}

/**
 * @param message - A message.
 *
 * @param [exit=true] - Invoke `process.exit`.
 */
function exit(message: string, exit: boolean = true)
{
   console.error(`[31m[scrydex] ${message}[0m`);
   if (exit) { process.exit(1); }
}

/**
 * Parse and validate border colors.
 *
 * @param borders -
 */
function validateBorder(borders: string): Set<string>
{
   const entries = borders.split(':');

   const supportedBorder = new Set(['black', 'borderless', 'gold', 'silver', 'white', 'yellow']);

   const seen: Set<string> = new Set();

   for (const border of entries)
   {
      if (seen.has(border)) { exit(`'border' option contains duplicate border: ${border}`); }

      if (!supportedBorder.has(border)) { exit(`'border' option contains an invalid format: ${border}`); }

      seen.add(border);
   }

   return seen;
}

/**
 * Validates all common config options.
 */
function validateConfig(config: Record<string, any>)
{

}

/**
 * Parse and validate game formats.
 *
 * @param formats -
 */
function validateFormats(formats: string): string[]
{
   const result = formats.split(':');

   const seen: Set<string> = new Set();

   for (const format of result)
   {
      if (seen.has(format)) { exit(`'formats' option contains duplicate format: ${format}`); }

      if (!supportedFormats.has(format)) { exit(`'formats' option contains an invalid format: ${format}`); }

      seen.add(format);
   }

   return result;
}
