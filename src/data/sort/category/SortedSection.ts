import type {
   CardSection,
   CardSorted }   from '../types-sort';

/**
 * Provides a basic card section implementation.
 */
export class SortedSection<T = CardSorted> implements CardSection<T>
{
   readonly #cards: T[];

   readonly #nameFull: string;

   readonly #nameShort: string;

   constructor({ nameFull, nameShort }: { nameFull: string, nameShort: string })
   {
      this.#cards = [];

      this.#nameFull = nameFull;
      this.#nameShort = nameShort;
   }

   get cards(): T[]
   {
      return this.#cards;
   }

   get nameFull(): string
   {
      return this.#nameFull;
   }

   get nameShort(): string
   {
      return this.#nameShort;
   }
}
