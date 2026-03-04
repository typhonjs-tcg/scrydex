import fs                        from 'node:fs';

import {
   afterEach,
   beforeEach,
   expect,
   vi }                          from 'vitest';

import { commandFileCompress }   from '../../../../src/cli/functions';
import { AssertData }            from '../../util/AssertData';

import { testConfig }            from '../../testConfig';

describe.runIf(testConfig['file-compress'])('file-compress / file-decompress', () =>
{
   // Clean up output.
   fs.rmSync(`./test/fixture/output/cli/file-compress`, { recursive: true, force: true });

   fs.mkdirSync('./test/fixture/output/cli/file-compress', { recursive: true });

   // Copy base test files
   fs.copyFileSync('./test/fixture/snapshot/cli/file-compress/copy/compressed.json.gz',
    './test/fixture/output/cli/file-compress/compressed.json.gz')

   fs.copyFileSync('./test/fixture/snapshot/cli/file-compress/copy/decompressed.json',
    './test/fixture/output/cli/file-compress/decompressed.json')

   let logSpy: ReturnType<typeof vi.spyOn>;
   let logResult: any[][] = [];

   beforeEach(() =>
   {
      logResult = [];
      logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => logResult.push(args));
   });

   afterEach(() => logSpy.mockRestore());

   it('already-compressed', async () =>
   {
      await commandFileCompress('./test/fixture/output/cli/file-compress/compressed.json.gz', {
         mode: 'compress'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/file-compress/already-compressed.json');
   });

   it('already-decompressed', async () =>
   {
      await commandFileCompress('./test/fixture/output/cli/file-compress/decompressed.json', {
         mode: 'decompress'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/file-compress/already-decompressed.json');
   });

   it('compress', async () =>
   {
      await commandFileCompress('./test/fixture/output/cli/file-compress/decompressed.json', {
         mode: 'compress'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/file-compress/compress.json');

      await AssertData.cardDBFiles('./test/fixture/output/cli/file-compress/decompressed.json',
       './test/fixture/output/cli/file-compress/decompressed.json.gz');
   });

   it('decompress', async () =>
   {
      await commandFileCompress('./test/fixture/output/cli/file-compress/compressed.json.gz', {
         mode: 'decompress'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/file-compress/decompress.json');

      await AssertData.cardDBFiles('./test/fixture/output/cli/file-compress/compressed.json.gz',
       './test/fixture/output/cli/file-compress/compressed.json');
   });
});
