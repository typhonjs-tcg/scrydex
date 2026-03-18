import fs                     from 'node:fs';
import { expect }             from 'vitest';

import { commandExportTxt }   from '../../../../src/cli/functions';

import { testConfig }         from '#test/config';
import { AssertData }         from '#test/util';

describe.runIf(testConfig['export-txt'])('export-txt', () =>
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

   it('single DB', async () =>
   {
      await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection/premodern/premodern.json', {
         output: './test/fixture/output/cli/export-txt/file/premodern.txt',
         loglevel: 'error'
      });

      const actual = fs.readFileSync('./test/fixture/output/cli/export-txt/file/premodern.txt', 'utf-8');
      const expected = fs.readFileSync('./test/fixture/snapshot/cli/export-txt/file/premodern.txt', 'utf-8');

      expect(actual).toBe(expected);
   });

   it('single DB (coalesce)', async () =>
   {
      await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection/premodern/premodern.json', {
         output: './test/fixture/output/cli/export-txt/file/premodern-coalesce.txt',
         loglevel: 'error',
         coalesce: true
      });

      const actual = fs.readFileSync('./test/fixture/output/cli/export-txt/file/premodern-coalesce.txt', 'utf-8');
      const expected = fs.readFileSync('./test/fixture/snapshot/cli/export-txt/file/premodern-coalesce.txt',
       'utf-8');

      expect(actual).toBe(expected);
   });
});
