import { commandExportTxt }   from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

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
