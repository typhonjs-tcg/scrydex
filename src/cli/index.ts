#!/usr/bin/env node
import sade                   from 'sade';

import { getPackage }         from '@typhonjs-utils/package-json';

import {
   commandConvert,
   commandFilter,
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
.describe(`Converts CSV card collection files to a compact Scryfall card DB.`)
.option('--db', `Provide a path to a Scryfall JSON DB.`)
.option('--decks', 'Provide a file or directory path of CSV card collections that are in decks / checked out.')
.option('--output', 'Provide a file path for generated collection output.')
.example('convert ./collection.csv --output ./collection.json -db ./scryfall.json')
.example('convert ./collection-dir --output ./collection-all.json -db ./scryfall.json')
.action(commandConvert);

program
.command('filter [input]', 'Filter')
.describe(`Filters an existing JSON card DB by game formats and other card attributes.`)
.option('--color-identity', 'Provide a WUBRG color string such as `{W}{U}{B}` to filter by color identity.')
.option('--formats', 'Provide a colon separated list of game formats for filtering.')
.option('--output', 'Provide a file path for filtered JSON DB output.')
.example('filter ./collection.json --formats premodern --output ./just-premodern.json')
.example('filter ./collection.json --formats commander --color-identity {W}{U}{G} --output ./commander-wug.json')
.action(commandFilter);

program.command('formats', `List all supported Scryfall game 'formats'.`)
.action(() => console.log(wrap(`Supported Scryfall game 'formats':\n${Array.from(supportedFormats).join(', ')}`)));

program
.command('sort [input]', 'Sort')
.describe(`Sorts a converted Scryfall card DB by game format legalities outputting spreadsheets.`)
.option('--by-type', 'Sorts alphabetically then by type of card.')
.option('--formats', 'Provide a colon separated list of game formats for sorting.')
.option('--mark', 'Provide a colon separated list of CSV file names to highlight merge status.')
.option('--output', 'Provide a directory path for generated spreadsheets.')
.option('--theme', 'Options are `light` or `dark`; light theme is default.')
.example('sort ./collection.json --formats premodern:oldschool:predh:commander --output ./spreadsheets')
.example('sort ./collection.json --formats predh:commander --output ./spreadsheets')
.action(commandSort);

program.parse(process.argv);
