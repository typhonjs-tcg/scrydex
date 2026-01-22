#!/usr/bin/env node
import sade             from 'sade';

import {
   commandConvertCsv,
   commandDiff,
   commandExportCsv,
   commandExportTxt,
   commandFilter,
   commandFind,
   commandScryfallDownload,
   commandSortFormat }  from './functions';

import { wrap }         from './wrap';

import { VERSION }      from '#scrydex';
import { ScryfallData } from '#scrydex/data/scryfall';

const program = sade('scrydex')
.version(VERSION.package)

// Global options
.option('-l, --loglevel', `Specify logging level: 'off', 'fatal', 'error', 'warn', 'info', 'debug', 'verbose', ` +
 `'trace', or 'all'.`);

program
.command('convert-csv [path]', 'Convert')
.describe(`Converts CSV card collection files to a compact Scrydex CardDB.`)
.option('--db', `Provide a path to a Scryfall JSON DB.`)
.option('--group-decks', 'Provide a file or directory path of CSV card collections representing active decks.')
.option('--group-external', 'Provide a file or directory path of CSV card collections representing externally organized collections.')
.option('--group-proxy', 'Provide a file or directory path of CSV card collections representing proxy cards.')
.option('--output', 'Provide a file path for generated JSON card DB output.')
.example('convert ./collection.csv --output ./collection.json -db ./scryfall.json')
.example('convert ./collection-dir --output ./collection-all.json -db ./scryfall.json')
.action(commandConvertCsv);

program
.command('diff [baseline] [comparison]', 'Compare CardDBs')
.describe('Compares two CardDBs or two directories of sorted CardDBs and generates a spreadsheet report of added, removed, and changed cards.')
.option('--output', 'Provide an output directory for generated diff report spreadsheets.')
.example('diff ./carddb-a.json ./carddb-b.json --output ./diff-report')
.example('diff ./sorted-a ./sorted-b --output ./diff-report-sorted')
.action(commandDiff);

program
.command('export-csv [path]', 'Export CSV')
.describe('Exports all sorted Scrydex CardDB files from a directory or file path to a single CardDB outputting collection CSV files.')
.option('--no-coalesce', 'Export cards without combining identical printings.')
.option('--output', 'Provide an output file path or directory path for generated CSV card collection file(s).')
.example('export-csv ./collection.json --output ./collection.csv')
.example('export-csv ./sorted-directory --output ./csv-sorted')
.action(commandExportCsv);

program
.command('export-txt [path]', 'Export Text')
.describe('Exports all sorted Scrydex CardDB files from a directory or file path to a single CardDB outputting collection text files.')
.option('--no-coalesce', 'Export cards without combining identical printings.')
.option('--output', 'Provide an output file path or directory path for generated text card collection file(s).')
.example('export-txt ./collection.json --output ./collection.txt')
.example('export-txt ./sorted-directory --output ./txt-sorted')
.action(commandExportTxt);

program
.command('filter [path]', 'Filter')
.describe(`Filters an existing Scrydex CardDB by game formats and other card attributes.`)
.option('--border', 'Provide a colon separated list of border colors including: black, white, borderless, yellow, silver, or gold.')
.option('--color-identity', 'Provide a WUBRG color string such as `{W}{U}{B}` to match by color identity.')
.option('--cmc', 'Provide `0` to a positive finite number to match CMC / converted mana cost.')
.option('--formats', 'Provide a colon separated list of legal game formats.')
.option('--keywords', 'Provide a colon separated list of keywords such as `Flying` or `Cumulative upkeep`.')
.option('--mana-cost', 'Provide the exact encoded symbol match such as `{1}{G}` to match mana cost.')
.option('--output', 'Provide a file path for filtered JSON card DB output.')
.option('--price', 'Provide a price comparison expression (IE ">=10", "<2.50") or "null" for unpriced cards.')
.example('filter ./collection.json --formats premodern --output ./just-premodern.json')
.example('filter ./collection.json --formats commander --color-identity {W}{U}{G} --output ./commander-wug.json')
.example('filter ./collection.json --border black:borderless --output ./black-borderless.json')
.action(commandFilter);

program
.command('find [path] [query]', 'Find Card')
.describe(
 'Finds a card by text / regular expression from a sorted format directory or file path to a single CardDB.\n' +
  '    You may omit `[query]` and provide just `[path]` when only using independent filter options.')
.option('-i', 'Case insensitive search.')
.option('-b', 'Enforce word boundaries on search.')
.option('--exact', 'Match the search query exactly.')
.option('--oracle', 'Match the search query against the card oracle text.')
.option('--name', 'Match the search query against the card name (default).')
.option('--type', 'Match the search query against the card type line.')
.option('--border', 'Provide a colon separated list of border colors including: black, white, borderless, yellow, silver, or gold.')
.option('--color-identity', 'Provide a WUBRG color string such as `{W}{U}{B}` to match by color identity.')
.option('--cmc', 'Provide `0` to a positive finite number to match CMC / converted mana cost.')
.option('--formats', 'Provide a colon separated list of legal game formats.')
.option('--keywords', 'Provide a colon separated list of keywords such as `Flying` or `Cumulative upkeep`.')
.option('--mana-cost', 'Provide the exact encoded symbol match such as `{1}{G}` to match mana cost.')
.option('--price', 'Provide a price comparison expression (IE ">=10", "<2.50") or "null" for unpriced cards..')
.example('find "Demonic Tutor" ./sorted-directory')
.action(commandFind);

program.command('formats', `List all supported Scryfall game 'formats'.`)
.action(() =>
{
   console.log(wrap(`Supported Scryfall game 'formats':\n${Array.from(ScryfallData.supportedFormats).join(', ')}`));
});

program
.command('scryfall-download', 'Scryfall DB Download')
.describe(`Downloads the Scryfall DB to './db'.`)
.option('--all-cards', 'Download the very large (~2.3GB) all cards DB which includes all languages.')
.option('--force', 'Ignore cache and force re-download.')
.example('scryfall-download')
.example('scryfall-download --all-cards')
.action(commandScryfallDownload);

program
.command('sort-format [path]', 'Sort Format')
.describe(`Sorts a converted Scrydex CardDB by game format legalities outputting spreadsheets.\n` +
 `    [path] is the file path to a converted inventory Card DB.`)
.option('--by-type', 'Sorts alphabetically then by normalized type of card.')
.option('--clean', 'Remove existing sorted output before regenerating.')
.option('--formats', 'Provide a colon separated list of game formats for sorting.')
.option('--high-value', 'Separate high-value cards into a derived binder; requires a positive price comparison (IE ">=10").')
.option('--mark', 'Provide a colon separated list of CSV file names to highlight merge status.')
.option('--no-compress', 'Do not compress the sorted format output CardDBs.')
.option('--output', 'Provide a directory path for generated spreadsheets and sorted card DBs.')
.option('--theme', 'Options are `light` or `dark`; light theme is default.')
.example('sort-format ./collection.json --formats premodern:oldschool:predh:commander --output ./spreadsheets')
.example('sort-format ./collection.json --formats predh:commander --output ./spreadsheets')
.action(commandSortFormat);

program.parse(process.argv);
