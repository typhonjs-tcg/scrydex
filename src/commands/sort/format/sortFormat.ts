import fs                           from 'node:fs';
import path                         from 'node:path';

import { isDirectory }              from '@typhonjs-utils/file-util';

import { CardDB }                   from '#scrydex/data/db';
import { ScryfallData }             from '#scrydex/data/scryfall';

import { ExportCollection }         from '../ExportCollection';

import {
   KindSortOrder,
   SortCards,
   SortedFormat }                   from '#scrydex/data/sort';

import type { ConfigCmd }           from '../../types-command';

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param config - Config options.
 */
export async function sortFormat(config: ConfigCmd.SortFormat): Promise<void>
{
   const logger = config.logger;

   logger?.info(`Sorting Scrydex CardDB: ${config.path}`);
   logger?.info(`Formats: ${config.formats.join(', ')}`);
   logger?.info(`Sorted output target directory: ${config.output}`);

   if (!isDirectory(config.output)) { fs.mkdirSync(config.output, { recursive: true }); }

   if (config.clean) { await cleanOutputDir(config); }

   await ExportCollection.generate(config, await generate(config));

   logger?.info(`Finished sorting Scrydex card collection: ${config.output}`);
}

// Internal Implementation -------------------------------------------------------------------------------------------

/**
 * Clean the output directory of any subdirectories containing previously sorted collection data.
 *
 * @param config -
 */
async function cleanOutputDir(config: ConfigCmd.SortFormat): Promise<void>
{
   config.logger?.verbose('Removing existing sorted output before regenerating.')

   const dbFiles = await CardDB.loadAll({ dirpath: config.output, type: ['sorted', 'sorted_format'], walk: true });

   for (const dbFile of dbFiles)
   {
      const dirpath = path.dirname(dbFile.filepath);

      // Ignore deeper directories.
      if (path.relative(config.output, dirpath).includes(path.sep)) { continue; }

      fs.rmSync(dirpath, { recursive: true, force: true });
   }
}

/**
 * Generates all game format sorted collections.
 *
 * @param config -
 *
 * @returns All game format sorted collections.
 */
async function generate(config: ConfigCmd.SortFormat): Promise<SortedFormat[]>
{
   const db = await CardDB.load({ filepath: config.path });

   const presortFormat = await presortCards(config, db);

   const sortedFormats: SortedFormat[] = [];

   for (const [name, cards] of presortFormat)
   {
      if (cards.length === 0) { continue; }

      const format = ScryfallData.isSupportedFormat(name) ? name : void 0;

      if (format && config.highValue)
      {
         const { cardsLow, cardsHigh } = splitHighValue(config, cards);

         if (cardsLow.length)
         {
            sortedFormats.push(createSortedFormat(config, {
               cards: cardsLow,
               name,
               format,
               dirpath: format,
               sourceMeta: db.meta
            }));
         }

         if (cardsHigh.length)
         {
            sortedFormats.push(createSortedFormat(config, {
               cards: cardsHigh,
               name: `${name}-high-value`,
               format,
               dirpath: `${format}/high-value`,
               sourceMeta: db.meta
            }));
         }
      }
      else
      {
         sortedFormats.push(createSortedFormat(config, {
            cards,
            name,
            format,
            dirpath: format ?? name,
            sourceMeta: db.meta
         }));
      }
   }

   return sortedFormats;
}

/**
 * Creates the final SortedFormat instance plus logging.
 *
 * @param config -
 *
 * @param options -
 *
 * @returns The SortedFormat instance.
 */
function createSortedFormat(config: ConfigCmd.SortFormat, options:
 { cards: CardDB.Data.Card[]; name: string; sourceMeta: CardDB.File.MetadataBase, dirpath: string,
  format?: ScryfallData.GameFormat }): SortedFormat
{
   SortCards.byNameThenPrice({ cards: options.cards, priceDirection: 'desc' });

   const logger = config.logger;

   const sortedFormat = new SortedFormat(options);

   sortedFormat.sort({ alpha: true, type: config.sortByType });

   logger?.verbose(`Sorting '${options.name}' - unique card entry count: ${options.cards.length}`);

   if (config.mark.size)
   {
      const cardsMarked = sortedFormat.calculateMarked(config.mark);
      if (cardsMarked.length)
      {
         const markedRarity: Set<string> = new Set<string>();
         for (const card of cardsMarked) { markedRarity.add(KindSortOrder.rarity(card, options.format)); }

         logger?.verbose(`  - ${cardsMarked.length} card entries marked for merging in: ${
          [...markedRarity].sort((a, b) => a.localeCompare(b)).join(', ')}`);
      }
   }

   return sortedFormat;
}

/**
 * Presorts the cards by format legalities. Basic land and any remaining non-legal cards are separated.
 *
 * @param config -
 *
 * @param db -
 */
async function presortCards(config: ConfigCmd.SortFormat, db: CardDB.Stream.Reader):
 Promise<Map<string, CardDB.Data.Card[]>>
{
   const presortFormat: Map<string, CardDB.Data.Card[]> = new Map(config.formats.map((entry) => [entry, []]));

   presortFormat.set('basic-land', []);
   presortFormat.set('unsorted', []);

   for await (const card of db.asStream())
   {
      // Separate all basic land.
      if (card.norm_type.startsWith('Land - Basic'))
      {
         presortFormat.get('basic-land')?.push(card);
         continue;
      }

      let sorted = false;

      for (const format of config.formats)
      {
         if (ScryfallData.isLegal(card.legalities?.[format]))
         {
            presortFormat.get(format)?.push(card);
            sorted = true;
            break;
         }
      }

      if (!sorted) { presortFormat.get('unsorted')?.push(card); }
   }

   return presortFormat;
}

/**
 * Splits cards by matching the price expression in the given config.
 *
 * @param config -
 *
 * @param cards -
 *
 * @returns Cards split by low and high value.
 */
function splitHighValue(config: ConfigCmd.SortFormat, cards: CardDB.Data.Card[]):
 { cardsLow: CardDB.Data.Card[], cardsHigh: CardDB.Data.Card[] }
{
   if (!config.highValue) { return { cardsLow: cards, cardsHigh: [] }; }

   const cardsLow: CardDB.Data.Card[] = [];
   const cardsHigh: CardDB.Data.Card[] = [];

   const oracleHigh: Set<string> = new Set();

   // Collect all high value oracle IDs.
   for (const card of cards)
   {
      if (CardDB.Price.matchesExpression(card.price, config.highValue)) { oracleHigh.add(card.oracle_id); }
   }

   // Separate all cards matching a high value oracle ID.
   for (const card of cards)
   {
      if (oracleHigh.has(card.oracle_id))
      {
         cardsHigh.push(card);
      }
      else
      {
         cardsLow.push(card);
      }
   }

   return { cardsLow, cardsHigh };
}
