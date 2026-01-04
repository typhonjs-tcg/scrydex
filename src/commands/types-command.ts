import type { BasicLogger }            from '@typhonjs-utils/logger-color';

import type { CardDBMetadataGroups }   from '#scrydex/data/db';

import type {
   ConfigCardFilter,
   PriceExpression }                   from '#scrydex/data/db/util';

interface Command
{
   /**
    * Optional logger interface.
    */
   logger?: BasicLogger;
}

/**
 * Config object for the `convert` command.
 */
interface Convert extends Command
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
 * Config object for the `diff` command.
 */
interface Diff extends Command
{
   /**
    * Input card JSON DB file or directory.
    */
   baseline: string;

   /**
    * Input card JSON DB file or directory.
    */
   comparison: string;

   /**
    * Output file or directory path for diff report.
    */
   output: string;
}

/**
 * Config object for all `export` commands.
 */
interface Export extends Command
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
interface Filter extends Command
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
interface Find extends Command
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
interface Sort extends Command
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
interface SortFormat extends Sort
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

/**
 * Provides all the configuration objects for all commands from `@typhonjs-tcg/scrydex/commands`.
 */
declare namespace ConfigCmd
{
   export {
      Convert,
      Diff,
      Export,
      Filter,
      Find,
      Sort,
      SortFormat
   };
}

export { type ConfigCmd };
