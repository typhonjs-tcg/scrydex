import fs                     from 'node:fs';
import { assert }             from 'vitest';

import { commandSortFormat }  from '../../../../src/cli/functions';

import { testConfig }         from '#test/config';
import { AssertData }         from '#test/util';

describe.runIf(testConfig['sort-format-1'])('sort-format-1 (premodern:oldschool:predh:commander)', () =>
{
   it('collection (clean)', async () =>
   {
      fs.mkdirSync('./test/fixture/output/cli/sort-format/collection', { recursive: true });

      fs.copyFileSync('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json',
       './test/fixture/output/cli/sort-format/collection/should-be-cleaned.json')

      await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
         output: './test/fixture/output/cli/sort-format/collection',
         formats: 'premodern:oldschool:predh:commander',
         loglevel: 'error',
         'by-type': true,
         clean: true
      });

      assert.isFalse(fs.existsSync('./test/fixture/output/cli/sort-format/collection/should-be-cleaned.json'));

      await AssertData.directoryEqual('./test/fixture/output/cli/sort-format/collection',
       'test/fixture/snapshot/cli/sort-format/collection');
   });
});
