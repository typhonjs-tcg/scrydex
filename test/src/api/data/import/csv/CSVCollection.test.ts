import {
   assert,
   expect }                from 'vitest';

import { CSVCollection }   from '#scrydex/data/import/csv';

import { testConfig }      from '#test/config';

import type { CSVCard }    from '#scrydex/data/import/csv';

describe.runIf(testConfig['importCSV'])('CSVCollection', () =>
{
   describe('errors', () =>
   {
      describe('load()', () =>
      {
         it('bad path', async () =>
         {
            await expect(async () => CSVCollection.load({
               path: 'INVALID PATH'
            })).rejects.toThrow(`Invalid path: INVALID PATH`);
         });
      });
   });

   describe('API', () =>
   {
      describe('get groups', () =>
      {
         it('has groups', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/manabox/collection',
               groups: {
                  decks: './test/fixture/input/csv/manabox/groups/group-decks.csv'
               }
            });

            const groups = collection.groups;

            assert.deepEqual(groups, {
               decks: ['group-decks']
            });
         });

         it('no groups', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/manabox/collection'
            });

            const groups = collection.groups;

            assert.deepEqual(groups, {});
         });
      });

      describe('clear()', () =>
      {
         it('success', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(collection.size).toBe(28);

            collection.clear();

            expect(collection.size).toBe(0);
         });
      });

      describe('entries()', () =>
      {
         it('count correct', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            const entries = [...collection.entries()];

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(entries.length).toBe(28);

            // Verifying total quantity from `entries` reduction.
            const totalCards = entries.reduce((total, variants) => total +
             variants[1].reduce((quantity, card) => quantity + card.quantity, 0), 0);

            expect(totalCards).toBe(75);
         });
      });

      describe('getCardGroups()', () =>
      {
         it('card with and without group', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/manabox/collection',
               groups: {
                  decks: './test/fixture/input/csv/manabox/groups/group-decks.csv'
               }
            });

            const csvCard: CSVCard = {
               object: 'card',
               filename: 'INVALID',
               finish: 'normal',
               quantity: 1,
               scryfall_id: 'INVALID',
               user_tags: []
            }

            // No scryfall ID / not in collection.
            assert.isUndefined(collection.getCardGroups(csvCard));

            // Card: Abandon Hope / no file name to associate with groups.
            csvCard.scryfall_id = '942cf220-472c-48f6-8f60-993939ea5ab8'

            // No scryfall ID / not in collection.
            assert.isUndefined(collection.getCardGroups(csvCard));

            // Added matching file name.
            csvCard.filename = 'group-decks'

            const result = collection.getCardGroups(csvCard);

            assert.isDefined(result);
            expect(result).toContain('decks');
         });
      });

      describe('hasVariant()', () =>
      {
         it('false', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Non-existent card.
            assert.isFalse(collection.hasVariant({ scryfall_id: 'BOGUS' }));
         });

         it('true (explicit)', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            // Unique card: Rushing River; defaults to `normal:en` variant key.
            assert.isTrue(collection.hasVariant({
               scryfall_id: '52ddf7bf-de9c-4657-8d5b-79869d36fa63',
               finish: 'normal',
               user_lang: 'en'
            }));
         });
      });

      describe('keys()', () =>
      {
         it('count correct', async () =>
         {
            const collection = await CSVCollection.load({
               path: './test/fixture/input/csv/archidekt/deck/pm_iggy_pop.csv'
            });

            const keys = [...collection.keys()];

            // Note: In collection mode / no deck or zones there are 28 unique.
            expect(keys.length).toBe(28);
         });
      });
   });
});
