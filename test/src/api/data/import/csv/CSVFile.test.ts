import fs               from 'node:fs';
import { Writable }     from 'node:stream';

import {
   expect,
   vi }                 from 'vitest';

import { CSVFile }      from '#scrydex/data/import/csv';
import * as utilModule  from '#scrydex/util';

import { testConfig }   from '#test/config';

describe.runIf(testConfig['importCSV'])('CSVFile', () =>
{
   describe('errors', () =>
   {
      describe('asStream()', () =>
      {
         it('bad `filepath`', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.asStream({ filepath: null }).next()).rejects.toThrow(
             `'filepath' is not a valid file path.`);
         });

         it('signal abort - initial', async () =>
         {
            const controller = new AbortController();
            controller.abort(new Error('aborted - initial'));

            const createReadStreamSpy = vi.spyOn(fs, 'createReadStream');

            await expect(async () => CSVFile.asStream({
               filepath: './test/fixture/input/csv/manabox/collection/premodern.csv',
               signal: controller.signal
            }).next()).rejects.toThrow('aborted - initial');

            expect(createReadStreamSpy).not.toHaveBeenCalled();
            createReadStreamSpy.mockRestore();
         });

         it('signal abort - 3 iterations', async () =>
         {
            const controller = new AbortController();

            const rows = [];

            let cntr = 0;

            const destroySpy = vi.spyOn(fs.ReadStream.prototype, 'destroy');

            const stream = CSVFile.asStream({
               filepath: './test/fixture/input/csv/manabox/collection/premodern.csv',
               signal: controller.signal
            });

            await expect(async () =>
            {
               for await (const row of stream)
               {
                  if (++cntr >= 3) { controller.abort(new Error('aborted - 3 iterations')); }

                  rows.push(row);
               }
            }).rejects.toThrow('aborted - 3 iterations');

            expect(rows.length).toBe(3);

            expect(destroySpy).toHaveBeenCalled();
            destroySpy.mockRestore();
         });

         it('signal abort - boundary', async () =>
         {
            const controller = new AbortController();

            const destroySpy = vi.spyOn(fs.ReadStream.prototype, 'destroy');

            const iter = CSVFile.asStream({
               filepath: './test/fixture/input/csv/manabox/collection/premodern.csv',
               signal: controller.signal
            })[Symbol.asyncIterator]();

            // Step 1: get first row.
            const first = await iter.next();
            expect(first.done).toBe(false);

            // Step 2: abort AFTER a yield boundary.
            controller.abort(new Error('aborted between iterations'));

            // Step 3: trigger next pull - MUST hit the branch.
            await expect(iter.next()).rejects.toThrow('aborted between iterations');

            expect(destroySpy).toHaveBeenCalled();
            destroySpy.mockRestore();
         });
      });

      describe('getHeaders()', () =>
      {
         it('bad `filepath`', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.getHeaders({ filepath: null })).rejects.toThrow(
             `'filepath' is not a valid file path.`);
         });
      });

      describe('getHeaders()', () =>
      {
         it('bad `filepath`', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.getHeaders({ filepath: null })).rejects.toThrow(
             `'filepath' is not a valid file path.`);
         });
      });

      describe('getRows()', () =>
      {
         it('bad `filepath`', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.getRows({ filepath: null })).rejects.toThrow(
             `'filepath' is not a valid file path.`);
         });
      });

      describe('save()', () =>
      {
         it('bad `filepath` (not string)', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.save({ filepath: null })).rejects.toThrow(
             `'filepath is not a string.`);
         });

         it('bad `filepath` (is directory)', async () =>
         {
            // @ts-expect-error
            await expect(async () => CSVFile.save({ filepath: './test' })).rejects.toThrow(
             `'filepath' is an existing directory.`);
         });

         it('`rows` (not array)', async () =>
         {
            await expect(async () => CSVFile.save({
               filepath: './test/fixture/output/api/data/import/csv/error.csv',
               // @ts-expect-error
               rows: null
            })).rejects.toThrow(`'rows' is not an array.`);
         });

         it('`rows` (empty array)', async () =>
         {
            await expect(async () => CSVFile.save({
               filepath: './test/fixture/output/api/data/import/csv/error.csv',
               rows: []
            })).rejects.toThrow(`'rows' is an empty array.`);
         });

         it('`rows[0]` (not object)', async () =>
         {
            await expect(async () => CSVFile.save({
               filepath: './test/fixture/output/api/data/import/csv/error.csv',
               // @ts-expect-error
               rows: ['invalid']
            })).rejects.toThrow(`'rows[0]' is not an object.`);
         });

         it('write failure', async () =>
         {
            const destroySpy = vi.spyOn(Writable.prototype, 'destroy');

            const writableSpy = vi.spyOn(utilModule, 'createWritable').mockImplementation(() =>
            {
               const stream = new Writable({
                  write(_chunk, _enc, cb) { cb(new Error('write failure')); }
               });

               // ensure async emission like real streams
               process.nextTick(() => stream.emit('error', new Error('write failure')));

               return stream;
            });

            await expect(async () => CSVFile.save({
               filepath: './test/fixture/output/api/data/import/csv/error.csv',
               rows: [{ foo: 'bar' }]
            })).rejects.toThrow('write failure');

            writableSpy.mockRestore();

            expect(destroySpy).toHaveBeenCalled();

            destroySpy.mockRestore();
         });
      });
   });

   describe('functions', () =>
   {
      it('getRows() / save()', async () =>
      {
         const rows = await CSVFile.getRows({ filepath: './test/fixture/input/csv/manabox/collection/premodern.csv' });

         await CSVFile.save({ filepath: './test/fixture/output/api/data/import/csv/premodern.csv', rows });

         const source = fs.readFileSync('./test/fixture/input/csv/manabox/collection/premodern.csv', 'utf-8');
         const result = fs.readFileSync('./test/fixture/output/api/data/import/csv/premodern.csv', 'utf-8');

         expect(result).toBe(source);
      });
   });
});
