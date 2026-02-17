import type { BasicLogger }   from '@typhonjs-utils/logger-color';

import type { CardDB }        from '#scrydex/data/db';

import type { ExportExcel }   from '#scrydex/data/export';

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
   groups: CardDB.File.MetadataGroups<string>;

   /**
    * When true, the output inventory CardDB is compressed.
    */
   compress: boolean;

   /**
    * Output file path for converted card JSON DB.
    */
   output: string;

   /**
    * Input CSV file or directory path to CSV files.
    */
   path: string;
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
 * Config object for all text / CSV `export` commands.
 */
interface Export extends Command
{
   /**
    * When true, combine identical card printings.
    */
   coalesce: boolean;

   /**
    * Output file or directory path for exported data.
    */
   output: string;

   /**
    * Input card JSON DB file or directory path.
    */
   path: string;
}

/**
 * Config object for `export-excel` command.
 */
interface ExportSpreadsheet extends Command
{
   /**
    * Controls column visibility for _some_ card properties.
    */
   columns?: ExportExcel.Options.Columns;

   /**
    * Output file or directory path for exported data.
    */
   output: string;

   /**
    * Input card JSON DB file or directory path.
    */
   path: string;

   /**
    * Various sort options.
    */
   sort?: ExportExcel.Options.Sort;

   /**
    * Theme name.
    */
   theme?: 'light' | 'dark';
}

/**
 * Config object for `export-llm` command.
 */
interface ExportLLM extends Command
{
   /**
    * When false, rules oracle text is omitted to reduce LLM token count.
    */
   oracleText: boolean;

   /**
    * Output file or directory path for exported data.
    */
   output: string;

   /**
    * Input card JSON DB file or directory path.
    */
   path: string;

   /**
    * When true, the `llmdb.d.ts` type declaration is output.
    */
   types: boolean;
}

/**
 * Config object for the `fileCompress` command.
 */
interface FileCompress extends Command
{
   /**
    * Either compress or decompress.
    */
   mode: 'compress' | 'decompress';

   /**
    * Target file path.
    */
   path: string;
}

/**
 * Config object for the `filter` command.
 */
interface Filter extends Command
{
   /**
    * When true, the output CardDB is compressed.
    */
   compress: boolean;

   /**
    * Config for {@link CardDB.CardFilter}.
    */
   filter: CardDB.Options.CardFilter;

   /**
    * Output file path for filtered card JSON DB.
    */
   output: string;

   /**
    * Input card JSON DB file path.
    */
   path: string;
}

/**
 * Base config object for all `sort` commands.
 */
interface Sort extends Command
{
   /**
    * When true, remove existing sorted output before regenerating.
    */
   clean?: boolean;

   /**
    * A set of CSV file names in the conversion process to mark / highlight for merging.
    */
   mark?: Set<string>;

   /**
    * When true, the output sorted format CardDBs are compressed.
    */
   compress?: boolean;

   /**
    * Output directory for spreadsheets.
    */
   output: string;

   /**
    * Input JSON file path post conversion.
    */
   path: string;

   /**
    * Various sort options.
    */
   sort?: ExportExcel.Options.Sort;

   /**
    * Theme name.
    */
   theme?: 'light' | 'dark';
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
   highValue: CardDB.Data.PriceExpression | null;
}

/**
 * Provides all the configuration objects for all commands from `@typhonjs-tcg/scrydex/commands`.
 */
declare namespace ConfigCmd
{
   export {
      Command,
      Convert,
      Diff,
      Export,
      ExportLLM,
      ExportSpreadsheet,
      FileCompress,
      Filter,
      Sort,
      SortFormat
   };
}

export { type ConfigCmd };
