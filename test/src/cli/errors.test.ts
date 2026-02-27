import {
   vi,
   expect,
   beforeEach,
   afterEach }          from 'vitest';

import {
   commandConvertCsv,
   // commandDiff, (pending implementation completion)
   commandExportCsv,
   commandExportExcel,
   commandExportLLM,
   commandExportTxt,
   commandFileCompress,
   commandFilter,
   commandFind,
   // commandScryfallDownload, (not tested)
   commandSortFormat }  from '../../../src/cli/functions';

describe('CLI Command Errors:', () =>
{
   let errorSpy: ReturnType<typeof vi.spyOn>;
   let exitSpy: ReturnType<typeof vi.spyOn>;

   beforeEach(() =>
   {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) =>
      {
         throw new Error(`process.exit: ${code}`);
      }) as any;
   });

   afterEach(() =>
   {
      errorSpy.mockRestore();
      exitSpy.mockRestore();
   });

   const checkExit = (message: string) =>
   {
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledWith(1);

      const printed = errorSpy.mock.calls[0][0] as string;

      expect(printed).toContain('[scrydex]');
      expect(printed).toContain(message);
   }

   describe('convert-csv', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'path' option is not a file or directory path.`);
      });

      it(`invalid 'db'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', { db: 'INVALID PATH' });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'db' option is not a file path.`);
      });

      it(`invalid 'group-decks'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               'group-decks': 'INVALID PATH'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'group-decks' option is not a file or directory path.`);
      });

      it(`invalid 'group-external'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               'group-external': 'INVALID PATH'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'group-external' option is not a file or directory path.`);
      });

      it(`invalid 'group-proxy'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               'group-proxy': 'INVALID PATH'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'group-proxy' option is not a file or directory path.`);
      });

      it(`invalid 'compress'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               compress: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'compress' option is not a boolean.`);
      });

      it(`invalid 'loglevel'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               loglevel: 'INVALID'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'loglevel' option is invalid.`);
      });

      it(`invalid 'output'`, async () =>
      {
         expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not defined.`);
      });
   });
});
