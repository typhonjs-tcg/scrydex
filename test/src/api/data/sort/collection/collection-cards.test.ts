import { expect }          from 'vitest';

import { BasicCollection } from '#scrydex/data/sort/collection';
import { SortedKind }      from '#scrydex/data/sort/collection/category';

import { testConfig }      from '#test/config';
import { TestData }        from '#test/util';

describe.runIf(testConfig['sortCollectionCards'])('Card collections (w/ cards)', () =>
{
   describe('AbstractCollection', () =>
   {
      const collection: BasicCollection = new BasicCollection({
         cards: TestData.cards,
         dirpath: 'test',
         sortByKind: true
      });

      it('Card group test (false)', () => assert.isFalse(collection.isCardGroup(TestData.card, 'proxy')));

      it('`entries()` iterator', () =>
      {
         const result = [...collection.entries()];

         expect(result).toEqual([
            ['all', new SortedKind({ name: 'all' })]
         ]);
      });

      it('`has()` category', () =>
      {
         assert.isTrue(collection.has('all'));
      });

      it('`keys()` iterator', () =>
      {
         const result = [...collection.keys()];

         expect(result).toEqual(['all']);
      });

      it('`calculateMarked()` / resetMarked()', () =>
      {
         for (const card of collection.cards) { assert.isUndefined(card.mark); }

         collection.calculateMarked(new Set(['premodern']));

         for (const card of collection.cards)
         {
            if (card.filename === 'premodern')
            {
               assert.isString(card.mark)
            }
            else
            {
               assert.isUndefined(card.mark);
            }
         }

         collection.resetMarked();

         for (const card of collection.cards) { assert.isUndefined(card.mark); }
      });
   });

   describe('BasicCollection', () =>
   {
      const collection: BasicCollection = new BasicCollection({
         cards: TestData.cards,
         dirpath: 'test',
         sortByKind: true
      });

      it('Default Meta', () => assert.deepEqual(collection.meta, { type: 'sorted', name: 'Unknown', groups: {} }));

      it('Empty sort options', () => assert.deepEqual(collection.getSortOptions(), {}));

      it('Has `dirpath`', () => expect(collection.dirpath).toBe('test'));

      it('Sort collection', () =>
      {
         collection.sort({ alpha: true, type: true });

         assert.deepEqual(collection.getSortOptions(), { alpha: true, type: true });
      });
   });
});
