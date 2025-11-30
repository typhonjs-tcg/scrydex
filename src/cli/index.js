#!/usr/bin/env node
import { getPackage }      from '@typhonjs-utils/package-json';
import sade                from 'sade';

import { commandConvert }  from './functions.js';

// Retrieve the `esm-d-ts` package.
const packageObj = getPackage({ filepath: import.meta.url });

const program = sade('scrybox')
.version(packageObj?.version)

   // Global options
   .option('-l, --loglevel', `Specify logging level: 'off', 'fatal', 'error', 'warn', 'info', 'debug', 'verbose', ` +
      `'trace', or 'all'.`);

program
.command('convert [input]', 'Convert')
.describe(`Converts the ManaBox collection CSV output to a compact Scryfall card collection.`)
.option('--db', `Provide a path to a Scryfall JSON DB.`)
.option('--indent', `Defines the JSON output indentation.`)
.option('--output', 'Provide a file path to generated collection output.')
.example('scrybox convert ./collection.csv --output ./collection.json -db ./scryfall.json')
.action(commandConvert);

program.parse(process.argv);
