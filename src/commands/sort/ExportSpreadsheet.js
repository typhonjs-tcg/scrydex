import path             from 'node:path';

import Excel            from 'exceljs';

import { ManaCostNote } from './ManaCostNote.js';

/**
 * Export all `SortedFormat` instances as spreadsheets by rarity.
 */
export class ExportSpreadsheet
{
   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @param {SortedFormat}   format -
    *
    * @param {SortedRarity}   rarity -
    *
    * @param {string}   formatDirPath -
    */
   static async exportFormatRarity(config, format, rarity, formatDirPath)
   {
      const wb = new Excel.Workbook();

      const byType = config.sortByType;

      for (const [category, cards] of rarity.entries())
      {
         if (cards.length <= 0) { continue; }

         const ws = wb.addWorksheet(category);

         // Column definitions + alignment rules.
         ws.columns = [
            { header: 'Name', key: 'Name', width: 32, alignment: { horizontal: 'left' } },
            { header: 'Quantity', key: 'Quantity', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Filename', key: 'Filename', width: 28, alignment: { horizontal: 'center' } },
            { header: 'Type', key: 'Type', width: 28, alignment: { horizontal: 'center' } },
            { header: 'Type Line', key: 'Type Line', width: 28, alignment: { horizontal: 'center' } },
            { header: 'Set', key: 'Set', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Set Name', key: 'Set Name', width: 28, alignment: { horizontal: 'center' } },
            { header: 'Collector #', key: 'Collector #', width: 12, alignment: { horizontal: 'center' } },
            { header: 'Mana Cost', key: 'Mana Cost', width: 10, alignment: { horizontal: 'center' } },
            { header: 'CMC', key: 'CMC', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Colors', key: 'Colors', width: 10, alignment: { horizontal: 'center' } },
            { header: 'Color Identity', key: 'Color Identity', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Scryfall Link', key: 'Scryfall Link', width: 20, alignment: { horizontal: 'center' } }
         ];

         let prevType = void 0;

         for (const card of cards)
         {
            const row = ws.addRow({
               Name: card.name,
               Quantity: Number(card.quantity),
               Filename: card.filename,
               Type: card.type,
               'Type Line': card.type_line,
               Set: card.set,
               'Set Name': card.set_name,
               'Collector #': card.collector_number,
               'Mana Cost': card.mana_cost,
               CMC: Number(card.cmc),
               Colors: card.colors?.join(', ') ?? '',
               'Color Identity': card.color_identity?.join(', ') ?? '',
               'Scryfall Link': card.scryfall_uri
            });

            if (config.mark.has(card.filename))
            {
               // Indicate that this row has been colored.
               row._marked = true;

               row.eachCell((cell) =>
               {
                  // Orange - attention required.
                  // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
                  //
                  // cell.border = {
                  //    top:    { style: 'thin', color: { argb: 'FFCC8800' }},
                  //    bottom: { style: 'thin', color: { argb: 'FFCC8800' }},
                  // };

                  // Green - merge OK.
                  // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFCC' } };
                  //
                  // cell.border = {
                  //    top:    { style: 'thin', color: { argb: 'FF88AA55' }},
                  //    bottom: { style: 'thin', color: { argb: 'FF88AA55' }},
                  // };

                  // Red - Needs attention.
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } };

                  cell.border = {
                     top:    { style: 'thin', color: { argb: 'FFCC6666' }},
                     bottom: { style: 'thin', color: { argb: 'FFCC6666' }},
                  };
               });
            }

            // Embellish type separation by setting a colored border.
            if (byType && prevType !== card.type)
            {
               // Potentially, skip top border for first category.
               if (prevType !== void 0)
               {
                  row.eachCell((cell) =>
                  {
                     cell.border = { top: { style: 'thick', color: { argb: 'FFD6C6FF' } } };
                  });
               }

               prevType = card.type;
            }

            // Turn the link into a real hyperlink.
            const linkCell = row.getCell('Scryfall Link');
            if (linkCell.value)
            {
               linkCell.value = {
                  text: `Open ${card.name}`,
                  hyperlink: card.scryfall_uri
               };
               linkCell.font = { color: { argb: 'FF0000FF' }, underline: true };
            }

            if (typeof card.mana_cost === 'string' && card.mana_cost.length)
            {
               row.getCell('Mana Cost').note = ManaCostNote.translate(card.mana_cost)
            }
         }

         // Apply Arial + centered alignment rules.
         ws.eachRow({ includeEmpty: false }, (row) =>
         {
            row.eachCell({ includeEmpty: true }, (cell, colNumber) =>
            {
               cell.font = { name: 'Arial', size: 12 };

               // Name column stays left aligned, others center.
               const isNameColumn = colNumber === 1;
               cell.alignment = {
                  horizontal: isNameColumn ? 'left' : 'center',
                  vertical: 'middle'
               };

               cell.border = {
                  ...(cell.border ?? {}),
                  left:  { style: 'thin', color: { argb: 'FF999999' } },
                  right: { style: 'thin', color: { argb: 'FF999999' } }
               };
            });
         });

         // Bold headers.
         ws.getRow(1).font = { name: 'Arial', size: 13, bold: true };

         // Freeze first row.
         ws.views = [{ state: 'frozen', ySplit: 1 }];

         // Shade rows 2..N.
         ws.eachRow({ includeEmpty: false }, (row, rowNum) =>
         {
            if (typeof row._marked === 'boolean' && row._marked) { return; }   // Skip `marked` overrides.

            if (rowNum === 1) return; // skip header row

            if (rowNum % 2 === 0)
            {
               row.eachCell({ includeEmpty: true }, (cell) =>
               {
                  cell.fill = {
                     type: 'pattern',
                     pattern: 'solid',
                     fgColor: { argb: 'FFEFEFEF' } // light gray
                  };
               });
            }
         });

         // Auto size to actual content.
         this.#autosize(ws);
      }

      const outputPath = path.resolve(formatDirPath, `${format.name}-${rarity.name}.xlsx`);

      await wb.xlsx.writeFile(outputPath);
   }

   /**
    * Auto sizes sheet columns to contained content.
    *
    * @param {import('exceljs').Worksheet}   ws -
    */
   static #autosize(ws)
   {
      ws.columns.forEach((col) =>
      {
         let max = col.header.length;

         col.eachCell({ includeEmpty: true }, (cell) =>
         {
            if (!cell.value) return;

            let text;
            if (typeof cell.value === 'object' && cell.value.text)
            {
               text = cell.value.text; // hyperlink visible label.
            }
            else
            {
               text = String(cell.value);
            }

            max = Math.max(max, text.length);
         });

         col.width = Math.min(65, max + 6);
      });
   }
}
