import { expect }       from 'vitest';

import { CSVCardIndex } from '#scrydex/data/import/csv';

import { testConfig }   from '#test/config';

describe.runIf(testConfig['importCSV'])('CSVFile', () =>
{
   describe('errors', () =>
   {
      describe('fromCSV()', () =>
      {
         it('no header', async () =>
         {
            await expect(async () => CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/errors/no-header.csv'
            })).rejects.toThrow(`CSV file does not have required 'Quantity / quantity' or 'Scryfall ID / scryfall ID' header fields:\n./test/fixture/input/csv/errors/no-header.csv`);
         });

         it('no header (quantity)', async () =>
         {
            await expect(async () => CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/errors/no-header-quantity.csv'
            })).rejects.toThrow(`CSV file does not have required 'Quantity / quantity' or 'Scryfall ID / scryfall ID' header fields:\n./test/fixture/input/csv/errors/no-header-quantity.csv`);
         });

         it('no header (scryfall)', async () =>
         {
            await expect(async () => CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/errors/no-header-scryfall.csv'
            })).rejects.toThrow(`CSV file does not have required 'Quantity / quantity' or 'Scryfall ID / scryfall ID' header fields:\n./test/fixture/input/csv/errors/no-header-scryfall.csv`);
         });

         it('no quantity', async () =>
         {
            await expect(async () => CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/errors/no-quantity.csv'
            })).rejects.toThrow(`CSV file on row '2' has invalid quantity '':\n./test/fixture/input/csv/errors/no-quantity.csv`);
         });

         it('no Scryfall ID', async () =>
         {
            await expect(async () => CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/errors/no-scryfall-id.csv'
            })).rejects.toThrow(`CSV file on row '2' has invalid Scryfall ID '':\n./test/fixture/input/csv/errors/no-scryfall-id.csv`);
         });
      });
   });
});
