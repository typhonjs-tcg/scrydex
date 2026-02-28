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
         await expect(async () =>
         {
            await commandConvertCsv('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file or directory path.`);
      });

      it(`invalid 'db'`, async () =>
      {
         await expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', { db: 'INVALID PATH' });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'db' option is not a file path.`);
      });

      it(`invalid 'group-decks'`, async () =>
      {
         await expect(async () =>
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
         await expect(async () =>
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
         await expect(async () =>
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
         await expect(async () =>
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
         await expect(async () =>
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
         await expect(async () =>
         {
            await commandConvertCsv('./test/fixture/input/csv/manabox/collection', {
               db: './test/fixture/input/db/scryfall_test_cards.json.gz',
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });
   });

   describe('export-csv', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportCsv('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file or directory path.`);
      });

      it(`invalid 'output'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection', {
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });

      it(`invalid 'output' (file mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/snapshot/cli/export-csv/collection'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a file; 'output' option must also be a file.`);
      });

      it(`invalid 'output' (dir mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/snapshot/cli/export-csv/collection/commander.csv'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a directory; 'output' option must also be a directory.`);
      });

      it(`invalid 'coalesce'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportCsv('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/snapshot/cli/export-csv/collection',
               coalesce: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'coalesce' option is not a boolean.`);
      });
   });

   describe('export-excel', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file path.`);
      });

      it(`invalid 'output'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });

      it(`invalid 'output' (dir mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/snapshot',
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is a directory.`);
      });

      it(`invalid 'by-kind'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               'by-kind': null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'by-kind' option is not a boolean.`);
      });

      it(`invalid 'by-type'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               'by-type': null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'by-type' option is not a boolean.`);
      });

      it(`invalid 'no-filename'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               filename: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'no-filename' option is not a boolean.`);
      });

      it(`invalid 'no-price'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               price: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'no-price' option is not a boolean.`);
      });

      it(`invalid 'no-rarity'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               rarity: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'no-rarity' option is not a boolean.`);
      });

      it(`invalid 'theme' (not string)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               theme: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'theme' option is not a string.`);
      });

      it(`invalid 'theme' (unknown)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportExcel('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/output/cli/export-excel/dummy.xlsx',
               theme: 'unknown'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'theme' option is invalid: 'unknown'.`);
      });
   });

   describe('export-llm', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file or directory path.`);
      });

      it(`invalid 'output'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });

      it(`invalid 'output' (file mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/snapshot',
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a file; 'output' option must also be a file.`);
      });

      it(`invalid 'output' (dir mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/snapshot/cli/sort-format/collection/commander/commander.json',
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a directory; 'output' option must also be a directory.`);
      });

      it(`invalid 'no-oracle-text'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/output/cli/export-llm/dummy',
               'oracle-text': null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'no-oracle-text' option is not a boolean.`);
      });

      it(`invalid 'types'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/output/cli/export-llm/dummy',
               types: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'types' option is not a boolean.`);
      });
   });

   describe('export-txt', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportTxt('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file or directory path.`);
      });

      it(`invalid 'output'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection', {
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });

      it(`invalid 'output' (file mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
               output: './test/fixture/snapshot/cli/export-txt/collection'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a file; 'output' option must also be a file.`);
      });

      it(`invalid 'output' (dir mismatch)`, async () =>
      {
         await expect(async () =>
         {
            await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/snapshot/cli/export-txt/collection/commander.txt'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is a directory; 'output' option must also be a directory.`);
      });

      it(`invalid 'coalesce'`, async () =>
      {
         await expect(async () =>
         {
            await commandExportTxt('./test/fixture/snapshot/cli/sort-format/collection', {
               output: './test/fixture/snapshot/cli/export-txt/collection',
               coalesce: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'coalesce' option is not a boolean.`);
      });
   });

   describe('sort-format', () =>
   {
      it(`invalid 'path'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('INVALID PATH', {});
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'[path]' option is not a file path.`);
      });

      it(`invalid 'output'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'output' option is not a string.`);
      });

      it(`invalid 'loglevel'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               loglevel: 'INVALID'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'loglevel' option is invalid.`);
      });

      it(`invalid 'by-type'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               'by-type': null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'by-type' option is not a boolean.`);
      });

      it(`invalid 'compress'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               compress: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'compress' option is not a boolean.`);
      });

      it(`invalid 'formats' (not string)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'formats' option is not a string.`);
      });

      it(`invalid 'formats' (unknown)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'unknown'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'formats' option contains an invalid format: unknown`);
      });

      it(`invalid 'formats' (duplicate)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern:premodern'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'formats' option contains duplicate format: premodern`);
      });

      it(`invalid 'clean'`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               clean: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'clean' option is not a boolean.`);
      });

      it(`invalid 'high-value' (not string)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               'high-value': null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'high-value' option is not a string.`);
      });

      it(`invalid 'high-value' (bad parse)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               'high-value': 'INVALID'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'high-value' option is invalid: INVALID`);
      });

      it(`invalid 'high-value' (not > or >=)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               'high-value': '<5'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'high-value' option must be '>' or '>=' price comparison.`);
      });

      it(`invalid 'high-value' (not >1)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               'high-value': '>0.5'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'high-value' option must be a positive threshold strictly greater than 1.`);
      });

      it(`invalid 'mark' (not string)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               mark: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'mark' option is not a string.`);
      });

      it(`invalid 'theme' (not string)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               theme: null
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'theme' option is not a string.`);
      });

      it(`invalid 'theme' (unknown)`, async () =>
      {
         await expect(async () =>
         {
            await commandSortFormat('./test/fixture/snapshot/cli/convert-csv/inventory.json', {
               output: './test/fixture/output/cli/sort-format/collection',
               formats: 'premodern',
               theme: 'unknown'
            });
         }).rejects.toThrow('process.exit: 1');

         checkExit(`'theme' option is invalid: 'unknown'.`);
      });
   });
});
