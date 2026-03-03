import { commandExportExcel } from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

import { testConfig }         from '../../testConfig';

describe.runIf(testConfig['export-excel'])('export-excel', () =>
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
