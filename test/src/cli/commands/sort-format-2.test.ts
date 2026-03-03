import { commandSortFormat }  from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

describe('sort-format 2 (premodern:oldschool:predh:commander)', () =>
{
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
});
