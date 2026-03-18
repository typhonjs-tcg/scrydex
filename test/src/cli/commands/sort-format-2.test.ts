import { commandSortFormat }  from '../../../../src/cli/functions';

import { testConfig }         from '#test/config';
import { AssertData }         from '#test/util';

describe.runIf(testConfig['sort-format-2'])('sort-format-2 (premodern:oldschool:predh:commander)', () =>
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
