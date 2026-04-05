import { expect }          from 'vitest';

import { BasicCollection } from '#scrydex/data/sort/collection';

import { testConfig }      from '#test/config';
import { TestData }        from '#test/util';

describe.runIf(testConfig['sortCollectionEmpty'])('Card collections (empty)', () =>
{
   describe('AbstractCollection', () =>
   {
      const collection: BasicCollection = new BasicCollection({ cards: [] });

      it('Empty `calculateMarked`', () => assert.deepEqual(collection.calculateMarked(new Set(['empty'])), []));

      // @ts-expect-error
      it('Unknown card group', () => assert.isFalse(collection.isCardGroup(TestData.card, 'test')));
   });

   describe('BasicCollection', () =>
   {
      const collection: BasicCollection = new BasicCollection({ cards: [] });

      it('Default Meta', () => assert.deepEqual(collection.meta, { type: 'sorted', name: 'Unknown', groups: {} }));

      it('Empty `dirpath`', () => expect(collection.dirpath).toBe(''));

      it('Empty sort options', () => assert.deepEqual(collection.getSortOptions(), {}));
   });
});
