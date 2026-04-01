import {
   assert,
   expect }             from 'vitest';

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

   describe('API', () =>
   {
      describe('clear()', () =>
      {
         it('success', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(cards.size).toBe(28);

            cards.clear();

            expect(cards.size).toBe(0);
         });
      });

      describe('entries()', () =>
      {
         it('count correct', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            const entries = [...cards.entries()];

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(entries.length).toBe(28);

            // Verifying total quantity from `entries` reduction.
            const totalCards = entries.reduce((total, variants) => total +
             variants[1].reduce((quantity, card) => quantity + card.quantity, 0), 0);

            expect(totalCards).toBe(75);
         });
      });

      describe('fromCSV()', () =>
      {
         it('user tags', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Unique card: Rushing River
            const card = cards.getVariant({ scryfall_id: '52ddf7bf-de9c-4657-8d5b-79869d36fa63' });

            assert.isDefined(card);

            expect(card.quantity).toBe(1);
            expect(card.user_tags).toContain('sideboard');
         });
      });

      describe('hasVariant()', () =>
      {
         it('false', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Non-existent card.
            assert.isFalse(cards.hasVariant({ scryfall_id: 'BOGUS' }));
         });

         it('true (explicit)', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Unique card: Rushing River; defaults to `normal:en` variant key.
            assert.isTrue(cards.hasVariant({
               scryfall_id: '52ddf7bf-de9c-4657-8d5b-79869d36fa63',
               finish: 'normal',
               user_lang: 'en'
            }));
         });

         it('true (explicit / type error fallback)', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Unique card: Rushing River; defaults to `normal:en` variant key.
            assert.isTrue(cards.hasVariant({
               scryfall_id: '52ddf7bf-de9c-4657-8d5b-79869d36fa63',
               // @ts-expect-error
               finish: null,
               // @ts-expect-error
               user_lang: null
            }));
         });

         it('true (implicit)', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Unique card: Rushing River; defaults to `normal:en` variant key.
            assert.isTrue(cards.hasVariant({ scryfall_id: '52ddf7bf-de9c-4657-8d5b-79869d36fa63' }));
         });
      });

      describe('keys()', () =>
      {
         it('count correct', async () =>
         {
            const cards = await CSVCardIndex.fromCSV({
               filepath: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            const keys = [...cards.keys()];

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(keys.length).toBe(28);
         });
      });
   });
});
