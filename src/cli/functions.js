import path                   from 'node:path';

import {
   isDirectory,
   isFile }                   from '@typhonjs-utils/file-util';

import {
   convert,
   sort }                     from '#commands';

import { supportedFormats }   from '#data';

import { logger }             from '#util';

/**
 * Invokes `convert` with the given config and `dotenv` options.
 *
 * @param {string}   input - Manabox collection CSV input file path or directory path.
 *
 * @param {object}   opts - CLI options.
 *
 * @returns {Promise<void>}
 */
export async function commandConvert(input, opts)
{
   // TODO: process options.

   // console.log(`!!! CLI-convert - 0 - input: ${input}`);
   // console.log(`!!! CLI-convert - 1 - opts:\n${JSON.stringify(opts, null, 2)}`);

   if (!isFile(input) && !isDirectory(input)) { exit(`'input' option is not a file or directory path.`); }
   if (!isFile(opts.db)) { exit(`'db' option is not a file path.`); }

   if (opts.indent !== void 0 && typeof opts.indent !== 'number') { exit(`'indent' option is not a number.`); }
   if (opts.indent !== void 0 && (opts.indent < 0 || opts.indent > 8)) { exit(`'indent' option must be 0 - 8.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts.compact !== void 0 && typeof opts.compact !== 'boolean') { exit(`'compact' option is not a boolean.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if(!isDirectory(path.dirname(opts.output))) { exit(`'output' option path has an invalid directory.`); }

   /** @type {import('#types-command').ConfigConvert} */
   const config = {
      input,
      output: opts.output,
      db: opts.db,
      compact: typeof opts.compact === 'boolean' ? opts.compact : false,
      indent: typeof opts.indent === 'number' ? opts.indent : null
   };

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   try
   {
      await convert(config);
   }
   catch (err)
   {
      if (logger.isLevelEnabled('debug'))
      {
         console.error(err);
      }

      exit(err?.message);
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
export async function commandSort(input, opts)
{
   // TODO: process options.

    console.log(`!!! CLI-sort - 0 - input: ${input}`);
    console.log(`!!! CLI-sort - 1 - opts:\n${JSON.stringify(opts, null, 2)}`);

   if (opts.indent !== void 0 && typeof opts.indent !== 'number') { exit(`'indent' option is not a number.`); }
   if (opts.indent !== void 0 && (opts.indent < 0 || opts.indent > 8)) { exit(`'indent' option must be 0 - 8.`); }

   if (opts.loglevel !== void 0 && !logger.isValidLevel(opts.loglevel)) { exit(`'loglevel' option is invalid.`); }

   if (opts['by-type'] !== void 0 && typeof opts['by-type'] !== 'boolean')
   {
      exit(`'by-type' option is not a boolean.`);
   }

   if (opts.compact !== void 0 && typeof opts.compact !== 'boolean') { exit(`'compact' option is not a boolean.`); }

   if (opts.output === void 0) { exit(`'output' option is not defined.`); }

   if (!isDirectory(opts.output)) { exit(`'output' option is not a directory: ${opts.output}`); }

   if (typeof opts.formats !== 'string') { exit(`'formats' option is not defined`); }

   const formats = opts.formats.split(':');

   for (const format of formats)
   {
      if (!supportedFormats.has(format)) { exit(`'formats' option contains an invalid format: ${format}`); }
   }

   /** @type {import('#types-command').ConfigSort} */
   const config = {
      input,
      output: opts.output,
      formats,
      sortByType: opts['by-type'] ?? false
   };

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   try
   {
      await sort(config);
   }
   catch (err)
   {
      if (logger.isLevelEnabled('debug'))
      {
         console.error(err);
      }

      exit(err?.message);
   }
}

/**
 * @param {string} message - A message.
 *
 * @param {boolean} [exit=true] - Invoke `process.exit`.
 */
function exit(message, exit = true)
{
   console.error(`[31m[scrydex] ${message}[0m`);
   if (exit) { process.exit(1); }
}
