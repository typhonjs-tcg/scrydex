import fs                     from 'node:fs';
import { dirname }            from 'node:path';

import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import { ColorLogger }        from '@typhonjs-utils/logger-color';

import {
   convertCsv,
   // diff,
   exportCsv,
   exportExcel,
   exportLLM,
   exportTxt,
   fileCompress,
   filter,
   sortFormat }               from '#scrydex/commands';

import { CardDB }             from '#scrydex/data/db';
import { scryfallDownload }   from '#scrydex/data/scryfall';

import { find }               from './commands/find';

import { Validate }           from './Validate';

import type { ConfigCmd }     from '#scrydex/commands';
import type { ScryfallDB }    from '#scrydex/data/scryfall';

/**
 * Provides a ColorLogger instance for all CLI command usage.
 */
const logger: ColorLogger = new ColorLogger({ tag: 'scrydex' });

/* v8 ignore start */

/**
 * Handles exceptions from Scrydex SDK.
 *
 * @param err - Possible error
 */
function handleException(err: unknown)
{
   if (logger.isLevelEnabled('debug')) { console.error(err); }

   let message = typeof err === 'string' ? err : 'Unknown error';

   if (err instanceof Error) { message = err.message; }

   exit(message);
}

/* v8 ignore stop */

/**
 * Invokes `convert` with the given config.
 *
 * @param path - CSV input file path or directory path.
 *
 * @param opts - CLI options.
 */
export async function commandConvertCsv(path: string, opts: Record<string, any>): Promise<void>
{
   const config = validateConvert(path, opts);

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await convertCsv(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `fileCompress` with the given config.
 *
 * @param path - File path target.
 *
 * @param opts - CLI options.
 */
export async function commandFileCompress(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path)) { exit(`'path' option is not a file.`); }

   if (opts.mode !== 'compress' && opts.mode !== 'decompress') { exit(`'mode' option invalid.`); }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigCmd.FileCompress = {
      logger,
      mode: opts.mode,
      path
   };

   try
   {
      await fileCompress(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

// /**
//  * Invokes `diff` with the given config.
//  *
//  * @param baseline - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
//  *
//  * @param comparison - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
//  *
//  * @param opts - CLI options.
//  */
// export async function commandDiff(baseline: string, comparison: string, opts: Record<string, any>): Promise<void>
// {
//    if (!isFile(baseline) && !isDirectory(baseline)) { exit(`'inputA' option path is not a file or directory.`); }
//
//    if (!isFile(comparison) && !isDirectory(comparison)) { exit(`'inputB' option path is not a file or directory.`); }
//
//    if (isFile(baseline) && !isFile(comparison))
//    {
//       exit(`'inputA' option is a file path, but 'inputB' is not a file path.`);
//    }
//
//    if (isDirectory(baseline) && !isDirectory(comparison))
//    {
//       exit(`'inputA' option is a directory path, but 'inputB' is not a directory path.`);
//    }
//
//    if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }
//
//    /* v8 ignore next 1 */ // Set default log level to verbose.
//    const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';
//
//    if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }
//
//    const config: ConfigCmd.Diff = {
//       baseline,
//       comparison,
//       logger,
//       output: opts.output
//    };
//
//    try
//    {
//       await diff(config);
//       /* v8 ignore next 2 */
//    }
//    catch (err: unknown) { handleException(err); }
// }

/**
 * Invokes `exportCsv` with the given config.
 *
 * @param path - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandExportCsv(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path) && !isDirectory(path)) { exit(`'input' option path is not a file or directory.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (isFile(path) && fs.existsSync(opts.output) && isDirectory(opts.output))
   {
      exit(`'input' option is a file; 'output' option must also be a file.`);
   }

   if (isDirectory(path) && fs.existsSync(opts.output) && isFile(opts.output))
   {
      exit(`'input' option is a directory; 'output' option must also be a directory.`);
   }

   if (opts.coalesce !== void 0 && typeof opts.coalesce !== 'boolean')
   {
      exit(`'coalesce' option is not a boolean.`);
   }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigCmd.Export = {
      coalesce: opts.coalesce ?? false,
      logger,
      output: opts.output,
      path
   };

   try
   {
      await exportCsv(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `exportExcel` with the given config.
 *
 * @param path - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandExportExcel(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path)) { exit(`'input' option path is not a file.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (fs.existsSync(opts.output) && isDirectory(opts.output))
   {
      exit(`'output' option is a directory.`);
   }

   if (opts['by-kind'] !== void 0 && typeof opts['by-kind'] !== 'boolean')
   {
      exit(`'by-kind' option is not a boolean.`);
   }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (opts.filename !== void 0 && typeof opts.filename !== 'boolean')
   {
      exit(`'no-filename' option is not a boolean.`);
   }

   if (opts.price !== void 0 && typeof opts.price !== 'boolean')
   {
      exit(`'no-price' option is not a boolean.`);
   }

   if (opts.rarity !== void 0 && typeof opts.rarity !== 'boolean')
   {
      exit(`'no-rarity' option is not a boolean.`);
   }

   if (opts.theme !== void 0)
   {
      if (typeof opts.theme !== 'string') { exit(`'theme' option is not defined.`); }

      if (opts.theme !== 'light' && opts.theme !== 'dark') { exit(`'theme' option is invalid: '${opts.theme}'.`); }
   }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigCmd.ExportSpreadsheet = {
      columns: {
         filename: typeof opts.filename === 'boolean' ? opts.filename : true,
         price: typeof opts.price === 'boolean' ? opts.price : true,
         rarity: typeof opts.rarity === 'boolean' ? opts.rarity : true
      },
      logger,
      output: opts.output,
      path,
      sort: {
         byKind: typeof opts['by-kind'] === 'boolean' ? opts['by-kind'] : false,
         byType: typeof opts['by-type'] === 'boolean' ? opts['by-type'] : false
      },
      theme: opts.theme
   };

   try
   {
      await exportExcel(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `exportLLM` with the given config.
 *
 * @param path - File path of CardDB or directory path to search for JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandExportLLM(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path) && !isDirectory(path)) { exit(`'input' option path is not a file or directory.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (isFile(path) && fs.existsSync(opts.output) && isDirectory(opts.output))
   {
      exit(`'input' option is a file; 'output' option must also be a file.`);
   }

   if (isDirectory(path) && fs.existsSync(opts.output) && isFile(opts.output))
   {
      exit(`'input' option is a directory; 'output' option must also be a directory.`);
   }

   if (opts['oracle-text'] !== void 0 && typeof opts['oracle-text'] !== 'boolean')
   {
      exit(`'no-oracle-text' option is not a boolean.`);
   }

   if (opts.types !== void 0 && typeof opts.types !== 'boolean')
   {
      exit(`'types' option is not a boolean.`);
   }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigCmd.ExportLLM = {
      logger,
      oracleText: opts['oracle-text'] ?? true,
      output: opts.output,
      path,
      types: opts.types ?? false,
   };

   try
   {
      await exportLLM(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `exportTxt` with the given config.
 *
 * @param path - File path of CardDB or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param opts - CLI options.
 */
export async function commandExportTxt(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path) && !isDirectory(path)) { exit(`'input' option path is not a file or directory.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (isFile(path) && fs.existsSync(opts.output) && isDirectory(opts.output))
   {
      exit(`'input' option is a file; 'output' option must also be a file.`);
   }

   if (isDirectory(path) && fs.existsSync(opts.output) && isFile(opts.output))
   {
      exit(`'input' option is a directory; 'output' option must also be a directory.`);
   }

   if (opts.coalesce !== void 0 && typeof opts.coalesce !== 'boolean')
   {
      exit(`'coalesce' option is not a boolean.`);
   }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const config: ConfigCmd.Export = {
      coalesce: opts.coalesce ?? false,
      logger,
      output: opts.output,
      path
   };

   try
   {
      await exportTxt(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `filter` with the given config.
 *
 * @param path - Existing JSON card DB.
 *
 * @param opts - CLI options.
 */
export async function commandFilter(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path)) { exit(`'input' option is not a file.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (isDirectory(opts.output)) { exit(`'output' option is an already existing directory.`); }

   if (!isDirectory(dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   if (opts.compress !== void 0 && typeof opts.compress !== 'boolean') { exit(`'compress' option is not a boolean.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   const filterOptions = Validate.filterOptions(opts);

   // A string indicates validation error is detected.
   if (typeof filterOptions === 'string') { exit(filterOptions); }

   // Abort as no filtering options are provided.
   if (Object.keys(filterOptions).length === 0)
   {
      exit(`Aborting as no filtering options provided.`);
   }

   const config: ConfigCmd.Filter = {
      compress: opts.compress ?? false,
      filter: filterOptions as CardDB.Options.CardFilter,
      logger,
      output: opts.output,
      path
   };

   try
   {
      await filter(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/**
 * Invokes `find` with the given config.
 *
 * @param path - File or directory path to search for _sorted_ JSON CardDBs.
 *
 * @param query - Search text / regular expression.
 *
 * @param opts - CLI options.
 */
export async function commandFind(path: string, query: string, opts: Record<string, any>)
{
   if (!isFile(path) && !isDirectory(path)) { exit(`'input' option path is not a file or directory.`); }

   if (query !== void 0 && typeof query !== 'string') { exit(`'query' option must be a string.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   const filter = Validate.filterOptions(opts, query);

   // A string indicates validation error is detected.
   if (typeof filter === 'string') { exit(filter); }

   const config = {
      filter,
      logger,
      path
   };

   try
   {
      await find(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/* v8 ignore start */ // Scryfall DB download not covered in automated tests.

/**
 * Invokes `scryfallDownload` with the given config.
 *
 * @param opts - CLI options.
 */
export async function commandScryfallDownload(opts: Record<string, any>): Promise<void>
{
   if (opts['all-cards'] !== void 0 && typeof opts['all-cards'] !== 'boolean')
   {
      exit(`'all-cards' option is not a boolean.`);
   }

   if (opts.force !== void 0 && typeof opts.force !== 'boolean')
   {
      exit(`'force' option is not a boolean.`);
   }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   const config = {
      dbType: (opts['all-cards'] ? 'all_cards' : 'default_cards') as ScryfallDB.File.DBType,
      dirpath: './db',
      force: opts.force as boolean ?? false,
      logger
   };

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await scryfallDownload(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
}

/* v8 ignore stop */

/**
 * Invokes `sort` with the given config.
 *
 * @param path - Scryfall converted card DB.
 *
 * @param opts - CLI options.
 */
export async function commandSortFormat(path: string, opts: Record<string, any>): Promise<void>
{
   if (!isFile(path)) { exit(`'input' option path is not a file.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (opts.compress !== void 0 && typeof opts.compress !== 'boolean') { exit(`'compress' option is not a boolean.`); }

   if (typeof opts.formats !== 'string') { exit(`'formats' option is not defined.`); }

   const formats = Validate.gameFormats(opts.formats);

   if (typeof formats === 'string') { exit(formats); }

   if (opts.clean !== void 0 && typeof opts.clean !== 'boolean') { exit(`'clean' option is not a boolean.`); }

   if (opts['high-value'] !== void 0 && typeof opts['high-value'] !== 'string')
   {
      exit(`'high-value' option is not defined.`);
   }

   let highValue: CardDB.Data.PriceExpression | null = null;

   if (opts['high-value'])
   {
      highValue = CardDB.Price.parseExpression(opts['high-value']);

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

   const config: ConfigCmd.SortFormat = {
      clean: opts.clean ?? false,
      formats,
      highValue,
      logger,
      mark,
      compress: opts.compress ?? false,
      output: opts.output,
      path,
      sort: {
         byType: opts['by-type'] ?? false
      },
      theme
   };

   /* v8 ignore next 1 */ // Set default log level to verbose.
   const loglevel = typeof opts.loglevel === 'string' ? opts.loglevel : 'verbose';

   if (logger.isValidLevel(loglevel)) { logger.setLogLevel(loglevel); }

   try
   {
      await sortFormat(config);
      /* v8 ignore next 2 */
   }
   catch (err: unknown) { handleException(err); }
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
 * @param path - CSV input file path or directory path.
 *
 * @param opts - CLI options.
 *
 * @return ConfigConvert object.
 */
function validateConvert(path: string, opts: Record<string, any>): ConfigCmd.Convert
{
   if (!isFile(path) && !isDirectory(path)) { exit(`'path' option is not a file or directory path.`); }
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

   if (opts.compress !== void 0 && typeof opts.compress !== 'boolean') { exit(`'compress' option is not a boolean.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (typeof opts.output !== 'string') { exit(`'output' option is not defined.`); }

   return {
      compress: opts.compress ?? false,
      db: opts.db,
      groups: {
         decks: opts['group-decks'],
         external: opts['group-external'],
         proxy: opts['group-proxy']
      },
      logger,
      output: opts.output,
      path,
   };
}

