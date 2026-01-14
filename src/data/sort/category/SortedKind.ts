import { SortedCategory }  from './SortedCategory';

import { SortCards }       from '../SortCards';
import { SortOrder }       from '../SortOrder';

import type {
   CardCategory,
   CardSorted,
   SortedCategories }   from '../types-sort';

export class SortedKind implements SortedCategories
{
   /**
    */
   #categories: Map<string, CardCategory>;

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

      this.#categories = new Map<string, CardCategory>();

      this.#categories.set('W', new SortedCategory({ nameFull: 'White', nameShort: 'W' }));

      this.#categories.set('U', new SortedCategory({ nameFull: 'Blue', nameShort: 'U' }));

      this.#categories.set('B', new SortedCategory({ nameFull: 'Black', nameShort: 'B' }));

      this.#categories.set('R', new SortedCategory({ nameFull: 'Red', nameShort: 'R' }));

      this.#categories.set('G', new SortedCategory({ nameFull: 'Green', nameShort: 'G' }));

      this.#categories.set('Multicolor', new SortedCategory({ nameFull: 'Multicolor', nameShort: 'Multicolor' }));

      this.#categories.set('Artifact (Colorless)',
       new SortedCategory({ nameFull: 'Artifact (Colorless)', nameShort: 'Artifact (Colorless)' }));

      this.#categories.set('Non-artifact (Colorless)',
       new SortedCategory({ nameFull: 'Non-artifact (Colorless)', nameShort: 'Non-artifact (Colorless)' }));

      this.#categories.set('Land', new SortedCategory({ nameFull: 'Land', nameShort: 'Land' }));

      this.#categories.set('Land (Basic)', new SortedCategory({ nameFull: 'Land (Basic)', nameShort: 'Land (Basic)' }));

      this.#categories.set('Unsorted', new SortedCategory({ nameFull: 'Unsorted', nameShort: 'Unsorted' }));
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
   values(): IterableIterator<CardCategory>
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
