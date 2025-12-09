import type { Borders, Fill, Font } from 'exceljs';

import type { Card }                from '#types';

import type { ExportSpreadsheet }   from './sort/ExportSpreadsheet';

/**
 * Additional data added to cards when sorting.
 */
interface CardSorted extends Card
{
   /**
    * For marked files indicate merge status.
    */
   mark?: 'error' | 'ok' | 'warning';
}

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
   }

   get row(): {
      fill: {
         alternate: Fill,
         default: Fill
      }
   }

   get sortByType(): {
      border: Partial<Borders>
   }
}

export {
   type CardSorted,
   type ConfigConvert,
   type ConfigSort,
   type ThemeData };
