import path             from 'node:path';

import Excel            from 'exceljs';

import { ManaCostNote } from './ManaCostNote';
import { Theme }        from './Theme';

import type {
   Worksheet }          from 'exceljs';

import type {
   SortedFormat,
   SortedRarity }       from '#data';

import type {
   ConfigSort }         from '#types-command';

/**
 * Export all `SortedFormat` instances as spreadsheets by rarity.
 */
export class ExportSpreadsheet
{
   /**
    * @param config -
    *
    * @param format -
    *
    * @param rarity -
    *
    * @param formatDirPath -
    */
   static async exportFormatRarity(config: ConfigSort, format: SortedFormat, rarity: SortedRarity,
    formatDirPath: string): Promise<void>
   {
      const wb = new Excel.Workbook();

      const byType = config.sortByType;

      const theme = Theme.get(config);

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

         let prevType: string | undefined = void 0;

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

            row.fill = theme.row.fill.default;

            // Potentially mark merge status for marked filenames / cards.
            if (config.mark.has(card.filename) && typeof card.mark === 'string')
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               const mark = card.mark;

               row.eachCell((cell) =>
               {
                  cell.fill = theme.mark[mark].fill;
                  cell.border = theme.mark[mark].border;
               });
            }

            // Embellish type separation by setting a colored border.
            if (byType && prevType !== card.type)
            {
               // Potentially, skip top border for first category.
               if (prevType !== void 0)
               {
                  row.eachCell((cell) => cell.border = theme.sortByType.border);
               }

               prevType = card.type;
            }

            // Turn the link into a real hyperlink.
            const linkCell = row.getCell('Scryfall Link');
            if (linkCell.value)
            {
               linkCell.value = { text: `Open ${card.name}`, hyperlink: card.scryfall_uri };
               linkCell.font = theme.fonts.link;
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
               cell.font = theme.fonts.main;

               // Name column stays left aligned, others center.
               const isNameColumn = colNumber === 1;
               cell.alignment = { horizontal: isNameColumn ? 'left' : 'center', vertical: 'middle' };

               cell.border = {
                  ...(cell.border ?? {}),
                  ...theme.cell.border
               };
            });
         });

         // Bold headers.
         const headerRow = ws.getRow(1);
         headerRow.fill = theme.row.fill.default;
         headerRow.font = theme.fonts.header;

         // Freeze first row.
         ws.views = [{ state: 'frozen', ySplit: 1 }];

         // Shade rows 2..N.
         ws.eachRow({ includeEmpty: false }, (row, rowNum) =>
         {
            if (typeof (row as any)._marked === 'boolean' && (row as any)._marked) { return; }   // Skip `marked` overrides.

            if (rowNum === 1) { return; } // Skip header row.

            if (rowNum % 2 === 0)
            {
               row.eachCell({ includeEmpty: true }, (cell) => cell.fill = theme.row.fill.alternate);
            }
         });

         // Add additional dummy rows for theme expansion beyond table.
         if (config.theme === 'dark')
         {
            for (let i = 0; i < 200; i++)
            {
               const row = ws.addRow({});
               row.fill = theme.row.fill.default;
            }
         }

         // Auto size to actual content.
         this.#autosize(ws);
      }

      const outputPath = path.resolve(formatDirPath, `${format.name}-${rarity.name}.xlsx`);

      await wb.xlsx.writeFile(outputPath);
   }

   /**
    * Auto sizes sheet columns to contained content.
    *
    * @param ws -
    */
   static #autosize(ws: Worksheet)
   {
      for (const col of ws.columns)
      {
         if (!col || !col.eachCell) { continue; }

         let max = col?.header?.length ?? 0;

         col.eachCell({ includeEmpty: true }, (cell) =>
         {
            if (!cell.value) { return; }

            let text;
            if (typeof cell.value === 'object' && (cell.value as Excel.Cell).text)
            {
               text = (cell.value as Excel.Cell).text; // hyperlink visible label.
            }
            else
            {
               text = String(cell.value);
            }

            max = Math.max(max, text.length);
         });

         col.width = Math.min(65, max + 6);
      }
   }
}
