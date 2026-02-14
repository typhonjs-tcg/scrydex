import Excel               from 'exceljs';

import { CardDB }          from '#scrydex/data/db';
import { BasicCollection } from '#scrydex/data/sort/basic';
import { capitalizeStr }   from '#scrydex/util';

import { Notes }           from './Notes';
import { Theme }           from './Theme';

import type {
   Worksheet }             from 'exceljs';

import type {
   AbstractCollection,
   SortedCategory }      from '#scrydex/data/sort';

/**
 * Provides Excel / spreadsheet exports of {@link AbstractCollection} card collections.
 */
export abstract class ExportExcel
{
   private constructor() {}

   static async cardDB({ db, theme, sortByKind, sortByType, rarity }: { db: CardDB.Stream.Reader,
    theme: 'dark' | 'light', rarity?: boolean, sortByKind?: boolean, sortByType?: boolean }):
     Promise<Excel.Workbook | undefined>
   {
      return ExportExcel.cards({
         cards: db.getAll(),
         meta: db.meta,
         theme,
         rarity,
         sortByKind,
         sortByType
      })
   }

   static async cards({ cards, meta, theme, name, sortByKind, sortByType, rarity }: { cards: CardDB.Data.Card[],
    meta: CardDB.File.MetadataBase, theme: 'dark' | 'light', name?: string, rarity?: boolean, sortByKind?: boolean,
     sortByType?: boolean }): Promise<Excel.Workbook | undefined>
   {
      const collection = new BasicCollection({
         cards,
         dirpath: '',
         name: name ? name : 'Cards',
         sourceMeta: meta,
         sortByKind
      });

      collection.sort({ alpha: true, type: sortByType });

      const category = collection.get('all');

      return category ? ExportExcel.collectionCategory({ collection, category, theme }) : void 0;
   }

   /**
    * Creates Excel / spreadsheet workbooks for all categories in a collection.
    *
    * @param options - Options.
    *
    * @param options.collection - The collection being exported.
    *
    * @param options.theme - Theme name.
    *
    * @returns Excel workbooks for each non-empty category indexed by category name.
    */
   static async collection({ collection, theme }: { collection: AbstractCollection, theme: 'dark' | 'light' }):
    Promise<Map<string, Excel.Workbook>>
   {
      const result: Map<string, Excel.Workbook> = new Map();

      for (const category of collection.values())
      {
         if (category.size > 0)
         {
            const workbook = await ExportExcel.collectionCategory({
               collection,
               category,
               theme
            });

            result.set(category.name, workbook);
         }
      }

      return result;
   }

   /**
    * Creates an Excel / spreadsheet workbook for a specific collection category.
    *
    * @param options - Options.
    *
    * @param options.collection - The collection being exported.
    *
    * @param options.category - Specific category to export.
    *
    * @param options.theme - Theme name.
    *
    * @returns An Excel workbook.
    */
   static async collectionCategory({ collection, category, theme }:
    { collection: AbstractCollection, category: SortedCategory, theme: 'dark' | 'light' }):
     Promise<Excel.Workbook>
   {
      const wb = new Excel.Workbook();

      const themeData = Theme.get(theme);

      const mergeMark = collection.mergeMark;
      const sortByType = collection.getSortOptions()?.type;

      for (const section of category.values())
      {
         if (section.cards.length <= 0) { continue; }

         const ws = wb.addWorksheet(section.nameShort);

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
         titleRow.fill = themeData.row.fill.default;

         // Merge across all columns.
         ws.mergeCells(1, 1, 1, ws.columnCount);

         const titleCell = titleRow.getCell(1);

         titleRow.height = 22;
         titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

         titleCell.value = `${collection.printName} (${capitalizeStr(category.name)}) - ${section.nameFull}`;

         // Card rows ------------------------------------------------------------------------------------------------

         let prevType: string | undefined = void 0;

         for (const card of section.cards)
         {
            const cardManaCost = CardDB.CardFields.manaCost(card);

            const row = ws.addRow({
               Name: CardDB.PrintCardFields.name(card),
               Quantity: Number(card.quantity),
               Filename: card.filename,
               Type: card.norm_type,
               'Type Line': card.type_line,
               Set: card.set,
               'Set Name': card.set_name,
               'Collector #': card.collector_number,
               'Mana Cost': cardManaCost,
               CMC: card.cmc,
               Colors: CardDB.PrintCardFields.colors(card),
               'Color Identity': card.color_identity?.join(', ') ?? '',
               'Price USD': card.price ?? '',
               'Scryfall Link': card.scryfall_uri
            });

            row.fill = themeData.row.fill.default;

            // Potentially color / fill if that the card is an external group.
            const groupName = collection.getCardGroup(card);
            if (groupName)
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               row.eachCell({ includeEmpty: true }, (cell) =>
               {
                  cell.fill = themeData.groups[groupName].fill;
                  cell.border = themeData.groups[groupName].border;
               });

               row.getCell('Filename').note = `Group: ${groupName}`;
            }

            // Potentially mark merge status for marked filenames / cards.
            if (mergeMark?.has(card.filename) && typeof card.mark === 'string')
            {
               // Indicate that this row has been colored.
               (row as any)._marked = true;

               const mark = card.mark;

               row.eachCell({ includeEmpty: true }, (cell) =>
               {
                  cell.fill = themeData.mark[mark].fill;
                  cell.border = themeData.mark[mark].border;
               });
            }

            // Embellish type separation by setting a colored border.
            if (sortByType && prevType !== card.norm_type)
            {
               // Potentially, skip top border for first category.
               if (prevType !== void 0)
               {
                  row.eachCell({ includeEmpty: true }, (cell) =>
                  {
                     cell.border = { ...(cell.border ?? {}), ...themeData.sortByType.border }
                  });
               }

               prevType = card.norm_type;
            }

            // Turn the link into a real hyperlink.
            const linkCell = row.getCell('Scryfall Link');
            if (linkCell.value)
            {
               linkCell.value = { text: `Open ${card.name}`, hyperlink: card.scryfall_uri };
               linkCell.font = themeData.fonts.link;
            }

            const cardStats = Notes.cardStats(card);
            if (cardStats) { row.getCell('Type').note = cardStats; }

            const oracleText = CardDB.PrintCardFields.oracleText(card);
            if (oracleText) { row.getCell('Type Line').note = oracleText; }

            // Add natural language note for mana cost.
            if (cardManaCost.length) { row.getCell('Mana Cost').note = Notes.manaCost(card) }

            // Add note for foreign card name.
            if (CardDB.CardFields.langCode(card) !== 'en') { row.getCell('Name').note = Notes.nameForeign(card); }
         }

         // Apply Arial + centered alignment rules.
         ws.eachRow({ includeEmpty: false }, (row) =>
         {
            row.eachCell({ includeEmpty: true }, (cell, colNumber) =>
            {
               cell.font = themeData.fonts.main;

               // Name column stays left aligned, others center.
               const isNameColumn = colNumber === 1;
               cell.alignment = { horizontal: isNameColumn ? 'left' : 'center', vertical: 'middle' };

               cell.border = {
                  ...(cell.border ?? {}),
                  ...themeData.cell.border
               };
            });
         });

         // Bold headers.
         titleCell.font = themeData.fonts.title;
         titleCell.border = { ...themeData.cell.border, ...themeData.row.lastRow.border };

         const headerRow = ws.getRow(2);
         headerRow.fill = themeData.row.fill.default;
         headerRow.font = themeData.fonts.header;

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
               row.eachCell({ includeEmpty: true }, (cell) => cell.fill = themeData.row.fill.alternate);
            }
         });

         // Set last row bottom border to complete the table only when there already isn't a border defined.
         ws.lastRow?.eachCell({ includeEmpty: true }, (cell) =>
         {
            if (!cell.border.bottom)
            {
               cell.border = { ...cell.border, ...themeData.row.lastRow.border };
            }
         });

         // Add additional dummy rows for theme expansion beyond table.
         for (let i = 0; i < 200; i++)
         {
            const row = ws.addRow({});
            row.fill = themeData.row.fill.default;
         }

         // Auto size to actual content.
         this.#autosize(ws);
      }

      return wb;
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
