const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak
} = require('docx');
const fs = require('fs');

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  indigo:     '3730A3', indigoDark: '1E1B4B', indigoLight: 'E0E7FF',
  violet:     '6D28D9', violetBg:   'EDE9FE',
  blue:       '1D4ED8', blueDark:   '1E3A8A', blueLight:   'DBEAFE',
  teal:       '0F766E', tealBg:     'CCFBF1',
  green:      '065F46', greenBg:    'D1FAE5', greenAcc:    '059669',
  amber:      '92400E', amberBg:    'FEF3C7', amberAcc:    'D97706',
  rose:       '9F1239', roseBg:     'FFE4E6', roseAcc:     'F43F5E',
  sky:        '075985', skyBg:      'E0F2FE', skyAcc:      '0EA5E9',
  orange:     '9A3412', orangeBg:   'FFEDD5', orangeAcc:   'EA580C',
  slate:      '334155', slateLight: 'F8FAFC', muted:       '64748B',
  dark:       '0F172A', white:      'FFFFFF',
  gray100:    'F1F5F9', gray200:    'E2E8F0', gray700:     '374151',
};

// ── Border helpers ────────────────────────────────────────────────────────────
const bd  = (col = C.gray200) => ({ style: BorderStyle.SINGLE, size: 1, color: col });
const bda = (col = C.gray200) => ({ top: bd(col), bottom: bd(col), left: bd(col), right: bd(col) });
const nb  = ()                 => ({ style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' });
const nba = ()                 => ({ top: nb(), bottom: nb(), left: nb(), right: nb() });

// ── Text helpers ──────────────────────────────────────────────────────────────
const tx = (text, o = {}) => new TextRun({
  text,
  font:    o.mono ? 'Courier New' : 'Arial',
  size:    o.size  || 22,
  color:   o.color || C.dark,
  bold:    !!o.bold,
  italics: !!o.italic,
});

const pg = (kids, o = {}) => new Paragraph({
  alignment: o.align  || AlignmentType.LEFT,
  spacing:   { before: o.before || 0, after: o.after !== undefined ? o.after : 100 },
  shading:   o.fill   ? { fill: o.fill, type: ShadingType.CLEAR } : undefined,
  border:    o.bBot   ? { bottom: { style: BorderStyle.SINGLE, size: o.bBot.sz || 8, color: o.bBot.col, space: 4 } } : undefined,
  children:  Array.isArray(kids) ? kids : [kids],
});

const blank = (a = 80) => pg([tx('')], { after: a });

// headings
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.indigo, space: 6 } },
  children: [tx(t, { size: 34, bold: true, color: C.indigoDark })] });

const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 120 },
  children: [tx(t, { size: 27, bold: true, color: C.blue })] });

const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 },
  children: [tx(t, { size: 23, bold: true, color: C.slate })] });

const body = (t, o = {}) => pg([tx(t, { color: C.slate, ...o })], { after: 100 });

// bullet list
const buls = (items, lv = 0) => items.map(item =>
  new Paragraph({
    numbering: { reference: 'bullets', level: lv },
    spacing:   { after: 80 },
    indent:    { left: lv === 0 ? 720 : 1080, hanging: 360 },
    children:  Array.isArray(item) ? item : [tx(item, { color: C.slate })],
  })
);

// numbered list
const nums = items => items.map(item =>
  new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing:   { after: 80 },
    indent:    { left: 720, hanging: 360 },
    children:  Array.isArray(item) ? item : [tx(item, { color: C.slate })],
  })
);

// code block
const code = lines => [
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: bda(C.gray700), shading: { fill: '1E293B', type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 220, right: 220 },
      width: { size: 9360, type: WidthType.DXA },
      children: lines.map(l => pg([tx(l, { mono: true, size: 18, color: '94A3B8' })], { after: 36 }))
    })]})],
  }),
  blank(120),
];

// callout box
const callout = (title, items, accent, bg) => [
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: { ...nba(), left: { style: BorderStyle.SINGLE, size: 18, color: accent } },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 260, right: 200 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        pg([tx(title, { bold: true, color: accent, size: 21 })], { after: 80 }),
        ...items.map(i => new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 60 }, indent: { left: 720, hanging: 360 },
          children: [tx(i, { color: C.slate, size: 20 })],
        }))
      ]
    })]})],
  }),
  blank(120),
];

// priority table
const mkTable = (headers, colWidths, rows, hdrBg = C.indigo) => {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const hRow = new TableRow({ children: headers.map((h, i) => new TableCell({
    borders: bda(C.gray200), shading: { fill: hdrBg, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    width: { size: colWidths[i], type: WidthType.DXA },
    children: [pg([tx(h, { bold: true, color: C.white, size: 20 })], { after: 0 })]
  })) });
  const dRows = rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => new TableCell({
    borders: bda(C.gray200), shading: { fill: ri % 2 === 0 ? C.white : C.slateLight, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    width: { size: colWidths[ci], type: WidthType.DXA },
    children: [pg([tx(cell, { size: 20, color: C.slate })], { after: 0 })]
  })) }));
  return [new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: colWidths, rows: [hRow, ...dRows] }), blank(140)];
};

// feature banner
const banner = (num, emoji, title, tag, accent) => [
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: nba(), shading: { fill: accent, type: ShadingType.CLEAR },
      margins: { top: 180, bottom: 180, left: 320, right: 320 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        pg([tx(`FEATURE ${num}`, { size: 17, bold: true, color: 'C7D2FE' })], { align: AlignmentType.CENTER, after: 40 }),
        pg([tx(`${emoji}  ${title}`, { size: 34, bold: true, color: C.white })], { align: AlignmentType.CENTER, after: 40 }),
        pg([tx(tag, { size: 19, italic: true, color: 'A5B4FC' })], { align: AlignmentType.CENTER, after: 0 }),
      ]
    })]})],
  }),
  blank(120),
];

// 2-col info grid
const infoGrid = (pairs) => {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const mkCell = (p) => p ? new TableCell({
      borders: { ...bda(p.accent) },
      shading: { fill: p.bg, type: ShadingType.CLEAR },
      margins: { top: 130, bottom: 130, left: 180, right: 180 },
      width: { size: 4600, type: WidthType.DXA },
      children: [
        pg([tx(p.label, { bold: true, color: p.accent, size: 20 })], { after: 60 }),
        pg([tx(p.body, { color: C.slate, size: 19 })], { after: 0 }),
      ]
    }) : new TableCell({
      borders: nba(), width: { size: 4600, type: WidthType.DXA },
      shading: { fill: C.white, type: ShadingType.CLEAR },
      children: [blank()]
    });
    rows.push(new TableRow({ children: [mkCell(pairs[i]), mkCell(pairs[i+1] || null)] }));
  }
  return [new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4600, 4760], rows }), blank(120)];
};

// ── Document accumulator ──────────────────────────────────────────────────────
const kids = [];
const add = (...items) => items.forEach(i => Array.isArray(i) ? i.forEach(x => kids.push(x)) : kids.push(i));

// ══════════════════════════════════════════════════════════════════════════════
//  COVER
// ══════════════════════════════════════════════════════════════════════════════
add(
  blank(1000),
  pg([tx('ANTIGRAVITY — PROJECT BRIEF', { size: 19, bold: true, color: C.muted })], { align: AlignmentType.CENTER, after: 60 }),
  pg([tx('Smart Expense Tracker', { size: 66, bold: true, color: C.indigo })], { align: AlignmentType.CENTER, after: 60 }),
  pg([tx('AI Insights Edition 2026', { size: 42, bold: true, color: C.dark })], { align: AlignmentType.CENTER, after: 120 }),
  pg([tx('Complete Feature Upgrade Specification  —  23 Features Across 7 Categories', { size: 24, italic: true, color: C.muted })], { align: AlignmentType.CENTER, after: 200 }),
  pg([tx('')], { bBot: { col: C.indigo, sz: 8 }, after: 200 }),
  pg([tx('This document is the single input you hand to your developer / AI agent.', { size: 22, color: C.slate, italic: true })], { align: AlignmentType.CENTER, after: 80 }),
  pg([tx('Every feature is fully specified: tech stack, implementation steps, data models, API routes, and UI requirements.', { size: 22, color: C.slate, italic: true })], { align: AlignmentType.CENTER, after: 60 }),
  blank(800),
  pg([tx('Prepared for Antigravity  |  Version 1.0  |  2026', { size: 20, color: C.muted, italic: true })], { align: AlignmentType.CENTER, after: 0 }),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  MASTER OVERVIEW TABLE
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Master Feature List — All 23 Upgrades'),
  blank(60),
  body('The table below is the authoritative list. Features are grouped by category and marked with effort estimates so the developer can plan sprints correctly.'),
  blank(80),
  ...mkTable(
    ['#', 'Feature', 'Category', 'Effort', 'Priority'],
    [400, 3200, 1800, 900, 1060],
    [
      ['1',  'AI Expense Insights',              'AI / Analytics',    '3 days',  'P0 — Critical'],
      ['2',  'Smart Budget Recommendations',     'AI / Analytics',    '2 days',  'P0 — Critical'],
      ['3',  'Receipt Scanner (OCR)',            'AI / Input',        '3 days',  'P0 — Critical'],
      ['4',  'Voice Expense Entry',              'AI / Input',        '2 days',  'P1 — High'],
      ['5',  'Financial Health Score',           'Analytics',         '2 days',  'P1 — High'],
      ['6',  'Future Expense Prediction',        'AI / Analytics',    '4 days',  'P1 — High'],
      ['7',  'Subscription Detection',           'Analytics',         '2 days',  'P1 — High'],
      ['8',  'Smart Alerts',                     'Notifications',     '2 days',  'P1 — High'],
      ['9',  'Dark Mode + Themes',               'UI / UX',           '1 day',   'P1 — High'],
      ['10', 'Interactive Charts (Advanced)',    'UI / UX',           '3 days',  'P1 — High'],
      ['11', 'Financial Calendar',               'UI / UX',           '2 days',  'P2 — Medium'],
      ['12', 'Multi-Currency Support',           'Real-World',        '2 days',  'P2 — Medium'],
      ['13', 'Split Expenses with Friends',      'Real-World',        '4 days',  'P2 — Medium'],
      ['14', 'Savings Goals',                    'Real-World',        '2 days',  'P2 — Medium'],
      ['15', 'Bill Reminder System',             'Real-World',        '2 days',  'P2 — Medium'],
      ['16', 'Achievements & Badges',            'Gamification',      '2 days',  'P2 — Medium'],
      ['17', 'Weekly Challenges',                'Gamification',      '2 days',  'P3 — Low'],
      ['18', 'Bank SMS Auto-Detection',          'Advanced',          '4 days',  'P3 — Low'],
      ['19', 'AI Chatbot Financial Assistant',   'Advanced / AI',     '4 days',  'P2 — Medium'],
      ['20', 'Export Professional Reports',      'Reports',           '2 days',  'P1 — High'],
      ['21', 'Authentication & Security',        'Tech / Infra',      '2 days',  'P0 — Critical'],
      ['22', 'Real-Time Sync',                   'Tech / Infra',      '3 days',  'P2 — Medium'],
      ['23', 'Progressive Web App (PWA)',        'Tech / Infra',      '1 day',   'P2 — Medium'],
    ],
    C.indigoDark
  ),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 1 — AI EXPENSE INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(1, '🤖', 'AI Expense Insights', 'Category: AI / Analytics  |  Effort: 3 days  |  Priority: P0', C.indigoDark),
  h2('What It Does'),
  body('Analyze the user\'s past expenses and generate natural-language smart insights automatically. Insights are refreshed monthly and on-demand.'),
  blank(40),
  h2('Example Outputs'),
  ...code([
    '"You spent 42% more on Food this month compared to last month."',
    '"Weekend spending is unusually high — ₹4,200 vs ₹1,800 on weekdays."',
    '"You can save ₹3,000/month by reducing dining expenses by 30%."',
    '"Your highest single expense this month: ₹8,500 at Amazon on 14 May."',
  ]),
  h2('Tech Stack for This Feature'),
  ...buls(['Google Gemini 1.5 Flash (free tier) — primary AI model', 'BullMQ + Redis — async job queue so AI calls never block the UI', 'Prisma — aggregate queries to prepare spending data before sending to AI']),
  blank(60),
  h2('Implementation Steps'),
  ...nums([
    'Create a data preparation function: query Prisma for the current and previous month totals grouped by category',
    'Build a structured prompt template that injects the spending data as JSON into the Gemini call',
    'Set response_mime_type: "application/json" and specify a schema: { insights: string[] }',
    'Enqueue the AI call as a BullMQ job; store the result in an AIInsight table with userId + month + year',
    'Expose GET /api/ai/insights?month=5&year=2026 — returns cached result or triggers a fresh job',
    'Add a "Refresh Insights" button on the dashboard; poll for job completion every 3 seconds',
    'Display insights as animated cards with an icon per type (savings, warning, neutral)',
  ]),
  blank(60),
  h2('Database Change — New Table'),
  ...code([
    'model AIInsight {',
    '  id        String   @id @default(cuid())',
    '  userId    String',
    '  month     Int',
    '  year      Int',
    '  insights  Json     // string[]',
    '  createdAt DateTime @default(now())',
    '  @@unique([userId, month, year])',
    '}',
  ]),
  h2('UI Specification'),
  ...buls(['Dashboard widget: "AI Insights" card below the summary stats', 'Each insight is a card with left-accent color (red=warning, green=positive, blue=neutral)', 'Skeleton loader shown while job is processing', 'Collapse/expand individual insights to save space on mobile']),
  ...callout('Developer Note', [
    'Use gemini-1.5-flash not gemini-1.5-pro — flash is 15x cheaper and fast enough for this use case',
    'Always cache the result; do NOT call Gemini on every page load',
    'If Gemini call fails, retry 3x with exponential backoff via BullMQ options',
  ], C.amberAcc, C.amberBg),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 2 — SMART BUDGET RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(2, '🎯', 'Smart Budget Recommendations', 'Category: AI / Analytics  |  Effort: 2 days  |  Priority: P0', C.indigoDark),
  h2('What It Does'),
  body('AI automatically suggests a monthly budget per category based on the user\'s past 3 months of spending. Users can accept, reject, or adjust each suggestion.'),
  blank(40),
  h2('Example Output'),
  ...mkTable(
    ['Category', 'Avg. Past 3 Months', 'AI Suggested Budget', 'Reason'],
    [1800, 2200, 2200, 3160],
    [
      ['Food & Dining',  '₹5,800',  '₹6,000',  'Slight buffer above average — consistent spending'],
      ['Transport',      '₹2,100',  '₹2,000',  'Slightly above average — recommend small reduction'],
      ['Entertainment',  '₹3,400',  '₹2,500',  'High variance — AI flags as reducible'],
      ['Groceries',      '₹4,200',  '₹4,500',  'Essential — buffer added for inflation'],
    ],
    C.teal
  ),
  h2('Implementation Steps'),
  ...nums([
    'Query the last 3 months of expenses grouped by category for the user',
    'Compute: mean, median, and standard deviation per category',
    'Pass the stats as JSON to Gemini with prompt: "Suggest a monthly budget for each category. Respond in JSON format: { category: string, suggestedBudget: number, reason: string }[]"',
    'Parse the response and store in a BudgetSuggestion table',
    'Display suggestions in a "Review Budgets" page with Accept / Modify / Reject buttons',
    'On Accept: call POST /api/budgets to create/update the budget record',
    'Re-run suggestions at the start of each calendar month via a cron job (node-cron)',
  ]),
  blank(60),
  h2('Database Change — New Table'),
  ...code([
    'model BudgetSuggestion {',
    '  id              String   @id @default(cuid())',
    '  userId          String',
    '  categoryId      String',
    '  suggestedAmount Decimal  @db.Decimal(12,2)',
    '  reason          String',
    '  status          String   @default("PENDING") // PENDING | ACCEPTED | REJECTED',
    '  month           Int',
    '  year            Int',
    '  createdAt       DateTime @default(now())',
    '  @@unique([userId, categoryId, month, year])',
    '}',
  ]),
  h2('New API Routes'),
  ...mkTable(
    ['Method', 'Route', 'Description'],
    [900, 3200, 5260],
    [
      ['GET',   '/api/budget-suggestions',           'Returns current month AI budget suggestions for the user'],
      ['POST',  '/api/budget-suggestions/generate',  'Triggers Gemini job to generate new suggestions'],
      ['PATCH', '/api/budget-suggestions/:id',       'Accept or reject a single suggestion (body: { status: "ACCEPTED" })'],
    ],
    C.teal
  ),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 3 — RECEIPT SCANNER
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(3, '📷', 'Receipt Scanner (OCR)', 'Category: AI / Input  |  Effort: 3 days  |  Priority: P0', C.teal),
  h2('What It Does'),
  body('User uploads or drags a receipt image. The system uses Google Vision API to extract the amount, merchant name, date, and suggested category. A pre-filled expense form opens for review before saving.'),
  blank(40),
  h2('Extraction Output Example'),
  ...code([
    '{',
    '  "merchant": "Swiggy",',
    '  "amount": 450,',
    '  "currency": "INR",',
    '  "date": "2026-05-14",',
    '  "suggestedCategory": "Food & Dining",',
    '  "confidence": 0.94',
    '}',
  ]),
  h2('Tech Stack for This Feature'),
  ...buls(['Google Vision API — TEXT_DETECTION to extract raw text from image (generous free tier: 1000 calls/month)', 'Gemini 1.5 Flash — parse the raw OCR text into structured JSON (amount, merchant, date)', 'Multer — Express middleware for handling multipart/form-data image uploads', 'Sharp — resize image before sending to Vision API (reduces cost and latency)']),
  blank(60),
  h2('Implementation Steps'),
  ...nums([
    'Add POST /api/receipts/scan — accepts multipart form with field "receipt" (JPEG/PNG/WEBP, max 5 MB)',
    'Use Multer to receive the file; Sharp to resize it to max 1024px on the longest side',
    'Send the image as base64 to Google Vision API with feature type TEXT_DETECTION',
    'Take the fullTextAnnotation.text string from Vision API response',
    'Send that raw text to Gemini with prompt: "Extract receipt data and return JSON: { merchant, amount, currency, date (ISO 8601), suggestedCategory }"',
    'Return the structured JSON to the frontend',
    'Frontend opens the AddExpense sheet pre-populated with the extracted values',
    'User reviews and confirms; a normal POST /api/expenses is then made',
    'Store the original image URL in the receiptUrl field on the Expense model (upload to Cloudinary free tier)',
  ]),
  blank(60),
  h2('Frontend — Drag-and-Drop Upload'),
  ...buls(['Use react-dropzone for the drag-and-drop UI', 'Show image preview after drop; display a "Scanning..." spinner while API call is in progress', 'On success: open the AddExpense sheet with pre-filled values highlighted in blue so user knows what was auto-detected', 'On failure: show error toast; allow manual entry']),
  ...callout('Developer Note', [
    'Fallback: if Google Vision API key is not available, use tesseract.js (runs in Node.js, no external API needed) for OCR — then still pass raw text to Gemini for structuring',
    'Store receipt images on Cloudinary free tier (25 GB free storage) — never store binary files in PostgreSQL',
    'Validate file type on both client (react-dropzone accept prop) and server (check MIME type in Multer)',
  ], C.amberAcc, C.amberBg),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 4 — VOICE EXPENSE ENTRY
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(4, '🎙️', 'Voice Expense Entry', 'Category: AI / Input  |  Effort: 2 days  |  Priority: P1', C.violet),
  h2('What It Does'),
  body('User clicks a microphone button and says a natural language sentence. The app extracts the expense details and shows a pre-filled form for confirmation.'),
  blank(40),
  h2('Example'),
  ...code([
    'User says: "Spent 450 rupees on pizza yesterday"',
    '',
    'Extracted:',
    '{',
    '  "amount": 450,',
    '  "currency": "INR",',
    '  "description": "Pizza",',
    '  "category": "Food & Dining",',
    '  "date": "2026-05-13"  // yesterday resolved to actual date',
    '}',
  ]),
  h2('Implementation Steps'),
  ...nums([
    'Use the browser\'s native Web Speech API (SpeechRecognition) for voice-to-text — zero cost, works in Chrome/Edge/Safari',
    'On stop speaking: send the transcript string to POST /api/ai/parse-voice',
    'In the Express handler: send the transcript to Gemini with today\'s date injected in the prompt so relative dates ("yesterday", "last Friday") are resolved correctly',
    'Return structured JSON; frontend opens the AddExpense sheet pre-filled',
    'Add a VoiceButton component: mic icon that turns red while recording; shows live transcript text below',
    'Fallback: if browser does not support SpeechRecognition, show a manual text field to type the natural language sentence',
  ]),
  blank(60),
  h2('New API Route'),
  ...code([
    'POST /api/ai/parse-voice',
    'Body: { transcript: string, todayDate: string }',
    'Response: { amount, currency, description, category, date, confidence }',
  ]),
  ...callout('Developer Note', [
    'The Web Speech API is free and requires NO backend call for transcription — only the Gemini structuring call costs anything',
    'Always confirm before saving — never auto-save a voice entry without user review',
    'Gemini prompt must include: "Today is ${todayDate}. Resolve relative date references."',
  ], C.amberAcc, C.amberBg),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 5 — FINANCIAL HEALTH SCORE
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(5, '💯', 'Financial Health Score', 'Category: Analytics  |  Effort: 2 days  |  Priority: P1', C.teal),
  h2('What It Does'),
  body('Compute a score out of 100 for each user based on their spending discipline, savings ratio, and budget adherence. Update it monthly.'),
  blank(40),
  h2('Scoring Formula'),
  ...mkTable(
    ['Component', 'Weight', 'How It Is Calculated'],
    [2600, 1200, 5560],
    [
      ['Savings Ratio',         '30%', 'income - totalSpend / income. 0% savings = 0 pts; 30%+ savings = 30 pts'],
      ['Budget Adherence',      '30%', 'Avg (budgetAmount - actualAmount) / budgetAmount across all categories with budgets set'],
      ['Category Balance',      '20%', 'No single category should exceed 40% of total spend. Penalty applied if it does'],
      ['Spending Consistency',  '20%', 'Low standard deviation across weekly spend = high score; erratic = low score'],
    ],
    C.teal
  ),
  h2('Example Badges'),
  ...buls(['90–100: "Financial Champion" — excellent discipline', '75–89: "Smart Spender" — good habits with room to grow', '60–74: "On Track" — some categories need attention', '40–59: "Needs Work" — significant overspending detected', '0–39: "At Risk" — urgent review recommended']),
  blank(60),
  h2('Implementation Steps'),
  ...nums([
    'Create backend/src/services/healthScore.service.ts with a computeScore(userId, month, year) function',
    'The function queries Prisma for: total spend, income (if user has set it), budgets, and category breakdown',
    'Apply the weighted formula and return { score: number, breakdown: ComponentScore[], badge: string }',
    'Store result in a HealthScore table (userId, month, year, score)',
    'Expose GET /api/health-score?month=5&year=2026',
    'Display as an animated circular progress ring on the dashboard (use react-circular-progressbar)',
    'Show a breakdown card listing each component score with a mini bar',
  ]),
  blank(60),
  h2('Database Change'),
  ...code([
    'model HealthScore {',
    '  id          String   @id @default(cuid())',
    '  userId      String',
    '  month       Int',
    '  year        Int',
    '  score       Int      // 0-100',
    '  savingsComp Int',
    '  budgetComp  Int',
    '  balanceComp Int',
    '  consistency Int',
    '  badge       String',
    '  createdAt   DateTime @default(now())',
    '  @@unique([userId, month, year])',
    '}',
  ]),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURE 6 — FUTURE EXPENSE PREDICTION
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...banner(6, '🔮', 'Future Expense Prediction', 'Category: AI / Analytics  |  Effort: 4 days  |  Priority: P1', C.indigoDark),
  h2('What It Does'),
  body('Predict next month\'s total spending per category using the user\'s historical data. Displayed as a forecast card with confidence ranges.'),
  blank(40),
  h2('Example Output'),
  ...code([
    'Predicted spending for June 2026:',
    '  Food & Dining  →  ₹6,800  (±₹400)  based on 4 months data',
    '  Transport      →  ₹2,100  (±₹200)  based on 4 months data',
    '  Entertainment  →  ₹3,200  (±₹800)  HIGH VARIANCE — low confidence',
    '  Total forecast →  ₹18,400',
  ]),
  h2('Approach — Two Options (choose based on data available)'),
  h3('Option A — Linear Regression (recommended for < 12 months data)'),
  ...buls(['Use simple-statistics npm package (no Python needed)', 'For each category: fit a linear regression on (monthIndex → totalSpent)', 'Predict monthIndex + 1; compute 95% confidence interval from residuals', 'Works well with as few as 3 data points']),
  blank(40),
  h3('Option B — Gemini-Based Prediction (simpler to implement)'),
  ...buls(['Pass last 6 months of category totals to Gemini in JSON', 'Ask Gemini to predict next month with a confidence level and reasoning', 'Simpler to implement but less numerically rigorous; fine for a portfolio project']),
  blank(60),
  h2('Implementation Steps'),
  ...nums([
    'Create backend/src/services/prediction.service.ts',
    'Query last 6 months of category totals from Prisma',
    'For each category with at least 3 data points: run linear regression using simple-statistics linearRegressionLine()',
    'Return { category, predicted, lowerBound, upperBound, confidence: "high"|"medium"|"low" }[]',
    'Expose GET /api/predictions/next-month',
    'Cache result in Redis for 24 hours (key: predictions:{userId}:{nextMonth})',
    'Display as a "Forecast" tab on the Analytics page with a horizontal bar chart per category',
    'Show confidence level as a badge next to each category prediction',
  ]),
  ...callout('Developer Note', [
    'If user has less than 3 months of data: show a message "Add more expenses to unlock predictions — need at least 3 months"',
    'Never promise exact accuracy — always show confidence intervals and a disclaimer',
    'Predictions should refresh automatically on the 1st of each month via a cron job',
  ], C.amberAcc, C.amberBg),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURES 7-10 COMBINED PAGE
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Features 7–10 — Analytics & UI Upgrades'),
  blank(80),
  ...banner(7, '🔄', 'Subscription Detection', 'Category: Analytics  |  Effort: 2 days  |  Priority: P1', C.sky),
  h2('What It Does'),
  body('Automatically detect recurring monthly expenses (e.g. Netflix, Spotify, gym). Show total monthly committed spend and flag unused subscriptions.'),
  blank(40),
  h2('Detection Algorithm'),
  ...nums([
    'Query all expenses for the past 3 months',
    'Group by merchant name (case-insensitive) and round amount to nearest 10',
    'Flag as "subscription candidate" if: same merchant + similar amount appears in 2 or more separate months',
    'Pass candidates to Gemini: "Classify each as a subscription service (yes/no) and return a canonical name"',
    'Store in Subscription table; expose GET /api/subscriptions',
  ]),
  blank(40),
  h2('New Table: Subscription'),
  ...code([
    'model Subscription {',
    '  id          String   @id @default(cuid())',
    '  userId      String',
    '  merchant    String',
    '  amount      Decimal  @db.Decimal(12,2)',
    '  frequency   String   @default("monthly")',
    '  lastCharged DateTime',
    '  isActive    Boolean  @default(true)',
    '  category    String',
    '}',
  ]),
  h2('UI'),
  ...buls(['Subscriptions page: card grid with logo, name, amount, next charge date', 'Toggle "active / cancelled" on each card to hide from total', '"Total committed monthly: ₹2,450" shown at the top']),
  blank(80),

  ...banner(8, '🔔', 'Smart Alerts', 'Category: Notifications  |  Effort: 2 days  |  Priority: P1', C.orange),
  h2('Alert Types to Implement'),
  ...mkTable(
    ['Alert Type', 'Trigger Condition', 'Channel'],
    [2800, 4200, 2360],
    [
      ['Budget Limit Warning',      'User has spent 80% of a category budget',          'In-app toast + email'],
      ['Budget Exceeded',           'User has spent 100%+ of a category budget',        'In-app banner + email'],
      ['Unusual Expense Detected',  'Single expense > 2x the user\'s category average', 'In-app toast'],
      ['Monthly Overspend',         'Total spend > total income (if income is set)',     'In-app banner + email'],
      ['Subscription Renewal Due',  '3 days before estimated next charge',              'Email'],
    ],
    C.orange
  ),
  h2('Implementation'),
  ...buls(['Run alert checks in a BullMQ cron job every hour (BullMQ repeat option)', 'Email: use Nodemailer with Gmail App Password (free) or Resend.com free tier (3,000 emails/month)', 'In-app: store alerts in a Notification table; frontend polls GET /api/notifications every 60 seconds', 'Mark as read on click; badge count in the topbar']),
  blank(80),

  ...banner(9, '🎨', 'Dark Mode + Themes', 'Category: UI / UX  |  Effort: 1 day  |  Priority: P1', C.violet),
  h2('Implementation'),
  ...nums([
    'next-themes library: add ThemeProvider to the root layout',
    'Add data-theme attribute to <html>; Tailwind darkMode: "class" in tailwind.config.ts',
    'Add a theme toggle button in the top navigation bar (Sun / Moon icon)',
    'Create 3 accent colour presets: Indigo (default), Teal, Rose — stored in localStorage via Zustand persist',
    'All shadcn/ui components use CSS variables — they automatically respect dark mode',
    'Persist chosen theme and accent in user settings table (not just localStorage) so it syncs across devices',
  ]),
  blank(80),

  ...banner(10, '📊', 'Interactive Charts (Advanced)', 'Category: UI / UX  |  Effort: 3 days  |  Priority: P1', C.teal),
  h2('Charts to Add'),
  ...mkTable(
    ['Chart', 'Library', 'Data Source', 'Description'],
    [2400, 1600, 2600, 2760],
    [
      ['Spending Heatmap',        'Custom CSS Grid',    'Daily expense totals',         'Calendar-style heatmap; intensity = spend amount; hover shows daily total'],
      ['Spending by Weekday',     'Recharts BarChart',  'Group by weekday',             'Bar chart: Mon–Sun; reveals weekend spending patterns'],
      ['Animated Category Donut', 'Recharts PieChart',  'Category summary',             'Animated on load; click segment to drill into that category\'s expense list'],
      ['Monthly Trend Line',      'Recharts LineChart', 'Monthly totals (12 months)',   'Smooth curve with area fill; includes predicted future months as dashed line'],
      ['Budget vs Actual',        'Recharts BarChart',  'Budget + actual per category', 'Grouped bars; over-budget bars in red; add animated transition on load'],
    ],
    C.teal
  ),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURES 11–15
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Features 11–15 — Real-World & Calendar Features'),
  blank(80),
  ...banner(11, '📅', 'Financial Calendar', 'Category: UI / UX  |  Effort: 2 days  |  Priority: P2', C.sky),
  h2('What It Shows'),
  ...buls(['Every day cell in the month grid shows: total expenses for that day', 'Color-coded cells: green (low spend), amber (medium), red (high or over budget)', 'Click a day cell: slide-over panel lists all expenses for that day', 'Days with bill reminders show a clock icon badge']),
  blank(40),
  h2('Implementation'),
  ...nums([
    'Create a GET /api/expenses/calendar?month=5&year=2026 endpoint',
    'Returns: { "2026-05-01": { total: 450, count: 2 }, "2026-05-02": { total: 0, count: 0 }, ... }',
    'Build a CalendarGrid component using CSS Grid (7 columns for weekdays)',
    'Use react-calendar or build a custom grid — custom is simpler with Tailwind',
    'Store bill due dates in a BillReminder table and overlay them on the calendar',
  ]),
  blank(80),

  ...banner(12, '💱', 'Multi-Currency Support', 'Category: Real-World  |  Effort: 2 days  |  Priority: P2', C.green),
  h2('Implementation'),
  ...nums([
    'Add currency field (3-letter ISO code) to each expense — already in the base schema',
    'Add a userCurrency field to User table (default: INR)',
    'Use ExchangeRate-API.com free tier (1,500 requests/month, no credit card) to fetch live rates',
    'Cache rates in Redis with TTL = 1 hour (key: fx:rates:{baseCurrency})',
    'Create a currency conversion util: convertAmount(amount, fromCurrency, toCurrency, rates)',
    'On the dashboard: convert all expenses to user\'s base currency for totals and charts',
    'Expense form: currency selector next to the amount field',
    'Show original currency + converted amount in expense cards (e.g. "€45.00 = ₹4,050")',
  ]),
  blank(80),

  ...banner(13, '👥', 'Split Expenses with Friends', 'Category: Real-World  |  Effort: 4 days  |  Priority: P2', C.violet),
  h2('Data Model Changes'),
  ...code([
    'model Group {',
    '  id       String        @id @default(cuid())',
    '  name     String',
    '  members  GroupMember[]',
    '  expenses SharedExpense[]',
    '}',
    '',
    'model GroupMember {',
    '  id      String @id @default(cuid())',
    '  groupId String',
    '  userId  String',
    '  role    String @default("MEMBER") // ADMIN | MEMBER',
    '}',
    '',
    'model SharedExpense {',
    '  id          String        @id @default(cuid())',
    '  groupId     String',
    '  paidById    String        // who paid',
    '  amount      Decimal       @db.Decimal(12,2)',
    '  description String',
    '  date        DateTime',
    '  splits      ExpenseSplit[]',
    '}',
    '',
    'model ExpenseSplit {',
    '  id               String @id @default(cuid())',
    '  sharedExpenseId  String',
    '  userId           String',
    '  amount           Decimal @db.Decimal(12,2)',
    '  isSettled        Boolean @default(false)',
    '}',
  ]),
  h2('Key Routes'),
  ...buls(['POST /api/groups — create a group', 'POST /api/groups/:id/members — invite a member by email', 'POST /api/groups/:id/expenses — add a shared expense with split amounts', 'GET /api/groups/:id/balances — who owes whom (net balance per pair)', 'POST /api/groups/:id/settle — mark a balance as settled']),
  blank(80),

  ...banner(14, '🎯', 'Savings Goals', 'Category: Real-World  |  Effort: 2 days  |  Priority: P2', C.green),
  h2('Implementation'),
  ...nums([
    'Add SavingsGoal table: { id, userId, name, targetAmount, savedAmount, deadline, emoji }',
    'POST /api/goals — create a goal', 'PATCH /api/goals/:id/contribute — add money to a goal',
    'Dashboard widget: progress bars with animated fill, emoji icon, "X days left" countdown',
    'When a goal reaches 100%: trigger a "Goal Achieved!" celebration animation (confetti via canvas-confetti)',
  ]),
  blank(80),

  ...banner(15, '⏰', 'Bill Reminder System', 'Category: Real-World  |  Effort: 2 days  |  Priority: P2', C.sky),
  h2('Implementation'),
  ...nums([
    'Add BillReminder table: { id, userId, name, amount, dueDay (1-31), category, isActive }',
    'POST /api/reminders — create a bill reminder', 'GET /api/reminders — list active reminders',
    'Cron job runs daily at 8 AM: find all bills due in the next 3 days; send email via Nodemailer',
    'Show bill reminders on the Financial Calendar as clock-icon badges',
    'Dashboard widget: "Upcoming Bills" card listing bills due this week with days-until countdown',
  ]),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  FEATURES 16–23
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Features 16–23 — Gamification, Advanced & Infrastructure'),
  blank(80),
  ...banner(16, '🏆', 'Achievements & Badges', 'Category: Gamification  |  Effort: 2 days  |  Priority: P2', C.amber),
  h2('Achievement List to Implement'),
  ...mkTable(
    ['Badge Name', 'Trigger Condition', 'Icon'],
    [2800, 4760, 1800],
    [
      ['First Entry',          'User logs their first expense',                                      '🌱'],
      ['Budget Master',        'Stayed under budget in ALL categories for a full month',              '👑'],
      ['7-Day Streak',         'Logged at least one expense every day for 7 consecutive days',       '🔥'],
      ['Savings Hero',         'Saved 20%+ of income for a full month',                             '💰'],
      ['No Splurge Week',      'No single expense > ₹2,000 for 7 days',                             '🧘'],
      ['Goal Achiever',        'Completed a savings goal',                                           '🎯'],
      ['Receipt Scanner Pro',  'Scanned 10 receipts',                                                '📷'],
    ],
    C.amber
  ),
  h2('Implementation'),
  ...nums([
    'Create an Achievement table and a UserAchievement join table',
    'After every relevant action (expense created, budget checked, etc.), call checkAndAwardAchievements(userId)',
    'Award function: runs a set of condition-check functions; awards any that pass and have not been awarded yet',
    'On award: store in UserAchievement; push an in-app notification; optionally send a congratulations email',
    'Display on a /profile page: earned badges shown in full colour; unearned shown greyed out with progress hint',
  ]),
  blank(80),

  ...banner(17, '⚡', 'Weekly Challenges', 'Category: Gamification  |  Effort: 2 days  |  Priority: P3', C.amber),
  h2('Implementation'),
  ...buls(['Seeded list of 20 challenges stored in the DB (static data, seeded via prisma/seed.ts)', 'Each Monday: randomly assign one active challenge per user via a cron job', 'Challenge types: spending limit in a category / no spend day / log every expense that week', 'Progress tracked in real time as expenses come in; completion checked at end of week', 'Completed challenges contribute to a points leaderboard (future feature)']),
  blank(80),

  ...banner(19, '🤖', 'AI Chatbot Financial Assistant', 'Category: Advanced  |  Effort: 4 days  |  Priority: P2', C.indigoDark),
  h2('What It Does'),
  body('A chat interface where users ask questions about their finances in natural language. The AI has context of all their expenses and answers from real data.'),
  blank(40),
  h2('Example Conversations'),
  ...code([
    'User: "Where did I spend most this month?"',
    'AI:   "Your highest category this month is Food & Dining at ₹6,200 (34% of total)."',
    '',
    'User: "How does that compare to last month?"',
    'AI:   "Last month you spent ₹4,800 on food — that\'s a 29% increase."',
    '',
    'User: "Can I afford a ₹15,000 trip next month?"',
    'AI:   "Based on your average savings of ₹8,000/month, you would need to save for 2 months, ',
    '       or reduce food spending by 30% next month to afford it in one month."',
  ]),
  h2('Implementation — Simple RAG Approach'),
  ...nums([
    'On every chat message, fetch the user\'s last 3 months of expense data from Prisma',
    'Inject the data as a JSON context block into the Gemini system prompt',
    'Maintain conversation history in the frontend (Zustand array of { role, content } messages)',
    'Send the full history + fresh data context on every Gemini call (Gemini 1.5 Flash has 1M token context — no chunking needed)',
    'Store chat history in a ChatMessage table so it persists across sessions',
    'UI: a chat interface panel accessible via a floating button on the dashboard (slide-in from right)',
    'Show a "Thinking..." animation while Gemini responds',
  ]),
  blank(80),

  ...banner(20, '📑', 'Export Professional Reports', 'Category: Reports  |  Effort: 2 days  |  Priority: P1', C.teal),
  h2('Report Types'),
  ...mkTable(
    ['Format', 'Contents', 'Library', 'Route'],
    [1200, 4400, 1960, 1800],
    [
      ['PDF', 'Cover, summary table, expense list, category chart, AI insights', 'PDFKit', 'GET /api/reports/pdf'],
      ['CSV', 'Raw expense rows: date, description, category, amount, tags',      'csv-stringify', 'GET /api/reports/csv'],
      ['JSON', 'Full structured export for data portability',                      'Native JSON',  'GET /api/reports/json'],
    ],
    C.teal
  ),
  h2('Report Parameters'),
  ...buls(['?month=5&year=2026 — single month report', '?from=2026-01-01&to=2026-05-31 — custom date range', '?categoryId=xxx — single category report', 'Reports require JWT authentication; never serve another user\'s data']),
  blank(80),

  ...banner(21, '🔐', 'Authentication & Security Hardening', 'Category: Tech / Infra  |  Effort: 2 days  |  Priority: P0', C.indigoDark),
  h2('Security Checklist'),
  ...mkTable(
    ['Security Measure', 'Implementation'],
    [3600, 5760],
    [
      ['JWT + Google OAuth',      'NextAuth v5 with GoogleProvider; JWT stored in HttpOnly cookie (not localStorage)'],
      ['Password hashing',        'bcryptjs with work factor 12 for any email/password auth flows'],
      ['Input validation',        'Zod schema validation on ALL API inputs; reject malformed requests before DB'],
      ['SQL injection prevention','Prisma parameterises all queries — raw SQL is never used unless absolutely needed'],
      ['Rate limiting',           'express-rate-limit on all public endpoints; stricter limit on /api/ai/* routes'],
      ['Helmet.js',               'Sets 14 security HTTP headers automatically: CSP, HSTS, X-Frame-Options, etc.'],
      ['CORS',                    'Whitelist only the Vercel frontend domain in production; never use CORS *'],
      ['Environment secrets',     'All secrets in .env files; never in code; .env listed in .gitignore'],
      ['HTTPS only',              'Vercel and Railway enforce HTTPS automatically in production'],
      ['Data ownership checks',   'Every DB query includes WHERE userId = authenticatedUserId — users cannot access others\' data'],
    ],
    C.indigoDark
  ),
  blank(80),

  ...banner(22, '⚡', 'Real-Time Sync (WebSockets)', 'Category: Tech / Infra  |  Effort: 3 days  |  Priority: P2', C.sky),
  h2('Use Cases for Real-Time'),
  ...buls(['Group expense splits: when a group member adds a shared expense, all members see it instantly', 'Budget alerts: push alert to the client the moment a budget is exceeded — no polling needed', 'AI job completion: notify the client when a queued AI job finishes — replaces the current polling approach']),
  blank(40),
  h2('Implementation'),
  ...nums([
    'Add socket.io to the Express server: npm install socket.io', 'Add socket.io-client to the Next.js frontend',
    'Authenticate socket connections: verify JWT on the handshake event before allowing connection',
    'Emit targeted events to specific user rooms: socket.to(userId).emit("budget:exceeded", { category, amount })',
    'React hook: useSocket() wraps the client connection; listens for events and updates React Query cache',
    'Gracefully degrade: if socket connection fails, fall back to 30-second polling',
  ]),
  blank(80),

  ...banner(23, '📱', 'Progressive Web App (PWA)', 'Category: Tech / Infra  |  Effort: 1 day  |  Priority: P2', C.green),
  h2('Implementation'),
  ...nums([
    'Install next-pwa: npm install next-pwa in the frontend package',
    'Configure next-pwa in next.config.ts: enable in production, set dest: "public"',
    'Create public/manifest.json: { name, short_name, icons (192x192, 512x512), start_url: "/", display: "standalone", theme_color }',
    'Add <meta name="theme-color"> and apple-touch-icon links in the root layout',
    'Create app icons using a free tool like favicon.io; export as PNG in required sizes',
    'Test: Chrome DevTools → Application → Manifest → check "Add to Home Screen" works',
    'Service worker caches static assets automatically via next-pwa\'s Workbox integration',
    'Users on Android can install via browser "Add to Home Screen"; iPhone users via Safari share menu',
  ]),
  pg([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  IMPLEMENTATION TIMELINE
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Recommended Implementation Timeline'),
  blank(60),
  body('This schedule assumes one developer working full-time (8 hrs/day). Adjust proportionally for part-time work.'),
  blank(80),
  ...mkTable(
    ['Sprint', 'Duration', 'Features', 'End State'],
    [1000, 1200, 4200, 2960],
    [
      ['Sprint 1', 'Week 1–2', '21 (Auth & Security), 9 (Dark Mode), 23 (PWA)',            'Secure auth, dark mode, installable app'],
      ['Sprint 2', 'Week 3',   '1 (AI Insights), 2 (Smart Budgets), 8 (Smart Alerts)',     'Core AI features live and working'],
      ['Sprint 3', 'Week 4',   '3 (Receipt Scanner), 4 (Voice Entry), 20 (Export Reports)','AI input methods + PDF/CSV export'],
      ['Sprint 4', 'Week 5',   '5 (Health Score), 6 (Predictions), 7 (Subscriptions)',     'Full analytics suite complete'],
      ['Sprint 5', 'Week 6',   '10 (Charts), 11 (Calendar), 12 (Multi-Currency)',          'Rich UI and international support'],
      ['Sprint 6', 'Week 7',   '14 (Savings Goals), 15 (Bill Reminders), 16 (Badges)',     'Engagement and real-world features'],
      ['Sprint 7', 'Week 8',   '13 (Split Expenses), 19 (AI Chatbot)',                     'Social features and chatbot'],
      ['Sprint 8', 'Week 9',   '17 (Challenges), 22 (Real-Time Sync), polish',             'Final polish and production deploy'],
    ],
    C.indigoDark
  ),
  blank(80),
  h2('Critical Path (do these first)'),
  ...buls([
    'Feature 21 (Auth) must be done before any other feature — everything requires a logged-in user',
    'Feature 1 (AI Insights) and 2 (Budget Recommendations) are the headline features — do them in Sprint 2',
    'Feature 3 (Receipt Scanner) needs Google Vision API credentials — set these up in advance',
    'Feature 13 (Split Expenses) is the most complex — leave it for Sprint 7 when the codebase is stable',
  ]),
  blank(80),
  ...callout('Instructions for Antigravity', [
    'Implement features in the sprint order above — the ordering minimises re-work and dependency conflicts',
    'Every new table in the "Database Change" sections must be added to prisma/schema.prisma and a migration run with: npx prisma migrate dev --name <feature-name>',
    'All AI features use Google Gemini (model: gemini-1.5-flash) — the API key env var is GEMINI_API_KEY',
    'Receipt Scanner also needs a Google Vision API key — set GOOGLE_VISION_API_KEY in backend/.env',
    'Voice Entry uses the browser Web Speech API — no backend key needed for transcription',
    'All async AI operations MUST go through the BullMQ queue — never call Gemini synchronously in an API route handler',
    'Cache ALL AI results in Redis with the key patterns specified in each feature section',
    'Email notifications use Nodemailer — configure with a Gmail App Password stored in SMTP_USER and SMTP_PASS env vars',
    'Every new API route must: validate input with Zod, check JWT auth with authMiddleware, verify ownership with WHERE userId = req.userId',
    'Run the test suite after each sprint before merging: npm run test && npm run test:integration',
  ], C.indigo, C.indigoLight),
  blank(100),
  pg([tx('End of Brief  —  Smart Expense Tracker AI Insights Edition 2026  |  Prepared for Antigravity', { italic: true, color: C.muted, size: 20 })], { align: AlignmentType.CENTER, after: 0 }),
);

// ── Build ─────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: C.dark } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: 'Arial', color: C.indigoDark },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 27, bold: true, font: 'Arial', color: C.blue },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: 'Arial', color: C.slate },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      }
    },
    children: kids,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/SmartExpenseTracker_Antigravity_Brief.docx', buf);
  console.log('Done — bytes:', buf.length);
});
