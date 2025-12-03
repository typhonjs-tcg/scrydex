#!/usr/bin/env node
import { getPackage }      from '@typhonjs-utils/package-json';
import sade                from 'sade';

import {
   commandConvert,
   commandSort }  from './functions.js';

// Retrieve the `esm-d-ts` package.
const packageObj = getPackage({ filepath: import.meta.url });

const program = sade('scrydex')
.version(packageObj?.version)

   // Global options
   .option('-l, --loglevel', `Specify logging level: 'off', 'fatal', 'error', 'warn', 'info', 'debug', 'verbose', ` +
      `'trace', or 'all'.`);

program
.command('convert [input]', 'Convert')
.describe(`Converts CSV collection files to a compact Scryfall card collection.`)
.option('--compact', `Output JSON DB will contain a card per row.`)
.option('--db', `Provide a path to a Scryfall JSON DB.`)
.option('--indent', `Defines the JSON output indentation.`)
.option('--output', 'Provide a file path for generated collection output.')
.example('scrydex convert ./collection.csv --output ./collection.json -db ./scryfall.json')
.action(commandConvert);

program
.command('sort [input]', 'Sort')
.describe(`Sorts a converted Scryfall card DB by format legalities outputting spreadsheets.`)
.option('--formats', 'Provide a colon separated list of formats for sorting.')
.option('--output', 'Provide a directory path for generated spreadsheets.')
.example('scrydex sort ./collection.json --output ./spreadsheets')
.action(commandSort);

program.parse(process.argv);
