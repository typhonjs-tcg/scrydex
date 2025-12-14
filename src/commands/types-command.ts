import type { Borders, Fill, Font } from 'exceljs';

import type { ExportSpreadsheet }   from './sort/ExportSpreadsheet';

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
 * Defines theming data used by {@link ExportSpreadsheet}.
 */
interface ThemeData
{
   get cell(): {
      border: Partial<Borders>
   }

   get fonts(): {
      header: Partial<Font>,
      link: Partial<Font>,
      main: Partial<Font>
   }

   get mark(): {
      error: { fill: Fill, border: Partial<Borders> }
      ok: { fill: Fill, border: Partial<Borders> }
      warning: { fill: Fill, border: Partial<Borders> }
      in_deck: { fill: Fill, border: Partial<Borders> }
   }

   get row(): {
      fill: {
         alternate: Fill,
         default: Fill
      },

      lastRow: {
         border: Partial<Borders>
      }
   }

   get sortByType(): {
      border: Partial<Borders>
   }
}

export {
   type ConfigConvert,
   type ConfigFilter,
   type ConfigSort,
   type ThemeData };
