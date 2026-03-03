import { commandSortFormat }  from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

describe('sort-format 3 (premodern:oldschool:predh:commander)', () =>
{
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
});
