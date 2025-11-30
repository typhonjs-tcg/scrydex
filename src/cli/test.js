import fs from 'node:fs';

import XLSX from 'xlsx';

XLSX.set_fs(fs);

// workbook → ods-friendly XLSX output
const wb = XLSX.utils.book_new();

const ws = XLSX.utils.json_to_sheet([
   { Name: 'Counterspell', Qty: 4 },
   { Name: 'Counterspell', Qty: 2 }
]);

const ws2 = XLSX.utils.json_to_sheet([{ Name: 'Test', Qty: 4 }]);
XLSX.utils.book_append_sheet(wb, ws, 'Blue');
XLSX.utils.book_append_sheet(wb, ws, 'Test');

XLSX.writeFile(wb, './collection.xlsx');
