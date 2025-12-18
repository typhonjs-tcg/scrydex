/**
 * Extracts mana cost tokens like `{W}`, `{2}{U/B}`, `{G/P}`, `{X}`.
 */
const s_REGEX_MANA_COST = /\{([^}]+)}/g;

/**
 * Parses a Scryfall mana_cost string such as `{2}{W}{U/B}{G/P}` and returns a set of MTG color letters actually
 * required to CAST the spell.
 *
 * @param manaCost - `mana_cost` Scryfall data.
 *
 * @returns A set of unique WUBRG colors contained in the mana cost.
 */
export function parseManaCostColors(manaCost: string): Set<string>
{
   if (typeof manaCost !== 'string' || manaCost.length === 0) { return new Set(); }

   const symbols = manaCost.match(s_REGEX_MANA_COST);
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
         // p will be -> `W`, `U`, `G`, `P`, `C`, `X`. Only include actual color letters.
         if (p === 'W' || p === 'U' || p === 'B' || p === 'R' || p === 'G') { colorSet.add(p); }
      }
   }

   return colorSet;
}
