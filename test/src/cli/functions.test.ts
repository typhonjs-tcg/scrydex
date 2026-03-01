import fs               from 'node:fs';

import {
   afterEach,
   assert,
   beforeEach,
   expect,
   vi }                 from 'vitest';

import { CardDB }       from '#scrydex/data/db';

import {
   commandConvertCsv,
   // commandDiff, (pending implementation completion)
   commandExportCsv,
   commandExportExcel,
   commandExportLLM,
   commandExportTxt,
   commandFileCompress,
   commandFilter,
   commandFind,
   // commandScryfallDownload, (not tested)
   commandSortFormat }  from '../../../src/cli/functions';

import { AssertData }   from '../util/AssertData';

describe('CLI Commands:', () =>
{
   describe('convert-csv', () =>
   {
      it('compressed', async () => {
         await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
            db: './test/fixture/input/db/scryfall_test_cards.json.gz',
            output: './test/fixture/output/cli/convert-csv/inventory.json',
            loglevel: 'error',
            compress: true,
            'group-external': './test/fixture/input/csv/manabox/groups/group-external.csv',
            'group-decks': './test/fixture/input/csv/manabox/groups/group-decks.csv',
            'group-proxy': './test/fixture/input/csv/manabox/groups/group-proxy.csv',
         });

         const result = await CardDB.load({ filepath: './test/fixture/output/cli/convert-csv/inventory.json.gz' });
         const snapshot = await CardDB.load({ filepath: './test/fixture/snapshot/cli/convert-csv/inventory.json.gz' });

         assert.isDefined(result);
         assert.isDefined(snapshot);

         const cardsResult = await result.getAll();
         const cardsSnapshot = await snapshot.getAll();

         assert.isArray(cardsResult);
         assert.isArray(cardsSnapshot);

         assert.deepEqual(cardsResult, cardsSnapshot);
      });

      it('uncompressed', async () => {
         await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
            db: './test/fixture/input/db/scryfall_test_cards.json.gz',
            output: './test/fixture/output/cli/convert-csv/inventory.json',
            loglevel: 'error',
            'group-decks': './test/fixture/input/csv/manabox/groups/group-decks.csv',
            'group-external': './test/fixture/input/csv/manabox/groups/group-external.csv',
            'group-proxy': './test/fixture/input/csv/manabox/groups/group-proxy.csv',
         });

         const result = await CardDB.load({ filepath: './test/fixture/output/cli/convert-csv/inventory.json' });
         const snapshot = await CardDB.load({ filepath: './test/fixture/snapshot/cli/convert-csv/inventory.json' });

         const cardsResult = await result.getAll();
         const cardsSnapshot = await snapshot.getAll();

         assert.isArray(cardsResult);
         assert.isArray(cardsSnapshot);

         assert.deepEqual(cardsResult, cardsSnapshot);
      });

      it('not found (DB missing card)', async () => {
         const consoleLog: any[] = [];
         vi.spyOn(console, 'log').mockImplementation((...args) => consoleLog.push(args));

         await commandConvertCsv('./test/fixture/input/csv/manabox/other-tests/not-found.csv', {
            db: './test/fixture/input/db/scryfall_test_cards.json.gz',
            output: './test/fixture/output/cli/convert-csv/not-found.json',
            loglevel: 'warn'
         });

         vi.restoreAllMocks();

         assert.equal(JSON.stringify(consoleLog),
          fs.readFileSync('./test/fixture/snapshot/cli/convert-csv/not-found-log.txt', 'utf-8'));
      });
   });

   describe('export-csv', () =>
   {
      it('default (collection)', async () =>
      {
         await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-csv/collection',
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-csv/collection',
          './test/fixture/snapshot/cli/export-csv/collection');
      });

      it('coalesce (collection)', async () =>
      {
         await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-csv/collection-coalesce',
            coalesce: true,
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-csv/collection-coalesce',
          './test/fixture/snapshot/cli/export-csv/collection-coalesce');
      });
   });

   describe('export-excel', () =>
   {
      it('default', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/default.xlsx',
            loglevel: 'error'
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/default.xlsx',
          './test/fixture/snapshot/cli/export-excel/default.xlsx');
      });

      it('by kind', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/by-kind.xlsx',
            loglevel: 'error',
            'by-kind': true
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/by-kind.xlsx',
          './test/fixture/snapshot/cli/export-excel/by-kind.xlsx');
      });

      it('by type', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/by-type.xlsx',
            loglevel: 'error',
            'by-type': true
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/by-type.xlsx',
          './test/fixture/snapshot/cli/export-excel/by-type.xlsx');
      });

      it('no filename / price', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/no-filename-price.xlsx',
            loglevel: 'error',
            filename: false,
            price: false
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/no-filename-price.xlsx',
          './test/fixture/snapshot/cli/export-excel/no-filename-price.xlsx');
      });

      it('include rarity', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/include-rarity.xlsx',
            loglevel: 'error',
            rarity: true
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/include-rarity.xlsx',
          './test/fixture/snapshot/cli/export-excel/include-rarity.xlsx');
      });

      it('theme dark', async () =>
      {
         await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-excel/theme-dark.xlsx',
            loglevel: 'error',
            theme: 'dark'
         });

         await AssertData.excelWorkbookFiles('./test/fixture/output/cli/export-excel/theme-dark.xlsx',
          './test/fixture/snapshot/cli/export-excel/theme-dark.xlsx');
      });
   });

   describe('export-llm', () =>
   {
      it('default (collection)', async () =>
      {
         await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-llm/collection/default',
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/collection/default',
          './test/fixture/snapshot/cli/export-llm/collection/default');
      });

      it('no oracle text w/ types (collection)', async () =>
      {
         await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-llm/collection/no-oracle-text',
            'oracle-text': false,
            types: true,
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/collection/no-oracle-text',
          './test/fixture/snapshot/cli/export-llm/collection/no-oracle-text');
      });

      it('default w/ types (single DB)', async () =>
      {
         await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
            output: './test/fixture/output/cli/export-llm/single/default/llm-commander.json',
            types: true,
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/single/default',
          './test/fixture/snapshot/cli/export-llm/single/default');
      });
   });

   describe('export-txt', () =>
   {
      it('default (collection)', async () =>
      {
         await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-txt/collection',
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-txt/collection',
          './test/fixture/snapshot/cli/export-txt/collection');
      });

      it('coalesce (collection)', async () =>
      {
         await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection', {
            output: './test/fixture/output/cli/export-txt/collection-coalesce',
            coalesce: true,
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/export-txt/collection-coalesce',
          './test/fixture/snapshot/cli/export-txt/collection-coalesce');
      });
   });

   describe('find', () =>
   {
      let logSpy: ReturnType<typeof vi.spyOn>;
      let logResult: any[][] = [];

      beforeEach(() =>
      {
         logResult = [];
         logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => logResult.push(args));
      });

      afterEach(() => logSpy.mockRestore());

      it('default-query', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Smothering Tithe', {
            loglevel: 'info'
         });

         console.error(`!!!!! default-query - 1 logResult: `, JSON.stringify(logResult, null, 2));

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query.json');
      });

      it('default-query-boundary', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Tomb', {
            loglevel: 'info',
            b: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-boundary.json');
      });

      it('default-query-insensitive', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'FORCE OF', {
            loglevel: 'info',
            i: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-insensitive.json');
      });

      it('default-query-exact', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Urborg', {
            loglevel: 'info',
            exact: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-exact.json');
      });

      it('default-query-border-format', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
            loglevel: 'info',
            border: 'black',
            formats: 'oldschool'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-border-format.json');
      });

      it('default-query-cmc', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
            loglevel: 'info',
            cmc: '8'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-cmc.json');
      });

      it('default-query-keywords', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
            loglevel: 'info',
            keywords: 'goad'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-keywords.json');
      });

      it('default-query-keywords', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
            loglevel: 'info',
            'mana-cost': '{2}{W}{U}'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-mana-cost.json');
      });

      it('default-query-price', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
            loglevel: 'info',
            price: '>500'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query-price.json');
      });

      it('name-query', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Smothering Tithe', {
            loglevel: 'info',
            name: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/default-query.json');
      });

      it('oracle-query', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection',
          `As long as your devotion to white is less than five, Heliod isn't a creature.`, {
            loglevel: 'info',
            oracle: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/oracle-query.json');
      });

      it('type-query', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Elemental Incarnation', {
            loglevel: 'info',
            type: true
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/type-query.json');
      });

      it('type-query-color-identity', async () =>
      {
         await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Creature', {
            loglevel: 'info',
            type: true,
            'color-identity': '{W}{U}'
         });

         await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
          '../../fixture/snapshot/cli/find/type-query-color-identity.json');
      });
   });

   describe('sort-format (premodern:oldschool:predh:commander)', () =>
   {
      it('collection', async () =>
      {
         await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
            output: './test/fixture/output/cli/sort-format/collection',
            formats: 'premodern:oldschool:predh:commander',
            loglevel: 'error',
            'by-type': true
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/collection',
          'test/fixture/snapshot/cli/sort-format/collection');
      });

      it('collection (theme-dark)', async () =>
      {
         await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
            output: './test/fixture/output/cli/sort-format/collection-dark',
            formats: 'premodern:oldschool:predh:commander',
            loglevel: 'error',
            'by-type': true,
            theme: 'dark'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/collection-dark',
          'test/fixture/snapshot/cli/sort-format/collection');
      });

      it('collection (mark)', async () =>
      {
         await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
            output: './test/fixture/output/cli/sort-format/collection-mark',
            formats: 'premodern:oldschool:predh:commander',
            loglevel: 'error',
            'by-type': true,
            mark: 'commander:premodern'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/collection-mark',
          'test/fixture/snapshot/cli/sort-format/collection-mark');
      });

      it('collection (high-value)', async () =>
      {
         await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
            output: './test/fixture/output/cli/sort-format/collection-high-value',
            formats: 'premodern:oldschool:predh:commander',
            loglevel: 'error',
            'high-value': '>=10'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/collection-high-value',
          'test/fixture/snapshot/cli/sort-format/collection-high-value');
      });
   });
});
