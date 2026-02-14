import { BasicSection }    from './section';

import { SortCards }       from '../../util/SortCards';
import { KindSortOrder }   from '../../util/KindSortOrder';

import type {
   CardCategory,
   CardSection,
   CardSorted }            from '../../types-sort';

/**
 * Provides a {@link CardCategory} implementation that groups cards into WUBRG+ sub-categories.
 */
export class SortedKind implements CardCategory
{
   /**
    */
   #categories: Map<string, CardSection>;

   /**
    * Name for this collection of cards.
    */
   readonly #name: string;

   /**
    * @param name - Name for this collection of cards.
    */
   constructor({ name }: { name: string })
   {
      this.#name = name;

      this.#categories = new Map<string, CardSection>();

      this.#categories.set('W', new BasicSection({ nameFull: 'White', nameShort: 'W' }));

      this.#categories.set('U', new BasicSection({ nameFull: 'Blue', nameShort: 'U' }));

      this.#categories.set('B', new BasicSection({ nameFull: 'Black', nameShort: 'B' }));

      this.#categories.set('R', new BasicSection({ nameFull: 'Red', nameShort: 'R' }));

      this.#categories.set('G', new BasicSection({ nameFull: 'Green', nameShort: 'G' }));

      this.#categories.set('Multicolor', new BasicSection({ nameFull: 'Multicolor', nameShort: 'Multicolor' }));

      this.#categories.set('Artifact (Colorless)',
       new BasicSection({ nameFull: 'Artifact (Colorless)', nameShort: 'Artifact (Colorless)' }));

      this.#categories.set('Non-artifact (Colorless)',
       new BasicSection({ nameFull: 'Non-artifact (Colorless)', nameShort: 'Non-artifact (Colorless)' }));

      this.#categories.set('Land', new BasicSection({ nameFull: 'Land', nameShort: 'Land' }));

      this.#categories.set('Land (Basic)', new BasicSection({ nameFull: 'Land (Basic)', nameShort: 'Land (Basic)' }));

      this.#categories.set('Unsorted', new BasicSection({ nameFull: 'Unsorted', nameShort: 'Unsorted' }));
   }

   /**
    * @returns Name for this collection of cards.
    */
   get name(): string
   {
      return this.#name;
   }

   /**
    * @returns The total amount of cards in this collection.
    */
   get size(): number
   {
      let result = 0;

      for (const category of this.#categories.values()) { result += category.cards.length; }

      return result;
   }

   /**
    * @param card - Card to add.
    */
   add(card: CardSorted)
   {
      const categoryName = KindSortOrder.categoryName(card);
      const category = this.#categories.get(categoryName)

      if (category)
      {
         category.cards.push(card);
      }
      else
      {
         throw new Error(`SortedColor.add warning: Unknown category name '${categoryName}'.`);
      }
   }

   /**
    * @returns Entry iterator for category / cards.
    */
   entries(): MapIterator<[string, CardSection]>
   {
      return this.#categories.entries();
   }

   /**
    * Get a specific card category.
    *
    * @param key - Card category name.
    *
    * @returns Specific card category.
    */
   get(key: string): CardSection | undefined
   {
      return this.#categories.get(key);
   }

   /**
    * Is there a specific card category?
    *
    * @param key - Card category name.
    *
    * @returns Whether a specific card category exists for the given key.
    */
   has(key: string): boolean
   {
      return this.#categories.has(key);
   }

   /**
    * @returns Key iterator for category / cards.
    */
   keys(): MapIterator<string>
   {
      return this.#categories.keys();
   }

   /**
    * @returns Values iterator for category / cards.
    */
   values(): MapIterator<CardSection>
   {
      return this.#categories.values();
   }

   /**
    * @param options -
    *
    * @param [options.alpha] - Sort by alphabetical name.
    *
    * @param [options.type] - Sort by normalized type.
    */
   sort(options: { alpha?: boolean, type?: boolean })
   {
      if (options.alpha)
      {
         for (const category of this.#categories.values())
         {
            SortCards.byNameThenPrice({ cards: category.cards, priceDirection: 'desc' });
         }
      }

      if (options.type)
      {
         for (const category of this.#categories.values()) { SortCards.byType({ cards: category.cards }); }
      }
   }
}
