import {
   expect,
   vi }                       from 'vitest';

import { commandConvertCsv }  from '../../../../src/cli/functions';

import { testConfig }         from '#test/config';
import { AssertData }         from '#test/util';

describe.runIf(testConfig['convert-csv'])('convert-csv', () =>
{
   it('compressed', async () => {
      await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
         db: './test/fixture/input/db/scryfall_test_cards.json.gz',
         output: './test/fixture/output/cli/convert-csv/inventory.json.gz',
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

   it('uncompressed (group concat all)', async () => {
      // Provide a directory path for `group-decks` combining all group CSV files into the decks group.

      await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
         db: './test/fixture/input/db/scryfall_test_cards.json.gz',
         output: './test/fixture/output/cli/convert-csv/inventory-groups-concat.json',
         loglevel: 'error',
         'group-decks': './test/fixture/input/csv/manabox/groups',
      });

      await AssertData.cardDBFiles('./test/fixture/output/cli/convert-csv/inventory-groups-concat.json',
       './test/fixture/snapshot/cli/convert-csv/inventory-groups-concat.json');
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

      await expect(JSON.stringify(consoleLog)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/convert-csv/not-found-log.txt');
   });
});
