import type { CardSorted } from '#types-command';

export class SortedRarity
{
   /**
    */
   #categories: Map<string, CardSorted[]> = new Map();

   /**
    * Rarity value for this collection of cards.
    */
   readonly #rarity: string;

   #regexArtifact = /\bartifact\b/i;
   #regexBasicLand = /\bbasic\s+land\b/i;
   #regexLand = /\bland\b/i

   /**
    * Extracts mana cost tokens like `{W}`, `{2}{U/B}`, `{G/P}`, `{X}`.
    */
   #regexManaCost = /\{([^}]+)}/g;

   /**
    * @param rarity - Rarity value for this collection of cards.
    */
   constructor(rarity: string)
   {
      this.#rarity = rarity;

      this.#categories = new Map();

      this.#categories.set('W', []);
      this.#categories.set('U', []);
      this.#categories.set('B', []);
      this.#categories.set('R', []);
      this.#categories.set('G', []);
      this.#categories.set('Multicolor', []);
      this.#categories.set('Artifact (Colorless)', []);
      this.#categories.set('Non-artifact (Colorless)', []);
      this.#categories.set('Land', []);
      this.#categories.set('Land (Basic)', []);
      this.#categories.set('Unsorted', []);
   }

   /**
    * @returns Rarity name for this group of cards.
    */
   get name(): string
   {
      return this.#rarity;
   }

   /**
    * @returns The total amount of cards at this rarity.
    */
   get size(): number
   {
      let result = 0;

      for (const cards of this.#categories.values()) { result += cards.length; }

      return result;
   }

   /**
    * @param card - Card to add.
    */
   add(card: CardSorted)
   {
      if (!Array.isArray(card.colors))
      {
         this.#categories.get('Unsorted')?.push(card);
         return;
      }

      switch(card.colors?.length)
      {
         case 0:
         {
            // Devoid cards lack `colors` data, but have a mana cost, so sort by mana cost colors.
            if (Array.isArray(card.keywords) && card.keywords.includes('Devoid'))
            {
               this.#sortManaCost(card);
            }
            else
            {
               this.#sortColorless(card);
            }
            break;
         }

         case 1:
            this.#sortMono(card, card.colors);
            break;

         default:
            this.#sortMulti(card);
            break;
      }
   }

   /**
    * @returns Entry iterator for category / cards.
    */
   entries(): MapIterator<[string, CardSorted[]]>
   {
      return this.#categories.entries();
   }

   /**
    * Sort all categories by alpha / name.
    */
   sortAlpha()
   {
      for (const cards of this.#categories.values())
      {
         cards.sort((a, b) => a.name.localeCompare(b.name));
      }
   }

   /**
    * Sort all categories by normalized type line.
    */
   sortType()
   {
      for (const cards of this.#categories.values())
      {
         cards.sort((a, b) => a.type.localeCompare(b.type));
      }
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

   /**
    * Parses a Scryfall mana_cost string such as `{2}{W}{U/B}{G/P}` and returns a set of MTG color letters actually
    * required to CAST the spell.
    *
    * @param manaCost - `mana_cost` Scryfall data.
    *
    * @returns A set of unique WUBRG colors contained in the mana cost.
    */
   #parseManaCostColors(manaCost: string): Set<string>
   {
      if (typeof manaCost !== 'string' || manaCost.length === 0) { return new Set(); }

      const symbols = manaCost.match(this.#regexManaCost);
      if (!symbols) { return new Set(); }

      const colorSet: Set<string> = new Set();

      for (const symbol of symbols)
      {
         // Strip braces → `{W/U}` → `W/U`.
         const inner = symbol.slice(1, -1).toUpperCase();

         // Hybrid (W/U), Phyrexian (W/P), Snow (S), Colorless (C), Numeric (2), X, etc.
         // We only care about actual color letters. Split on non-alphanumeric to catch hybrids cleanly.
         const parts = inner.split(/[^A-Z]/);

         for (const p of parts)
         {
            // p will be -> "W", "U", "G", "P", "C", "X", "". Only include actual color letters.
            if (p === 'W' || p === 'U' || p === 'B' || p === 'R' || p === 'G') { colorSet.add(p); }
         }
      }

      return colorSet;
   }

   /**
    * @param card -
    */
   #sortColorless(card: CardSorted)
   {
      if (this.#regexArtifact.test(card.type_line))
      {
         this.#categories.get('Artifact (Colorless)')?.push(card);
      }
      else if (this.#regexBasicLand.test(card.type_line))
      {
         this.#categories.get('Land (Basic)')?.push(card);
      }
      else if (this.#regexLand.test(card.type_line))
      {
         this.#categories.get('Land')?.push(card);
      }
      else
      {
         this.#categories.get('Non-artifact (Colorless)')?.push(card);
      }
   }

   #sortManaCost(card: CardSorted)
   {
      const colors = this.#parseManaCostColors(card.mana_cost);

      switch (colors.size)
      {
         case 0:
            this.#sortColorless(card);
            break;

         case 1:
            this.#sortMono(card, [...colors]);
            break;

         default:
            this.#sortMulti(card);
            break;
      }
   }

   /**
    * @param card -
    *
    * @param colorSource -
    */
   #sortMono(card: CardSorted, colorSource: string[])
   {
      const color = colorSource[0];

      const category = this.#categories.get(color.toUpperCase());

      category?.push(card);
   }

   /**
    * @param card -
    */
   #sortMulti(card: CardSorted)
   {
      const category = this.#categories.get('Multicolor');

      category?.push(card);
   }
}
