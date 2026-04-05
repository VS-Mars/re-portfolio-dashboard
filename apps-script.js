// RE Portfolio Dashboard - Google Apps Script
// Paste this into Extensions > Apps Script in your Google Sheet

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propSheet = ss.getSheetByName('Properties');
  const summarySheet = ss.getSheetByName('Portfolio Summary');

  // Read all property rows (row 4 to 17, 0-indexed: 3 to 16)
  const allData = propSheet.getDataRange().getValues();

  const properties = [];
  for (let i = 3; i <= 16; i++) {
    const row = allData[i];
    if (!row || !row[0]) continue;

    const purchaseDate = row[1] instanceof Date
      ? Utilities.formatDate(row[1], 'UTC', 'yyyy-MM-dd')
      : String(row[1]);

    properties.push({
      id:        i - 2,
      name:      row[0],
      purchased: purchaseDate,
      price:     row[2]  || 0,
      value:     row[3]  || 0,
      equity:    row[4]  || 0,
      loan:      row[5]  || 0,
      rate:      parseFloat(((row[6]  || 0) * 100).toFixed(4)),
      taxRate:   parseFloat(((row[7]  || 0) * 100).toFixed(4)),
      repairs:   parseFloat(((row[8]  || 0) * 100).toFixed(2)),
      rent:      row[9]  || 0,
      piti:      row[11] || 0,
      down:      parseFloat(((row[13] || 0) * 100).toFixed(2)),
      dwelling:  0  // add column P to sheet if needed
    });
  }

  // Read Portfolio Summary sheet (col A = label, col B = value, rows 3+)
  const sumData = summarySheet.getDataRange().getValues();
  const summary = {};
  for (let i = 2; i < sumData.length; i++) {
    const label = String(sumData[i][0]).trim();
    const value = sumData[i][1];
    if (label) summary[label] = value;
  }

  const result = {
    lastUpdated: new Date().toISOString(),
    properties:  properties,
    summary:     summary
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
