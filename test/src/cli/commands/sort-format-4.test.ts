import { commandSortFormat }  from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

describe('sort-format 4 (premodern:oldschool:predh:commander)', () =>
{
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
