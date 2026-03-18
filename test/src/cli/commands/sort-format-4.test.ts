import { commandSortFormat }  from '../../../../src/cli/functions';

import { testConfig }         from '#test/config';
import { AssertData }         from '#test/util';

describe.runIf(testConfig['sort-format-4'])('sort-format-4 (premodern:oldschool:predh:commander)', () =>
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
