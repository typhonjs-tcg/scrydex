import path             from 'node:path';

import {
   isDirectory,
   isFile }             from '@typhonjs-utils/file-util';

import {
   convert,
   filter,
   find,
   sortFormat }         from '#commands';

import { CardFilter }   from '#data';

import { logger }       from '#util';

import type {
   ConfigConvert,
   ConfigFilter,
   ConfigFind,
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
 * @param input - Search text / regular expression.
 *
 * @param dirpath - Directory path to search for _sorted_ JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandFindFormat(input: string, dirpath: string, opts: Record<string, any>)
{
   if (typeof input !== 'string') { exit(`'input' option must be a string.`); }
   if(!isDirectory(dirpath)) { exit(`'directory' option path is an invalid directory.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   const filter = CardFilter.validateCLIOptions(opts, input);

   // A string indicates validation error is detected.
   if (typeof filter === 'string') { exit(filter); }

   const config: ConfigFind = {
      dirpath,
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
   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (!isDirectory(opts.output)) { exit(`'output' option is not a directory: ${opts.output}`); }

   if (typeof opts.formats !== 'string') { exit(`'formats' option is not defined`); }

   const formats = CardFilter.validateCLIFormats(opts.formats);

   if (typeof formats === 'string') { exit(formats); }

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
 * Exit process with error message.
 *
 * @param message - A message.
 */
function exit(message: string): never
{
   console.error(`[31m[scrydex] ${message}[0m`);
   process.exit(1);
}
