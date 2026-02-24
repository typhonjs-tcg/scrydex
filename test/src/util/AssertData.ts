import fs               from 'node:fs';
import path             from 'node:path';

import {
   assert,
   expect }             from 'vitest';

import { getFileList }  from "@typhonjs-utils/file-util";
import Excel            from 'exceljs';

import { CardDB }       from '#scrydex/data/db';

/**
 * Provides various assertion cases for Scrydex data.
 */
export abstract class AssertData
{
   /**
    * Compares two CardDB streams asserting for equality of card entries.
    *
    * @param a - CardDB stream
    *
    * @param b - CardDB stream
    */
   static async cardDBStream(a: CardDB.Stream.Reader, b: CardDB.Stream.Reader)
   {
      assert.isDefined(a);
      assert.isDefined(b);

      const cardsResult = await a.getAll();
      const cardsSnapshot = await b.getAll();

      assert.isArray(cardsResult);
      assert.isArray(cardsSnapshot);

      assert.deepEqual(cardsResult, cardsSnapshot);
   }

   /**
    * Walks and compares all files between an `actual` and `expected` directory. JSON files are assumed to be Scrydex
    * CardDBs. Excel spreadsheets and CardDB JSON is compared by loading / reducing the data respectively with all other
    * files using a direct comparison.
    *
    * @param actualDir - Output to be compared.
    *
    * @param expectedDir - Expected / snapshot results.
    */
   static async directoryEqual(actualDir: string, expectedDir: string)
   {
      const actualFiles = await getFileList({ dir: actualDir, walk: true });
      const expectedFiles = await getFileList({ dir: expectedDir, walk: true });

      expect(actualFiles).toEqual(expectedFiles);

      for (const file of expectedFiles)
      {
         const actualFilepath = path.join(actualDir, file);
         const expectedFilepath = path.join(expectedDir, file);

         assert.isTrue(fs.existsSync(actualFilepath));
         assert.isTrue(fs.existsSync(expectedFilepath));

         if (file.endsWith('.xlsx'))
         {
            const wbResult = new Excel.Workbook();
            await wbResult.xlsx.readFile(actualFilepath);

            const wbSnapshot = new Excel.Workbook();
            await wbSnapshot.xlsx.readFile(expectedFilepath);

            AssertData.excelWorkbook(wbResult, wbSnapshot);
         }
         else if (file.endsWith('.json'))
         {
            try
            {
               // Attempt to compare CardDB if loaded
               const result = await CardDB.load({ filepath: actualFilepath });
               const snapshot = await CardDB.load({ filepath: expectedFilepath });

               await AssertData.cardDBStream(result, snapshot);
            }
            catch
            {
               // Otherwise direct file comparison.
               const actual = fs.readFileSync(actualFilepath, 'utf-8');
               const expected = fs.readFileSync(expectedFilepath, 'utf-8');

               expect(actual).toBe(expected);
            }
         }
         else
         {
            // Direct file comparison.
            const actual = fs.readFileSync(actualFilepath, 'utf-8');
            const expected = fs.readFileSync(expectedFilepath, 'utf-8');

            expect(actual).toBe(expected);
         }
      }
   }

   /**
    * Compares two ExcelJS workbooks asserting that worksheet and cell contents are equal.
    *
    * @param a - ExcelJS workbook
    *
    * @param b - ExcelJS workbook
    */
   static excelWorkbook(a: Excel.Workbook, b: Excel.Workbook)
   {
      assert.isDefined(a);
      assert.isDefined(b);

      assert.deepEqual(ExcelCompare.workbookToData(a), ExcelCompare.workbookToData(b));
   }
}

// Internal implementation -------------------------------------------------------------------------------------------

type WorkbookData = {
   sheets: Array<{ name: string, rows: unknown[][] }>;
};

/**
 * Provides a simple way to serialize an ExcelJS workbook to cell data for testing.
 */
abstract class ExcelCompare
{
   private constructor() {}

   static workbookToData(wb: Excel.Workbook): WorkbookData
   {
      return {
         sheets: wb.worksheets
         .map(ws => ({
            name: ws.name,
            rows: this.#sheetToRows(ws)
         }))
         .sort((a, b) => a.name.localeCompare(b.name)) // ensure deterministic order
      };
   }

   static #sheetToRows(ws: Excel.Worksheet)
   {
      const rows: unknown[][] = [];

      ws.eachRow({ includeEmpty: false }, (row) => { rows.push(this.#extractRow(row)); });

      return rows;
   }

   static #extractRow(row: Excel.Row)
   {
      const out: unknown[] = [];

      row.eachCell({ includeEmpty: true }, (cell, col) => { out[col - 1] = this.#normalizeCell(cell.value); });

      return out;
   }

   static #normalizeCell(value: Excel.CellValue)
   {
      if (value == null) return null;

      if (value instanceof Date) { return value.toISOString(); }

      if (typeof value === 'object')
      {
         if ('result' in value) return value.result;
         if ('text' in value) return value.text;
      }

      return value;
   }
}
