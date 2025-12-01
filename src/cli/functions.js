// import path          from 'node:path';
//
// import { isFile }    from '@typhonjs-utils/file-util';
// import { isObject }  from '@typhonjs-utils/object';
//
// import { logger }    from '#util';

import { convert }   from '../convert/index.js';

import { logger }    from '#util';

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

   const config = {
      input,
      output: opts.output,
      db: opts.db,
      indent: typeof opts.indent === 'number' ? opts.indent : null // TODO Sanity check
   };

   if (logger.isValidLevel(opts.loglevel)) { logger.setLogLevel(opts.loglevel); }

   await convert(config);
}

// /**
//  * @param {string}   input - Source / input file
//  *
//  * @param {object}   opts - CLI options.
//  *
//  * @returns {Promise<object|undefined>} Processed options.
//  */
// async function processOptions(input, opts)
// {
//    // Invalid / no options for source file path or config file.
//    if (typeof input !== 'string' && opts.config === void 0)
//    {
//       exit('Invalid options: missing `[input]` and no config file option provided.');
//    }
//
//    if (typeof opts?.loglevel === 'string')
//    {
//       if (!logger.isValidLevel(opts.loglevel))
//       {
//          exit(`Invalid options: log level '${
//             opts.loglevel}' must be 'off', 'fatal', 'error', 'warn', 'info', 'debug', 'verbose', 'trace', or 'all'.`);
//       }
//
//       logger.setLogLevel(opts.loglevel);
//    }
//
//    const dirname = path.dirname(process.cwd());
//
//    let config;
//
//    if (opts.config)
//    {
//       switch (typeof opts.config)
//       {
//          // Load specific config.
//          case 'string':
//          {
//             const configPath = path.resolve(opts.config);
//
//             if (!isFile(configPath)) { exit(`No config file available at: ${configPath}`); }
//
//             logger.verbose(`Loading config from path: ${configPath}`);
//
//             // config = loadConfig(configPath);
//
//             break;
//          }
//       }
//
//       if (isObject(config))
//       {
//          if (typeof opts?.loglevel === 'string') { config.logLevel = opts.loglevel; }
//       }
//    }
//    else
//    {
//       // Verify `input` file.
//       if (typeof input === 'string')
//       {
//          const inputpath = path.resolve(input);
//          if (!isFile(inputpath)) { exit(`No input / entry point file exists for: ${input}`); }
//       }
//    }
//
//    return config;
// }

// /**
//  * @param {string} message - A message.
//  *
//  * @param {boolean} [exit=true] - Invoke `process.exit`.
//  */
// function exit(message, exit = true)
// {
//    console.error(`[31m[scrydekt] ${message}[0m`);
//    if (exit) { process.exit(1); }
// }
