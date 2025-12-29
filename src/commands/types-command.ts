import type {
   CardDBMetadataGroups }  from '#types';

import type {
   ConfigCardFilter,
   PriceExpression }       from '#types-data';

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
    * Input CSV file or directory path to CSV files for card collections representing various groups.
    */
   groups: CardDBMetadataGroups<string>;

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
 * Config object for all `export` commands.
 */
interface ConfigExport
{
   /**
    * When true, combine identical card printings.
    */
   coalesce: boolean;

   /**
    * Input card JSON DB file or directory.
    */
   input: string;

   /**
    * Output file or directory path for exported data.
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

/**
 * Config object for the `find` command.
 */
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
 * Base config object for all `sort` commands.
 */
interface ConfigSort
{
   /**
    * When true, remove existing sorted output before regenerating.
    */
   clean: boolean;

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

/**
 * Config object for the `sortFormat` command.
 */
interface ConfigSortFormat extends ConfigSort
{
   /**
    * Scryfall game formats and sort order.
    */
   formats: string[];

   /**
    * When defined sorted collections are separated into high value binders.
    */
   highValue: PriceExpression | null;
}

export {
   type ConfigConvert,
   type ConfigExport,
   type ConfigFilter,
   type ConfigFind,
   type ConfigSort,
   type ConfigSortFormat };
