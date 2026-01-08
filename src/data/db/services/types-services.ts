import type {
   BasicLogger,
   LogLevel }                 from "@typhonjs-utils/logger-color";

import type { ScryfallData }  from "#scrydex/data/scryfall";

import type {
   Data,
   Options }                  from '../types-db';

interface CardFields
{
   /**
    * Calculate union for `colors` field taking into account card faces.
    *
    * @param card -
    *
    * @returns Read only union of all card colors.
    */
   colorUnion(card: Data.Card): Readonly<ScryfallData.Colors>;

   /**
    * Parse card colors from mana cost. Some card categories like `Devoid` do not have an associated `colors` array, but
    * do have a mana cost potentially with casting colors.
    *
    * @param card -
    *
    * @returns A set with mana cost colors.
    */
   colorManaCost(card: Data.Card): Set<string>;

   /**
    * Defer to original CSV language code if available and differs from the Scryfall card `lang` field.
    *
    * Alas, currently most online MTG collection services do not associate cards w/ foreign language Scryfall IDs.
    * A temporary solution is to defer to any language set by the collection service exported CSV instead of the
    * found Scryfall card data / language when these values differ. This requires the user to correctly set the language
    * in the online MTG collection service.
    *
    * @param card -
    *
    * @returns Normalized language code.
    */
   langCode(card: Data.Card): string;

   /**
    * The mana cost string. Multi-face cards potentially have multiple mana cost seperated by ` // `.
    *
    * @param card -
    *
    * @returns The mana cost string.
    */
   manaCost(card: Data.Card): string;

   /**
    * Return all `colors` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns The `colors` string array parts.
    */
   partsColors(card: Data.Card): ScryfallData.Colors[];

   /**
    * Return all `colors` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns The `colors` string array parts.
    */
   partsCMC(card: Data.Card): number[];

   /**
    * Return all `name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `mana_cost` text parts.
    */
   partsManaCost(card: Data.Card): string[];

   /**
    * Return all `name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `name` text parts.
    */
   partsName(card: Data.Card): string[];

   /**
    * Return all `printed_name` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `printed_name` text parts.
    */
   partsPrintedName(card: Data.Card): string[];

   /**
    * Return all `oracle_text` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `oracle_text` text parts.
    */
   partsOracleText(card: Data.Card): string[];

   /**
    * Return all `type_line` parts for single or dual face cards.
    *
    * @param card -
    *
    * @returns `type_line` text parts.
    */
   partsTypeLine(card: Data.Card): string[];
}

interface CardFilter
{
   /**
    * Checks if there are filter checks to execute in the given config object.
    *
    * @param [config] - Filter config.
    *
    * @return Filter check status.
    */
   hasFilterChecks(config?: Options.CardFilter): config is Options.CardFilter;

   /**
    * Logs messages for the given configuration object.
    *
    * @param config - Filter config.
    *
    * @param logger - Logger instance.
    *
    * @param [logLevel] - Optional level to log message at; default: `info`.
    */
   logConfig(config: Options.CardFilter, logger: BasicLogger, logLevel: LogLevel): void;

   /**
    * Test a card against the given filter config.
    *
    * @param card - Card to test.
    *
    * @param config - Filter config.
    */
   test(card: Data.Card, config: Options.CardFilter): boolean;
}

interface Price
{
   /**
    * @param price -
    *
    * @param expr -
    */
   matchesExpression(price: number | string | null | undefined, expr: Data.PriceExpression): boolean;

   /**
    * Checks that the given price meets the price filter constraints.
    *
    * @param price -
    *
    * @param filter -
    */
   matchesFilter(price: number | null | undefined, filter: Data.PriceFilter): boolean;

   /**
    * @param input - Price expression to parse.
    *
    * @returns Parsed price expression or null.
    */
   parseExpression(input: string): Data.PriceExpression | null;

   /**
    * @param input - Price filter to parse.
    *
    * @returns Parsed price filter or null.
    */
   parseFilter(input: string): Data.PriceFilter | null;
}


/**
 * Provides card fields as a unified string regardless of single / dual faced.
 */
interface PrintCardFields
{
   /**
    * @param card -
    *
    * @returns `colors` string.
    */
   colors(card: Data.Card): string;

   /**
    * @param card -
    *
    * @returns The finish / foil icon embellishment for spreadsheet card name.
    */
   finishIcon(card: Data.Card): string;

   /**
    * Defer to original CSV language code if available and differs from the Scryfall card `lang` field.
    *
    * Alas, currently most online MTG collection services do not associate cards w/ foreign language Scryfall IDs.
    * A temporary solution is to defer to any language set by the collection service exported CSV instead of the
    * found Scryfall card data / language when these values differ. This requires the user to correctly set the language
    * in the online MTG collection service.
    *
    * @param card -
    *
    * @returns Normalized language name.
    */
   langName(card: Data.Card): string;

   /**
    * Defer to Scryfall `name` field before falling back to possible `printed_name`.
    *
    * Append language code for non-English cards.
    *
    * @param card -
    *
    * @returns Normalized card name for spreadsheet display.
    */
   name(card: Data.Card): string;

   /**
    * Generates a note for any oracle text provided with the card.
    *
    * @param card -
    *
    * @returns `oracle_text` for any card.
    */
   oracleText(card: Data.Card): string | undefined;
}

declare namespace Services
{
   export {
      CardFields,
      CardFilter,
      Price,
      PrintCardFields
   };
}

export { type Services };

