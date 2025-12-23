import {
   ConfigCardFilter,
   PriceExpression } from '#types-data';

/**
 * Config object for the `convert` command.
 */
interface ConfigConvert
{
   /**
    * File path to Scryfall JSON DB.
    */
   db: string;

   /**
    * Input CSV file or directory path to CSV files for card collections representing active decks.
    */
   decks: string;

   /**
    * Input CSV file or directory path to CSV files for card collections representing externally organized collections.
    */
   external: string;

   /**
    * Input CSV file or directory path to CSV files.
    */
   input: string;

   /**
    * Output file path for converted card JSON DB.
    */
   output: string;
}

/**
 * Config object for the `filter` command.
 */
interface ConfigFilter
{
   /**
    * Config for {@link CardFilter}.
    */
   filter: ConfigCardFilter;

   /**
    * Input card JSON DB file.
    */
   input: string;

   /**
    * Output file path for filtered card JSON DB.
    */
   output: string;
}

interface ConfigFind
{
   /**
    * File or directory path to load.
    */
   input: string;

   /**
    * Config for {@link CardFilter}.
    */
   filter: ConfigCardFilter;
}

/**
 * Config object for the `sort` command.
 */
interface ConfigSort
{
   /**
    * Input JSON file post conversion.
    */
   input: string;

   /**
    * A set of CSV file names in the conversion process to mark / highlight for merging.
    */
   mark: Set<string>;

   /**
    * Output directory for spreadsheets.
    */
   output: string;

   /**
    * When true, sort by type of card after alpha sorting.
    */
   sortByType: boolean;

   /**
    * Theme name.
    */
   theme: 'light' | 'dark';
}

interface ConfigSortFormat extends ConfigSort
{
   /**
    * Scryfall game formats and sort order.
    */
   formats: string[];

   /**
    * When defined
    */
   highValue: PriceExpression | null;
}

export {
   type ConfigConvert,
   type ConfigFilter,
   type ConfigFind,
   type ConfigSort,
   type ConfigSortFormat };
