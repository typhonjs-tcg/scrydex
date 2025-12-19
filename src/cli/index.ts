#!/usr/bin/env node
import sade                   from 'sade';

import {
   commandConvert,
   commandFilter,
   commandFindFormat,
   commandSortFormat }        from './functions';

import { wrap }               from './wrap';

import { supportedFormats }   from '#data';
import { VERSION }            from '#version';

const program = sade('scrydex')
.version(VERSION.package)

// Global options
.option('-l, --loglevel', `Specify logging level: 'off', 'fatal', 'error', 'warn', 'info', 'debug', 'verbose', ` +
 `'trace', or 'all'.`);

program
.command('convert [input]', 'Convert')
.describe(`Converts CSV card collection files to a compact Scryfall card DB.`)
.option('--db', `Provide a path to a Scryfall JSON DB.`)
.option('--decks', 'Provide a file or directory path of CSV card collections that are in decks / checked out.')
.option('--output', 'Provide a file path for generated JSON card DB output.')
.example('convert ./collection.csv --output ./collection.json -db ./scryfall.json')
.example('convert ./collection-dir --output ./collection-all.json -db ./scryfall.json')
.action(commandConvert);

program
.command('filter [input]', 'Filter')
.describe(`Filters an existing JSON card DB by game formats and other card attributes.`)
.option('--border', 'Provide a colon separated list of border colors including: black, white, borderless, yellow, silver, or gold.')
.option('--color-identity', 'Provide a WUBRG color string such as `{W}{U}{B}` to filter by color identity.')
.option('--formats', 'Provide a colon separated list of game formats for filtering.')
.option('--output', 'Provide a file path for filtered JSON DB output.')
.example('filter ./collection.json --formats premodern --output ./just-premodern.json')
.example('filter ./collection.json --formats commander --color-identity {W}{U}{G} --output ./commander-wug.json')
.example('filter ./collection.json --border black:borderless --output ./black-borderless.json')
.action(commandFilter);

program
.command('find [input] [dirpath]', 'Find Card')
.describe(`Finds a card by text / regular expression from a sorted format directory.`)
.option('-i', 'Case insensitive search.')
.option('-b', 'Enforce word boundaries on search.')
.option('--exact', 'Match the search text exactly.')
.option('--oracle', 'Match against the card oracle text.')
.option('--name', 'Match against the card name (default).')
.option('--type', 'Match against the card type line.')
.option('--border', 'Provide a colon separated list of border colors including: black, white, borderless, yellow, silver, or gold.')
.option('--color-identity', 'Provide a WUBRG color string such as `{W}{U}{B}` to match by color identity.')
.option('--cmc', 'Provide `0` to a positive finite number to match CMC / converted mana cost.')
.option('--formats', 'Provide a colon separated list of legal game formats.')
.option('--keywords', 'Provide a colon separated list of keywords such as `Flying` or `Cumulative upkeep`.')
.option('--mana-cost', 'Provide the exact encoded symbol match such as `{1}{G}` to match mana cost.')
.example('find "Demonic Tutor" ./sorted-directory')
.action(commandFindFormat);

program.command('formats', `List all supported Scryfall game 'formats'.`)
.action(() => console.log(wrap(`Supported Scryfall game 'formats':\n${Array.from(supportedFormats).join(', ')}`)));

program
.command('sort [input]', 'Sort')
.describe(`Sorts a converted Scryfall card DB by game format legalities outputting spreadsheets.`)
.option('--by-type', 'Sorts alphabetically then by normalized type of card.')
.option('--formats', 'Provide a colon separated list of game formats for sorting.')
.option('--mark', 'Provide a colon separated list of CSV file names to highlight merge status.')
.option('--output', 'Provide a directory path for generated spreadsheets.')
.option('--theme', 'Options are `light` or `dark`; light theme is default.')
.example('sort ./collection.json --formats premodern:oldschool:predh:commander --output ./spreadsheets')
.example('sort ./collection.json --formats predh:commander --output ./spreadsheets')
.action(commandSortFormat);

program.parse(process.argv);
