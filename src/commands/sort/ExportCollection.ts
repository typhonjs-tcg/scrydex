import fs                  from 'node:fs';
import path                from 'node:path';

import { isDirectory }     from '@typhonjs-utils/file-util';
import Excel               from 'exceljs';

import { Notes }           from './Notes';
import { Theme }           from './Theme';

import {
   CardDBStore,
   CardFields,
   PrintCardFields,
   AbstractCollection }    from '#data';

import { capitalizeStr }   from '#util';

import type {
   Worksheet }             from 'exceljs';

import type {
   ConfigSort }            from '#types-command';

import type {
   SortedCategories }      from '#types-data';

/**
 * Export all `SortedFormat` instances as spreadsheets by rarity.
 */
export abstract class ExportCollection
{
   /**
    * Category kind to full name.
    */
   static #categoryNameFull = new Map([
      ['W', 'White'],
      ['U', 'Blue'],
      ['B', 'Black'],
      ['R', 'Red'],
      ['G', 'Green']
   ]);

   private constructor() {}

   static async generate(config: ConfigSort, collections: Iterable<AbstractCollection>): Promise<void>
   {
      for (const collection of collections)
      {
         if (collection.size > 0)
         {
            // Store spreadsheets in format subdirectories.
            const collectionDirPath = path.resolve(config.output, collection.dirpath);

            // Create collection subdirectory if it doesn't exist already.
            if (!isDirectory(collectionDirPath)) { fs.mkdirSync(collectionDirPath, { recursive: true }); }

            // Export collection cards to JSON DB.
            CardDBStore.save({
               filepath: path.resolve(collectionDirPath, `${collection.name}.json`),
               cards: collection.cards,
               meta: collection.meta
            });

            for (const [categoriesName, categories] of collection.entries())
            {
               if (categories.size > 0)
               {
                  await ExportCollection.#exportSpreadsheet(config, collection, categoriesName, categories,
                   collectionDirPath);
               }
            }
         }
      }
   }

   /**
    * @param config -
    *
    * @param collection -
    *
    * @param categoriesName -
    *
    * @param categories -
    *
    * @param collectionDirPath -
    */
   static async #exportSpreadsheet(config: ConfigSort, collection: AbstractCollection, categoriesName: string,
    categories: SortedCategories, collectionDirPath: string): Promise<void>
   {
      const wb = new Excel.Workbook();

      const byType = config.sortByType;

      const theme = Theme.get(config);

      for (const [categoryName, cards] of categories.entries())
      {
         if (cards.length <= 0) { continue; }

         const ws = wb.addWorksheet(categoryName);

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
            { header: 'Price USD', key: 'Price USD', width: 12, alignment: { horizontal: 'center' } },
            { header: 'Scryfall Link', key: 'Scryfall Link', width: 20, alignment: { horizontal: 'center' } }
         ];

         // Splice top row / sheet title -----------------------------------------------------------------------------

         ws.spliceRows(1, 0, []);

         const titleRow = ws.getRow(1);
         titleRow.fill = theme.row.fill.default;

         // Merge across all columns.
         ws.mergeCells(1, 1, 1, ws.columnCount);

         const titleCell = titleRow.getCell(1);

         titleRow.height = 22;
         titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

         titleCell.value = `${collection.printName} (${capitalizeStr(categoriesName)}) - ${
          this.#categoryNameFull.get(categoryName) ?? categoryName}`;

         // Card rows ------------------------------------------------------------------------------------------------

         let prevType: string | undefined = void 0;

         for (const card of cards)
         {
            const cardManaCost = CardFields.manaCost(card);

            const row = ws.addRow({
               Name: PrintCardFields.name(card),
               Quantity: Number(card.quantity),
               Filename: card.filename,
               Type: card.type,
               'Type Line': card.type_line,
               Set: card.set,
               'Set Name': card.set_name,
               'Collector #': card.collector_number,
               'Mana Cost': cardManaCost,
               CMC: card.cmc,
               Colors: PrintCardFields.colors(card),
               'Color Identity': card.color_identity?.join(', ') ?? '',
               'Price USD': card.price ?? '',
               'Scryfall Link': card.scryfall_uri
            });

            row.fill = theme.row.fill.default;

            // Potentially color / mark that the card is in a deck / outside main collection.
            if (collection.isCardGroup(card, 'decks'))
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               row.eachCell({ includeEmpty: true }, (cell) =>
               {
                  cell.fill = theme.mark.in_deck.fill;
                  cell.border = theme.mark.in_deck.border;
               });
            }

            // Potentially color / mark that the card is in an external group / outside main collection.
            if (collection.isCardGroup(card, 'external'))
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               row.eachCell({ includeEmpty: true }, (cell) =>
               {
                  cell.fill = theme.mark.in_external.fill;
                  cell.border = theme.mark.in_external.border;
               });
            }

            // Potentially mark merge status for marked filenames / cards.
            if (config.mark.has(card.filename) && typeof card.mark === 'string')
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               const mark = card.mark;

               row.eachCell({ includeEmpty: true }, (cell) =>
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
                  row.eachCell({ includeEmpty: true }, (cell) =>
                  {
                     cell.border = { ...(cell.border ?? {}), ...theme.sortByType.border }
                  });
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

            const cardStats = Notes.cardStats(card);
            if (cardStats) { row.getCell('Type').note = cardStats; }

            const oracleText = PrintCardFields.oracleText(card);
            if (oracleText) { row.getCell('Type Line').note = oracleText; }

            // Add natural language note for mana cost.
            if (cardManaCost.length) { row.getCell('Mana Cost').note = Notes.manaCost(card) }

            // Add note for foreign card name.
            if (CardFields.langCode(card) !== 'en') { row.getCell('Name').note = Notes.nameForeign(card); }
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
         titleCell.font = theme.fonts.title;
         titleCell.border = { ...theme.cell.border, ...theme.row.lastRow.border };

         const headerRow = ws.getRow(2);
         headerRow.fill = theme.row.fill.default;
         headerRow.font = theme.fonts.header;

         // Freeze header rows.
         ws.views = [{ state: 'frozen', ySplit: 2 }];

         // Shade rows 2..N.
         ws.eachRow({ includeEmpty: false }, (row, rowNum) =>
         {
            // Skip `marked` overrides.
            if (typeof (row as any)._marked === 'boolean' && (row as any)._marked) { return; }

            if (rowNum === 1 || rowNum === 2) { return; } // Skip header row.

            if (rowNum % 2 === 1)
            {
               row.eachCell({ includeEmpty: true }, (cell) => cell.fill = theme.row.fill.alternate);
            }
         });

         // Set last row bottom border to complete the table only when there already isn't a border defined.
         ws.lastRow?.eachCell({ includeEmpty: true }, (cell) =>
         {
            if (!cell.border.bottom)
            {
               cell.border = { ...cell.border, ...theme.row.lastRow.border };
            }
         });

         // Add additional dummy rows for theme expansion beyond table.
         for (let i = 0; i < 200; i++)
         {
            const row = ws.addRow({});
            row.fill = theme.row.fill.default;
         }

         // Auto size to actual content.
         this.#autosize(ws);
      }

      const outputPath = path.resolve(collectionDirPath, `${collection.name}-${categories.name}.xlsx`);

      await wb.xlsx.writeFile(outputPath);
   }

   // Internal Implementation ----------------------------------------------------------------------------------------

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

         // Centered columns receive more padding.
         const pad = col.header === 'Name' ? 3 : 6;

         let max = col?.header?.length ?? 0;

         col.eachCell({ includeEmpty: true }, (cell, rowNumber) =>
         {
            // Skip title row.
            if (rowNumber === 1) { return; }

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

         col.width = Math.min(75, max + pad);
      }
   }
}
