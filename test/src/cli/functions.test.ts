import fs               from 'node:fs';

import {
   assert,
   vi }                 from 'vitest';

import { CardDB }       from '#scrydex/data/db';

import {
   commandConvertCsv,
   commandDiff,
   commandExportCsv,
   commandExportExcel,
   commandExportLLM,
   commandExportTxt,
   commandFileCompress,
   commandFilter,
   commandFind,
   commandScryfallDownload,
   commandSortFormat }  from '../../../src/cli/functions';

import { AssertData }   from '../util/AssertData';

// describe.sequential('CLI Commands:', { concurrent: false }, () =>
describe('CLI Commands:', () =>
{
   describe('convert-csv (commandConvertCsv)', () =>
   {
      it('compressed', async () => {
         await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
            db: './test/fixture/input/db/scryfall_test_cards.json.gz',
            output: './test/fixture/output/cli/convert-csv/inventory.json',
            loglevel: 'error',
            compress: true,
            'group-external': './test/fixture/input/csv/manabox/groups/group-decks.csv',
            'group-decks': './test/fixture/input/csv/manabox/groups/group-external.csv',
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
            'group-external': './test/fixture/input/csv/manabox/groups/group-decks.csv',
            'group-decks': './test/fixture/input/csv/manabox/groups/group-external.csv',
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

   describe('sort-format', () =>
   {
      it('basic (premodern:oldschool:predh:commander)', async () =>
      {
         await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
            output: './test/fixture/output/cli/sort-format/basic',
            'by-type': true,
            formats: 'premodern:oldschool:predh:commander',
            loglevel: 'error'
         });

         await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/basic',
          'test/fixture/snapshot/cli/sort-format/basic');
      });
   });
});
