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
    * Input CSV file or directory path to CSV files for card collections in decks / checked out.
    */
   decks: string;

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
    * Card border colors to filter.
    */
   border: Set<string> | null;

   /**
    * WUBRG color identity set.
    */
   colorIdentity: Set<string> | null;

   /**
    * Scryfall game formats.
    */
   formats: string[] | null;

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
   checks: ConfigFindChecks;

   /**
    * Directory to load.
    */
   dirpath: string;

   /**
    * Regular expression to evaluate on card names.
    */
   regex: RegExp;

   /**
    * The card fields to search.
    */
   regexFields: Set<string>;
}

/**
 * Additional `find` command data for match checks.
 */
interface ConfigFindChecks
{
   /**
    * Match card `CMC`.
    */
   cmc?: number;
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
}

export {
   type ConfigConvert,
   type ConfigFilter,
   type ConfigFind,
   type ConfigSort,
   type ConfigSortFormat };
