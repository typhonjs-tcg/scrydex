import fs               from 'node:fs';
import path             from 'node:path';

import XLSX             from 'xlsx';

import { isDirectory }  from '@typhonjs-utils/file-util';

XLSX.set_fs(fs);

/**
 * Export all `SortedFormat` instances as spreadsheets by rarity.
 */
export class ExportSpreadsheet
{
   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {SortedFormat[]} formats -
    */
   static export(config, formats)
   {
      for (const format of formats)
      {
         if (format.size > 0) { this.#exportFormat(config, format); }
      }
   }

   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {SortedFormat}   format -
    */
   static #exportFormat(config, format)
   {
      for (const rarity of format.values())
      {
         if (rarity.size > 0) { this.#exportFormatRarity(config, format.name, rarity); }
      }
   }

   /**
    *
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {string}   formatName -
    *
    * @param {SortedRarity}   rarity -
    */
   static #exportFormatRarity(config, formatName, rarity)
   {
      // Store spreadsheets in format subdirectories.
      const formatDirPath = path.resolve(config.output, formatName);

      // Create format subdirectory if it doesn't exist already.
      if (!isDirectory(formatDirPath)) { fs.mkdirSync(formatDirPath); }

      const wb = XLSX.utils.book_new();

      for (const [category, cards] of rarity.entries())
      {
         if (cards.length <= 0) { continue; }

         const sheet = [];

         for (const card of cards)
         {
            sheet.push({
               Name: card.name,
               Quantity: card.quantity,
               Filename: card.filename,
               "Type Line": card.type_line,
               Set: card.set,
               "Set Name": card.set_name,
               "Collector #": card.collector_number,
               "Mana Cost": card.mana_cost,
               CMC: card.cmc,
               Colors: card.colors?.join(', ') ?? '',
               "Color Identity": card.color_identity?.join(', ') ?? '',
               Reserved: card.reserved,
               "Game Changer": card.game_changer
            });
         }

         XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), category);
      }

      const outputPath = path.resolve(formatDirPath, `${formatName}-${rarity.name}.xlsx`);

      XLSX.writeFile(wb, outputPath);
   }
}
