#!/usr/bin/env node

/**
 * Script to convert expense and income CSV files to finance app restore format
 * 
 * Usage: node convert-to-restore-csv.js
 * 
 * Input files:
 * - external migrations/Life Expenses - all_entry.csv (expenses)
 * - external migrations/Life Expenses - income_sheet.csv (incomes)
 * 
 * Output:
 * - external migrations/restore.csv
 */

const fs = require('fs');
const path = require('path');

const log = (message = '') => process.stdout.write(`${message}\n`);

// CSV headers expected by the finance app
const CSV_HEADERS = [
  'profile',
  'occurred_at',
  'amount_minor',
  'currency',
  'type',
  'tags',
  'note',
  'created_at',
  'updated_at',
];

/**
 * Parse date from various formats:
 * - "19 April 2024"
 * - "25 Dec 2023"
 * - "11/22/2025"
 * - "11/14/2023 8:57:45"
 */
function parseDate(dateStr) {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  const trimmed = dateStr.trim();

  // Try format: "11/22/2025" or "11/14/2023 8:57:45"
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/;
  const match1 = trimmed.match(mmddyyyy);
  if (match1) {
    const [, month, day, year, hour, minute, second] = match1;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hour ? parseInt(hour, 10) : 0,
      minute ? parseInt(minute, 10) : 0,
      second ? parseInt(second, 10) : 0
    );
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try format: "19 April 2024" or "25 Dec 2023"
  const ddmmyyyy = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/;
  const match2 = trimmed.match(ddmmyyyy);
  if (match2) {
    const [, day, monthName, year] = match2;
    const monthMap = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    const monthKey = monthName.toLowerCase();
    const month = monthMap[monthKey];
    if (month !== undefined) {
      const date = new Date(
        parseInt(year, 10),
        month,
        parseInt(day, 10)
      );
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Try standard Date parsing as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

/**
 * Convert amount to minor units (cents)
 */
function toMinorUnits(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return 0;
  }
  return Math.round(num * 100);
}

/**
 * Escape CSV value
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  const needsQuotes = /[",\r\n]/.test(str);
  if (!needsQuotes) {
    return str;
  }

  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Parse CSV line handling quoted values
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Read and parse expense CSV
 */
function parseExpenseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return { rows: [], failedDates: [] };
  }

  // Skip header line
  const rows = [];
  const failedDates = [];
  
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCsvLine(lines[i]);
    
    if (columns.length < 4) {
      continue;
    }

    const dateStr = columns[0]?.trim();
    const description = columns[1]?.trim() || '';
    const type = columns[2]?.trim() || '';
    const cost = columns[3]?.trim();
    const timestampStr = columns[4]?.trim();

    if (!dateStr || !cost) {
      continue;
    }

    const occurredAt = parseDate(dateStr);
    const createdAt = timestampStr ? parseDate(timestampStr) : occurredAt;
    const updatedAt = createdAt || occurredAt;

    if (!occurredAt) {
      failedDates.push({
        row: i + 1,
        dateStr: dateStr,
        description: description,
      });
      continue;
    }

    const amountMinor = toMinorUnits(cost);
    if (amountMinor === 0) {
      continue; // Skip zero amounts
    }

    rows.push({
      profile: 'Personal',
      occurredAt,
      amountMinor,
      currency: 'USD',
      type: 'expense',
      tags: type || 'uncategorized',
      note: description,
      createdAt: createdAt || occurredAt,
      updatedAt: updatedAt || occurredAt,
    });
  }

  return { rows, failedDates };
}

/**
 * Read and parse income CSV
 */
function parseIncomeCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return { rows: [], failedDates: [] };
  }

  // Skip header line
  const rows = [];
  const failedDates = [];
  
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCsvLine(lines[i]);
    
    if (columns.length < 4) {
      continue;
    }

    const timeStr = columns[0]?.trim();
    const description = columns[1]?.trim() || '';
    const type = columns[2]?.trim() || '';
    const amount = columns[3]?.trim();

    if (!timeStr || !amount) {
      continue;
    }

    const occurredAt = parseDate(timeStr);
    if (!occurredAt) {
      failedDates.push({
        row: i + 1,
        dateStr: timeStr,
        description: description,
      });
      continue;
    }

    const amountMinor = toMinorUnits(amount);
    if (amountMinor === 0) {
      continue; // Skip zero amounts
    }

    rows.push({
      profile: 'Personal',
      occurredAt,
      amountMinor,
      currency: 'USD',
      type: 'income',
      tags: type || 'uncategorized',
      note: description,
      createdAt: occurredAt,
      updatedAt: occurredAt,
    });
  }

  return { rows, failedDates };
}

/**
 * Convert transaction to CSV row
 */
function transactionToCsvRow(transaction) {
  const tags = transaction.tags || 'uncategorized';
  const note = transaction.note || '';

  const columns = [
    transaction.profile,
    transaction.occurredAt.toISOString(),
    transaction.amountMinor.toString(),
    transaction.currency,
    transaction.type,
    tags,
    note,
    transaction.createdAt.toISOString(),
    transaction.updatedAt.toISOString(),
  ];

  return columns.map(escapeCsvValue).join(',');
}

/**
 * Main function
 */
function main() {
  const baseDir = path.join(__dirname);
  const expenseFile = path.join(baseDir, 'Life Expenses - all_entry.csv');
  const incomeFile = path.join(baseDir, 'Life Expenses - income_sheet.csv');
  const outputFile = path.join(baseDir, 'restore.csv');

  log('Reading expense CSV...');
  const expenseResult = parseExpenseCsv(expenseFile);
  const expenses = expenseResult.rows;
  const expenseFailedDates = expenseResult.failedDates;
  log(`Parsed ${expenses.length} expenses`);

  log('Reading income CSV...');
  const incomeResult = parseIncomeCsv(incomeFile);
  const incomes = incomeResult.rows;
  const incomeFailedDates = incomeResult.failedDates;
  log(`Parsed ${incomes.length} incomes`);

  // Combine and sort by date
  const allTransactions = [...expenses, ...incomes].sort((a, b) => {
    return a.occurredAt.getTime() - b.occurredAt.getTime();
  });

  log(`Total transactions: ${allTransactions.length}`);

  // Generate CSV
  const csvRows = [
    CSV_HEADERS.join(','),
    ...allTransactions.map(transactionToCsvRow),
  ];

  const csv = csvRows.join('\n');

  // Write output
  fs.writeFileSync(outputFile, csv, 'utf-8');
  
  // Report results
  log(`\n✅ Successfully created restore CSV: ${outputFile}`);
  log(`   Total transactions: ${allTransactions.length}`);
  log(`   Expenses: ${expenses.length}`);
  log(`   Incomes: ${incomes.length}`);
  
  // Report failed date parsing
  const totalFailedDates = expenseFailedDates.length + incomeFailedDates.length;
  log(`\n📊 Date Parsing Summary:`);
  log(`   Failed to parse dates: ${totalFailedDates}`);
  log(`   - From expenses: ${expenseFailedDates.length}`);
  log(`   - From incomes: ${incomeFailedDates.length}`);
  
  if (totalFailedDates > 0) {
    log(`\n⚠️  Dates that could not be parsed:\n`);
    
    if (expenseFailedDates.length > 0) {
      log(`   Expenses (${expenseFailedDates.length}):`);
      expenseFailedDates.forEach(({ row, dateStr, description }) => {
        log(`     Row ${row}: "${dateStr}" (${description || 'no description'})`);
      });
    }
    
    if (incomeFailedDates.length > 0) {
      log(`   Incomes (${incomeFailedDates.length}):`);
      incomeFailedDates.forEach(({ row, dateStr, description }) => {
        log(`     Row ${row}: "${dateStr}" (${description || 'no description'})`);
      });
    }
  } else {
    log(`   ✅ All dates parsed successfully!`);
  }
}

// Run the script
main();

