import { getCurrencyInfo } from '@/lib/currency-utils';

export type ExcelRow = {
  date: Date;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number; // always positive; sign is applied on export
  createdBy?: string;
};

export type ExcelLabels = {
  date: string;
  description: string;
  category: string;
  type: string;
  amount: string;
  createdBy: string;
  income: string;
  expense: string;
  totalIncome: string;
  totalExpenses: string;
  balance: string;
};

// Excel number format for a currency, mirroring the app's symbol placement.
function currencyNumFmt(currencyCode: string): string {
  const { symbol } = getCurrencyInfo(currencyCode);
  const symbolBefore = ['$', '£', 'C$'].includes(symbol);
  const sym = `"${symbol}"`;
  return symbolBefore ? `${sym}#,##0.00;${sym}-#,##0.00` : `#,##0.00 ${sym};-#,##0.00 ${sym}`;
}

const HEADER_FILL = 'FF0F172A'; // slate-900
const INCOME_COLOR = 'FF16A34A'; // green-600
const EXPENSE_COLOR = 'FFDC2626'; // red-600

export async function downloadMonthExcel(opts: {
  filename: string;
  sheetName: string;
  rows: ExcelRow[];
  labels: ExcelLabels;
  currencyCode: string;
  includeCreatedBy: boolean;
}): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const { filename, sheetName, rows, labels, currencyCode, includeCreatedBy } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Meffin';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const columns = [
    { header: labels.date, key: 'date', width: 14 },
    { header: labels.description, key: 'description', width: 34 },
    { header: labels.category, key: 'category', width: 20 },
    { header: labels.type, key: 'type', width: 12 },
    { header: labels.amount, key: 'amount', width: 16 },
  ];
  if (includeCreatedBy) columns.push({ header: labels.createdBy, key: 'createdBy', width: 18 });
  ws.columns = columns;

  const numFmt = currencyNumFmt(currencyCode);

  // Header styling
  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle' };
  });

  // Data rows
  for (const r of rows) {
    const signedAmount = r.type === 'income' ? r.amount : -r.amount;
    const row = ws.addRow({
      date: r.date,
      description: r.description,
      category: r.category,
      type: r.type === 'income' ? labels.income : labels.expense,
      amount: signedAmount,
      ...(includeCreatedBy ? { createdBy: r.createdBy ?? '' } : {}),
    });

    row.getCell('date').numFmt = 'dd/mm/yyyy';
    const amountCell = row.getCell('amount');
    amountCell.numFmt = numFmt;

    const color = r.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR;
    amountCell.font = { color: { argb: color } };
    row.getCell('type').font = { color: { argb: color } };
  }

  // Totals block
  const incomeTotal = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const expenseTotal = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const balance = incomeTotal - expenseTotal;

  ws.addRow({});

  const addTotal = (label: string, value: number, color?: string) => {
    const row = ws.addRow({ date: label, amount: value });
    ws.mergeCells(`A${row.number}:D${row.number}`);
    const labelCell = row.getCell(1);
    labelCell.font = { bold: true };
    labelCell.alignment = { horizontal: 'right' };
    const valueCell = row.getCell(5);
    valueCell.numFmt = numFmt;
    valueCell.font = { bold: true, ...(color ? { color: { argb: color } } : {}) };
    return row;
  };

  addTotal(labels.totalIncome, incomeTotal, INCOME_COLOR);
  addTotal(labels.totalExpenses, -expenseTotal, EXPENSE_COLOR);
  addTotal(labels.balance, balance, balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
