import {
   expect,
   vi }                    from 'vitest';

import { commandFilter }   from '../../../../src/cli/functions';
import { AssertData }      from '../../util/AssertData';

import { testConfig }      from '../../testConfig';

describe.runIf(testConfig['filter'])('filter', () =>
{
   it('inventory (formats/border/cmc)', async () =>
   {
      await commandFilter('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
         output: './test/fixture/output/cli/filter/inventory.json',
         loglevel: 'error',
         cmc: '2',
         border: 'white',
         formats: 'premodern'
      });

      await AssertData.cardDBFiles('./test/fixture/output/cli/filter/inventory.json',
       './test/fixture/snapshot/cli/filter/inventory.json');
   });

   it('inventory (no results)', async () =>
   {
      const logResult: string[][] = [];
      let warnSpy: ReturnType<typeof vi.spyOn> = vi.spyOn(console, 'log').mockImplementation(
       (...args: string[]) => logResult.push(args));

      await commandFilter('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
         output: './test/fixture/output/cli/filter/inventory.json',
         loglevel: 'warn',
         cmc: '50'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/filter/log-no-results.json');

      warnSpy.mockRestore();
   });
});
