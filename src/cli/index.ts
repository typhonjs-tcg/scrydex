#!/usr/bin/env node
import sade                   from 'sade';

import { getPackage }         from '@typhonjs-utils/package-json';

import {
   commandConvert,
   commandSort }              from './functions';

import { wrap }               from './wrap';

import { supportedFormats }   from '#data';

// Retrieve the `esm-d-ts` package.
const packageObj = getPackage({ filepath: import.meta.url });

const program = sade('scrydex')
.version((packageObj as any)?.version)

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
.example('convert ./collection.csv --compact --output ./collection.json -db ./scryfall.json')
.action(commandConvert);

program.command('formats', `List all supported Scryfall game 'formats'.`)
.action(() => console.log(wrap(`Supported Scryfall game 'formats':\n${Array.from(supportedFormats).join(', ')}`)));

program
.command('sort [input]', 'Sort')
.describe(`Sorts a converted Scryfall card DB by format legalities outputting spreadsheets.`)
.option('--by-type', 'Sorts alphabetically then by type of card.')
.option('--formats', 'Provide a colon separated list of formats for sorting.')
.option('--mark', 'Provide a colon separated list of CSV file names to highlight merge status.')
.option('--output', 'Provide a directory path for generated spreadsheets.')
.option('--theme', 'Options are `light` or `dark`; light theme is default.')
.example('sort ./collection.json --formats premodern:oldschool:predh:commander --output ./spreadsheets')
.example('sort ./collection.json --formats predh:commander --output ./spreadsheets')
.action(commandSort);

program.parse(process.argv);
