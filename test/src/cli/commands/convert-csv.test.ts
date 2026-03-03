import fs                     from 'node:fs';

import {
   assert,
   vi }                       from 'vitest';

import { commandConvertCsv }  from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

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

      await AssertData.cardDBFiles('./test/fixture/output/cli/convert-csv/inventory.json.gz',
       './test/fixture/snapshot/cli/convert-csv/inventory.json.gz');
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

      await AssertData.cardDBFiles('./test/fixture/output/cli/convert-csv/inventory.json',
       './test/fixture/snapshot/cli/convert-csv/inventory.json');
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
