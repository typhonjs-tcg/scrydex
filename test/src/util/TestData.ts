import { CardDB } from '#scrydex/data/db';

const dbPremodern = await CardDB.load({
   filepath: './test/fixture/snapshot/cli/sort-format/collection/premodern/premodern.json'
});

/**
 * All cards from sorted snapshot `premodern` collection.
 */
const cardsPremodern = await dbPremodern.getAll();

/**
 * Provides a convenience class to access the first card or all cards from the snapshot `premodern` sorted collection.
 */
export abstract class TestData
{
   private constructor() {}

   /**
    * Get the first card from the snapshot `premodern` collection.
    */
   static get card(): CardDB.Data.Card
   {
      return structuredClone(cardsPremodern[0]);
   }

   /**
    * Get all cards from the snapshot `premodern` collection.
    */
   static get cards(): CardDB.Data.Card[]
   {
      return structuredClone(cardsPremodern);
   }
}
