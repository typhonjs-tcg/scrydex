import { SortedSection }  from './SortedSection';

import { SortCards }       from '../SortCards';
import { SortOrder }       from '../SortOrder';

import type {
   CardSection,
   CardSorted,
   SortedCategory }   from '../types-sort';

/**
 * Provides a {@link SortedCategory} implementation that groups cards into WUBRG+ sub-categories.
 */
export class SortedKind implements SortedCategory
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

      this.#categories.set('W', new SortedSection({ nameFull: 'White', nameShort: 'W' }));

      this.#categories.set('U', new SortedSection({ nameFull: 'Blue', nameShort: 'U' }));

      this.#categories.set('B', new SortedSection({ nameFull: 'Black', nameShort: 'B' }));

      this.#categories.set('R', new SortedSection({ nameFull: 'Red', nameShort: 'R' }));

      this.#categories.set('G', new SortedSection({ nameFull: 'Green', nameShort: 'G' }));

      this.#categories.set('Multicolor', new SortedSection({ nameFull: 'Multicolor', nameShort: 'Multicolor' }));

      this.#categories.set('Artifact (Colorless)',
       new SortedSection({ nameFull: 'Artifact (Colorless)', nameShort: 'Artifact (Colorless)' }));

      this.#categories.set('Non-artifact (Colorless)',
       new SortedSection({ nameFull: 'Non-artifact (Colorless)', nameShort: 'Non-artifact (Colorless)' }));

      this.#categories.set('Land', new SortedSection({ nameFull: 'Land', nameShort: 'Land' }));

      this.#categories.set('Land (Basic)', new SortedSection({ nameFull: 'Land (Basic)', nameShort: 'Land (Basic)' }));

      this.#categories.set('Unsorted', new SortedSection({ nameFull: 'Unsorted', nameShort: 'Unsorted' }));
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
      const categoryName = SortOrder.categoryName(card);
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
