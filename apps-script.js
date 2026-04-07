// RE Portfolio Dashboard - Google Apps Script
// Paste this into Extensions > Apps Script in your Google Sheet

// New column layout (0-indexed):
// 0:Name 1:Address 2:APN 3:PurchaseDate 4:PurchasePrice 5:CurrentValue
// 6:CurrentEquity 7:LoanBalance 8:OrigLoan1 9:OrigLoan2 10:MonthlyMortgage
// 11:InterestRate 12:PropTaxRate 13:PropTaxAnnual 14:PropTaxMonthly
// 15:InsuranceMonthly 16:Repairs 17:PITIMonthly 18:MonthlyRent
// 19:AnnualRent 20:MonthlyCF 21:AnnualCF 22:DownPayment% 23:LTV%

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const propSheet = ss.getSheetByName('Properties');

  // Row 1 = title, Row 2 = headers, Rows 3-16 = data (0-indexed: rows 2-16)
  const allData = propSheet.getDataRange().getValues();

  const properties = [];
  for (let i = 3; i <= 16; i++) {
    const row = allData[i];
    if (!row || !row[0] || String(row[0]).trim().toUpperCase() === 'TOTALS') continue;

    const purchaseDate = row[3] instanceof Date
      ? Utilities.formatDate(row[3], 'UTC', 'yyyy-MM-dd')
      : String(row[3]);

    properties.push({
      id:        i - 2,
      name:      String(row[0]).trim(),
      address:   row[1]  || '',
      apn:       String(row[2] || ''),
      purchased: purchaseDate,
      price:     row[4]  || 0,
      value:     row[5]  || 0,
      equity:    row[6]  || 0,
      loan:      row[7]  || 0,
      rate:      parseFloat(((row[11] || 0) * 100).toFixed(4)),
      taxRate:   parseFloat(((row[12] || 0) * 100).toFixed(4)),
      repairs:   parseFloat(((row[16] || 0) * 100).toFixed(2)),
      rent:      row[18] || 0,
      piti:      Math.round((row[17] || 0) * 12),
      down:      parseFloat(((row[22] || 0) * 100).toFixed(2)),
    });
  }

  // Compute summary totals directly from Properties data (always in sync)
  const totalValue      = properties.reduce((s, p) => s + p.value, 0);
  const totalEquity     = properties.reduce((s, p) => s + p.equity, 0);
  const totalLoans      = properties.reduce((s, p) => s + p.loan, 0);
  const totalAnnualRent = properties.reduce((s, p) => s + p.rent * 12, 0);
  const totalPITI       = properties.reduce((s, p) => s + p.piti, 0);
  const totalAnnualInterest = properties.reduce((s, p) => s + p.loan * (p.rate / 100), 0);
  const totalITI        = Math.round(totalPITI - (totalLoans * 0.02)); // PITI minus est. principal
  const cashflowPITI    = totalAnnualRent - totalPITI;
  const cashflowITI     = totalAnnualRent - totalITI;

  const summary = {
    'Total Portfolio Value':   totalValue,
    'Total Equity':            totalEquity,
    'Total Loans':             totalLoans,
    'Total Annual Rent':       totalAnnualRent,
    'Total Annual PITI':       totalPITI,
    'Total Annual ITI':        totalITI,
    'Net Cash Flow (PITI)':    cashflowPITI,
    'Net Cash Flow (ITI)':     cashflowITI,
    'Portfolio Rate of Return': 23.35,
    'Overall Annual Profit':   639812,
  };

  // Read Other Assets tab (two columns: Name, Value)
  const otherSheet = ss.getSheetByName('Other Assets');
  const otherAssets = [];
  if (otherSheet) {
    const otherData = otherSheet.getDataRange().getValues();
    for (let i = 0; i < otherData.length; i++) {
      const row = otherData[i];
      const name = String(row[0] || '').trim();
      if (!name || name.toLowerCase() === 'name') continue;
      otherAssets.push({ name: name, value: parseFloat(row[1]) || 0 });
    }
  }

  const result = {
    lastUpdated:  new Date().toISOString(),
    properties:   properties,
    summary:      summary,
    otherAssets:  otherAssets,
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
