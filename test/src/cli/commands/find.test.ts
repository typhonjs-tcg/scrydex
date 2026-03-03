import {
   afterEach,
   beforeEach,
   expect,
   vi }                 from 'vitest';

import { commandFind }  from '../../../../src/cli/functions';

describe('find', () =>
{
   let logSpy: ReturnType<typeof vi.spyOn>;
   let logResult: any[][] = [];

   beforeEach(() =>
   {
      logResult = [];
      logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => logResult.push(args));
   });

   afterEach(() => logSpy.mockRestore());

   it('default-query', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Smothering Tithe', {
         loglevel: 'info'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query.json');
   });

   it('default-query-boundary', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Tomb', {
         loglevel: 'info',
         b: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-boundary.json');
   });

   it('default-query-insensitive', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'FORCE OF', {
         loglevel: 'info',
         i: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-insensitive.json');
   });

   it('default-query-exact', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Urborg', {
         loglevel: 'info',
         exact: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-exact.json');
   });

   it('default-query-border-format', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
         loglevel: 'info',
         border: 'black',
         formats: 'oldschool'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-border-format.json');
   });

   it('default-query-cmc', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
         loglevel: 'info',
         cmc: '8'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-cmc.json');
   });

   it('default-query-keywords', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
         loglevel: 'info',
         keywords: 'goad'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-keywords.json');
   });

   it('default-query-keywords', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
         loglevel: 'info',
         'mana-cost': '{2}{W}{U}'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-mana-cost.json');
   });

   it('default-query-price', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', '', {
         loglevel: 'info',
         price: '>500'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query-price.json');
   });

   it('name-query', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Smothering Tithe', {
         loglevel: 'info',
         name: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/default-query.json');
   });

   it('oracle-query', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection',
       `As long as your devotion to white is less than five, Heliod isn't a creature.`, {
         loglevel: 'info',
         oracle: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/oracle-query.json');
   });

   it('type-query', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Elemental Incarnation', {
         loglevel: 'info',
         type: true
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/type-query.json');
   });

   it('type-query-color-identity', async () =>
   {
      await commandFind('./test/fixture/snapshot/cli/sort-format/collection', 'Creature', {
         loglevel: 'info',
         type: true,
         'color-identity': '{W}{U}'
      });

      await expect(JSON.stringify(logResult, null, 2)).toMatchFileSnapshot(
       '../../../fixture/snapshot/cli/find/type-query-color-identity.json');
   });
});
