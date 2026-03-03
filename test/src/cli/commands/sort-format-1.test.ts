import { commandSortFormat }  from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

describe('sort-format 1 (premodern:oldschool:predh:commander)', () =>
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
});
