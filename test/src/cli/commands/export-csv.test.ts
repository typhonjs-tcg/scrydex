import { commandExportCsv }   from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

import { testConfig }         from '../../testConfig';
import {expect, vi} from "vitest";

describe.runIf(testConfig['export-csv'])('export-csv', () =>
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

   it('empty dir path', async () =>
   {
      const consoleLog: any[] = [];
      vi.spyOn(console, 'log').mockImplementation((...args) => consoleLog.push(args));

      await commandExportCsv('./test/fixture/snapshot/cli/find/empty-dir', {
         output: './test/fixture/output/cli/export-csv/empty-dir',
         loglevel: 'warn'
      });

      await expect(JSON.stringify(consoleLog)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/export-csv/empty-dir-path.txt');
   });
});
