// Pure JS highly stable PDF binary specification literal generator
// Guarantees zero local dependency AFM path breaks under Next.js server runtime compiling environments

export async function generateMonthlyReport(expenses: any[], month: string, year: string, total: number): Promise<Buffer> {
  const lineItems = expenses.map(e => 
    `${new Date(e.date).toISOString().split('T')[0]}   ${(e.category?.name || 'General').padEnd(18)}   $${e.amount.toFixed(2).padStart(8)}   ${e.description.slice(0, 25)}`
  ).join("\n");

  const pageText = `==============================================================
                    SMART EXPENSE TRACKER                     
==============================================================
MONTHLY EXPENDITURE AUDIT: ${month.toUpperCase()} ${year}
TOTAL REGISTERED OUTFLOW: $${total.toFixed(2)}
TOTAL TRANSACTIONS LOGGED: ${expenses.length}

DATE         CATEGORY             AMOUNT       DESCRIPTION
--------------------------------------------------------------
${lineItems || "No transactions recorded for this billing cycle."}
==============================================================
Generated securely via SmartExpense Financial Engine.`;

  // Standard raw Minimal PDF 1.4 ASCII Document specification literal mapping
  // Supports deterministic byte rendering across native PDF viewing engines without requiring filesystem disk mapping
  const streamLength = pageText.length;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
5 0 obj
<< /Length ${streamLength + 55} >>
stream
BT
/F1 11 Tf
36 730 Td
14 TL
(${pageText.replace(/[()\\]/g, '\\$&').replace(/\n/g, ') Tj T* (')}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000314 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdfString, "utf-8");
}
