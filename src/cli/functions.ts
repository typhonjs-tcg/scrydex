import fs                  from 'node:fs';
import path                from 'node:path';

import {
   isDirectory,
   isFile }                from '@typhonjs-utils/file-util';

import {
   convertCsv,
   exportCsv,
   filter,
   find,
   sortFormat }            from '#commands';

import {
   CardFilter,
   parsePriceExpression }  from '#data';

import { logger }          from '#util';

import type {
   ConfigConvert,
   ConfigExport,
   ConfigFilter,
   ConfigFind,
   ConfigSortFormat }      from '#types-command';

import { PriceExpression } from '#types-data';

/**
 * Invokes `convert` with the given config.
 *
 * @param input - CSV input file path or directory path.
 *
 * @param opts - CLI options.
 */
export async function commandConvertCsv(input: string, opts: Record<string, any>): Promise<void>
{
   const config = validateConvert(input, opts);

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await convertCsv(config);
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
 * Invokes `exportCsv` with the given config.
 *
 * @param input - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandExportCsv(input: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(input) && !isDirectory(input)) { exit(`'input' option path is not a file or directory.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (isFile(input) && fs.existsSync(opts.output) && isDirectory(opts.output))
   {
      exit(`'input' options is a file; 'output' option must also be a file.`);
   }

   if (isDirectory(input) && fs.existsSync(opts.output) && isFile(opts.output))
   {
      exit(`'input' options is a directory; 'output' option must also be a directory.`);
   }

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigExport = {
      input,
      output: opts.output
   };

   try
   {
      await exportCsv(config);
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

   if (!isDirectory(path.dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const filterOptions = CardFilter.validateCLIOptions(opts);

   // A string indicates validation error is detected.
   if (typeof filterOptions === 'string') { exit(filterOptions); }

   // Abort as no filtering options are provided.
   if (Object.keys(filterOptions).length === 0)
   {
      exit(`Aborting as no filtering options provided.`);
   }

   const config: ConfigFilter = {
      input,
      output: opts.output,
      filter: filterOptions
   };

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

/**
 * Invokes `find` with the given config.
 *
 * @param input - File or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param query - Search text / regular expression.
 *
 * @param opts - CLI options.
 */
export async function commandFind(input: string, query: string, opts: Record<string, any>)
{
   if (!isFile(input) && !isDirectory(input)) { exit(`'input' option path is not a file or directory.`); }

   if (query !== void 0 && typeof query !== 'string') { exit(`'query' option must be a string.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   const filter = CardFilter.validateCLIOptions(opts, query);

   // A string indicates validation error is detected.
   if (typeof filter === 'string') { exit(filter); }

   const config: ConfigFind = {
      input,
      filter
   };

   try
   {
      await find(config);
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
   if (!isFile(input)) { exit(`'input' option path is not a file.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (!isDirectory(opts.output)) { exit(`'output' option is not a directory: ${opts.output}`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (typeof opts.formats !== 'string') { exit(`'formats' option is not defined.`); }

   const formats = CardFilter.validateCLIFormats(opts.formats);

   if (typeof formats === 'string') { exit(formats); }

   if (opts.clean !== void 0 && typeof opts.clean !== 'boolean') { exit(`'clean' option is not a boolean.`); }

   if (opts['high-value'] !== void 0 && typeof opts['high-value'] !== 'string')
   {
      exit(`'high-value' option is not defined.`);
   }

   let highValue: PriceExpression | null = null;

   if (opts['high-value'])
   {
      highValue = parsePriceExpression(opts['high-value']);

      if (!highValue) { exit(`'high-value' option is invalid: ${opts['high-value']}`); }

      if (highValue.operator === '<' || highValue.operator === '<=')
      {
         exit(`'high-value' option must be '>' or '>=' price comparison.`);
      }

      if (highValue.value < 1)
      {
         exit(`'high-value' option must be a positive threshold strictly greater than 1.`);
      }
   }

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
      clean: opts.clean ?? false,
      formats,
      highValue,
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

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Exit process with error message.
 *
 * @param message - A message.
 */
function exit(message: string): never
{
   console.error(`[31m[scrydex] ${message}[0m`);
   process.exit(1);
}

/**
 * Validate the CLI options for `covert` commands.
 *
 * @param input - CSV input file path or directory path.
 *
 * @param opts - CLI options.
 *
 * @return ConfigConvert object.
 */
export function validateConvert(input: string, opts: Record<string, any>): ConfigConvert
{
   if (!isFile(input) && !isDirectory(input)) { exit(`'input' option is not a file or directory path.`); }
   if (!isFile(opts.db)) { exit(`'db' option is not a file path.`); }

   if (opts['group-decks'] !== void 0 && !isFile(opts['group-decks']) && !isDirectory(opts['group-decks']))
   {
      exit(`'group-decks' option is not a file or directory path.`);
   }

   if (opts['group-external'] !== void 0 && !isFile(opts['group-external']) && !isDirectory(opts['group-external']))
   {
      exit(`'group-external' option is not a file or directory path.`);
   }

   if (opts['group-proxy'] !== void 0 && !isFile(opts['group-proxy']) && !isDirectory(opts['group-proxy']))
   {
      exit(`'group-proxy' option is not a file or directory path.`);
   }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (!isDirectory(path.dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   return {
      input,
      output: opts.output,
      db: opts.db,
      groups: {
         decks: opts['group-decks'],
         external: opts['group-external'],
         proxy: opts['group-proxy']
      }
   };
}
