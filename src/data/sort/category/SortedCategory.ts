import type {
   CardCategory,
   CardSorted}    from '../types-sort';

export class SortedCategory<T = CardSorted> implements CardCategory<T>
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
