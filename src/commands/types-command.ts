/**
 * Config object for the `convert` command.
 */
interface ConfigConvert
{
   /**
    * Export a compacted JSON DB w/ a card entry per row.
    */
   compact: boolean;

   /**
    * File path to Scryfall JSON DB.
    */
   db: string;

   /**
    * When not `compact` this value provide JSON stringify indent value.
    */
   indent: number | null;

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
 * Config object for the `sort` command.
 */
interface ConfigSort
{
   /**
    * Scryfall game formats and sort order.
    */
   formats: string[];

   /**
    * Input JSON file post conversion.
    */
   input: string;

   /**
    * Output directory for spreadsheets.
    */
   output: string;

   /**
    * When true, sort by type of card after alpha sorting.
    */
   sortByType: boolean;
}

export {
   type ConfigConvert,
   type ConfigSort };
