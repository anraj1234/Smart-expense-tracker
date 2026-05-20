const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak
} = require('docx');
const fs = require('fs');

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  blue:      '1D4ED8',
  blueDark:  '1E3A8A',
  blueLight: 'DBEAFE',
  green:     '065F46',
  greenBg:   'D1FAE5',
  greenAcc:  '10B981',
  amber:     '92400E',
  amberBg:   'FEF3C7',
  amberAcc:  'F59E0B',
  red:       '991B1B',
  redBg:     'FEE2E2',
  redAcc:    'EF4444',
  purple:    '5B21B6',
  purpleBg:  'EDE9FE',
  purpleAcc: '7C3AED',
  teal:      '134E4A',
  tealBg:    'CCFBF1',
  tealAcc:   '0D9488',
  slate:     '334155',
  slateLight:'F8FAFC',
  muted:     '64748B',
  dark:      '0F172A',
  white:     'FFFFFF',
  gray100:   'F1F5F9',
  gray200:   'E2E8F0',
  gray300:   'CBD5E1',
  gray700:   '374151',
};

// ── Border presets ────────────────────────────────────────────────────────────
const bdr  = (color = C.gray200) => ({ style: BorderStyle.SINGLE, size: 1, color });
const bdrAll  = (color = C.gray200) => ({ top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color) });
const noBdr   = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const noBdrAll = () => ({ top: noBdr(), bottom: noBdr(), left: noBdr(), right: noBdr() });

// ── Type helpers ──────────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({
  text, font: 'Arial', size: opts.size || 22,
  color: opts.color || C.dark,
  bold:    opts.bold    || false,
  italics: opts.italic  || false,
  ...(opts.mono ? { font: 'Courier New', size: opts.size || 20 } : {})
});

const para = (children, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.LEFT,
  spacing:   { before: opts.before || 0, after: opts.after !== undefined ? opts.after : 100 },
  indent:    opts.indent ? { left: opts.indent } : undefined,
  shading:   opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  border:    opts.borderBottom ? { bottom: { style: BorderStyle.SINGLE, size: opts.borderBottom.size || 6, color: opts.borderBottom.color, space: 4 } } : undefined,
  children:  Array.isArray(children) ? children : [children],
});

const blank = (after = 80) => para([run('')], { after });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 160 },
  border:  { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.blue, space: 6 } },
  children: [run(text, { size: 36, bold: true, color: C.blueDark })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 120 },
  children: [run(text, { size: 28, bold: true, color: C.blue })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [run(text, { size: 24, bold: true, color: C.slate })],
});

const body = (text, opts = {}) => para([run(text, { color: C.slate, ...opts })], { after: 100 });

const bodyMix = (parts, after = 100) => para(parts.map(([t, o]) => run(t, o)), { after });

const bullet = (items, level = 0) => items.map(item =>
  new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing:   { after: 80 },
    indent:    { left: level === 0 ? 720 : 1080, hanging: 360 },
    children:  typeof item === 'string'
      ? [run(item, { color: C.slate })]
      : item,
  })
);

const numbered = (items) => items.map(item =>
  new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing:   { after: 80 },
    indent:    { left: 720, hanging: 360 },
    children:  typeof item === 'string'
      ? [run(item, { color: C.slate })]
      : item,
  })
);

const codeBlock = (lines) => [
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: bdrAll(C.gray300),
        shading: { fill: '1E293B', type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: lines.map(l => new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: l, font: 'Courier New', size: 18, color: '94A3B8' })]
        }))
      })
    ]})],
  }),
  blank(100),
];

// ── Callout box ───────────────────────────────────────────────────────────────
const callout = (label, items, accent, bgColor) => [
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: { ...noBdrAll(), left: { style: BorderStyle.SINGLE, size: 16, color: accent } },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 240, right: 200 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({ spacing: { after: 80 }, children: [run(label, { bold: true, color: accent, size: 20 })] }),
        ...items.map(i => new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 60 },
          indent: { left: 720, hanging: 360 },
          children: [run(i, { color: C.slate, size: 20 })]
        }))
      ]
    })]})],
  }),
  blank(120),
];

// ── Phase header banner ───────────────────────────────────────────────────────
const phaseBanner = (num, title, weeks, color) => [
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: noBdrAll(),
      shading: { fill: color, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 300, right: 300 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [run(`PHASE ${num}`, { size: 18, bold: true, color: 'FFFFFF' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [run(title, { size: 32, bold: true, color: 'FFFFFF' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
          children: [run(weeks, { size: 20, italic: true, color: 'BFD4FF' })] }),
      ]
    })]})],
  }),
  blank(120),
];

// ── Data table helper ─────────────────────────────────────────────────────────
const makeTable = (headers, colWidths, rows, headerBg = C.blue) => {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const hRow = new TableRow({ children: headers.map((h, i) => new TableCell({
    borders: bdrAll(C.gray300),
    shading: { fill: headerBg, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    width: { size: colWidths[i], type: WidthType.DXA },
    children: [new Paragraph({ spacing: { after: 0 }, children: [run(h, { bold: true, color: C.white, size: 20 })] })]
  }))});
  const dRows = rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => new TableCell({
    borders: bdrAll(C.gray200),
    shading: { fill: ri % 2 === 0 ? C.white : C.slateLight, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    width: { size: colWidths[ci], type: WidthType.DXA },
    children: [new Paragraph({ spacing: { after: 0 }, children: typeof cell === 'string'
      ? [run(cell, { size: 20, color: C.slate })]
      : cell })]
  })))}));
  return [
    new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: [hRow, ...dRows] }),
    blank(140),
  ];
};

// ── Feature card grid (2-col table) ──────────────────────────────────────────
const featureGrid = (pairs) => {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const left  = pairs[i];
    const right = pairs[i + 1] || null;
    rows.push(new TableRow({ children: [left, right || new TableCell({
      borders: noBdrAll(), width: { size: 4560, type: WidthType.DXA },
      children: [blank()]
    })].map(cell => cell) }));
  }
  // already TableCell objects passed in
  return [
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680], rows }),
    blank(120),
  ];
};

const featureCell = (icon, title, desc, accent, bg) => new TableCell({
  borders: { ...bdrAll(accent) },
  shading: { fill: bg, type: ShadingType.CLEAR },
  margins: { top: 140, bottom: 140, left: 180, right: 180 },
  width: { size: 4680, type: WidthType.DXA },
  children: [
    new Paragraph({ spacing: { after: 60 },
      children: [run(`${icon}  ${title}`, { bold: true, color: accent, size: 22 })] }),
    new Paragraph({ spacing: { after: 0 },
      children: [run(desc, { color: C.slate, size: 20 })] }),
  ]
});

// ─────────────────────────────────────────────────────────────────────────────
//  DOCUMENT BUILD
// ─────────────────────────────────────────────────────────────────────────────

const children = [];

const add = (...items) => items.forEach(i => {
  if (Array.isArray(i)) i.forEach(x => children.push(x));
  else children.push(i);
});

// ══════════════════════════════════════════════════════════════════════════════
//  COVER PAGE
// ══════════════════════════════════════════════════════════════════════════════
add(
  blank(1200),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [run('Smart Expense Tracker', { size: 72, bold: true, color: C.blue })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [run('with AI Insights 2026', { size: 52, bold: true, color: C.dark })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [run('Full-Stack SaaS · Phase-wise Implementation Blueprint', { size: 26, italic: true, color: C.muted })] }),
  para([run('')], { borderBottom: { size: 8, color: C.blue }, after: 200 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [run('Next.js 15  ·  Express.js  ·  PostgreSQL  ·  Google Gemini API  ·  NextAuth', { size: 22, color: C.muted })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [run('Redis  ·  Prisma ORM  ·  PDFKit  ·  Tailwind CSS  ·  shadcn/ui', { size: 22, color: C.muted })] }),
  blank(800),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 },
    children: [run('Version 1.0  |  2026  |  Portfolio-Grade Production Build', { size: 20, color: C.muted, italic: true })] }),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  TABLE OF CONTENTS (manual)
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('Table of Contents'),
  blank(60),
);

const tocItems = [
  ['1. Project Overview & Goals',              '3'],
  ['2. Architecture Overview',                 '4'],
  ['3. Full Tech Stack',                       '5'],
  ['4. Project Folder Structure',              '6'],
  ['5. Environment Variables',                 '7'],
  ['Phase 1 — Foundation & Auth',              '8'],
  ['Phase 2 — Core Expense Features',          '10'],
  ['Phase 3 — AI Integration (Gemini)',        '12'],
  ['Phase 4 — PDF Reports & Dashboard',        '14'],
  ['Phase 5 — Performance & Optimization',     '16'],
  ['Phase 6 — Testing & Deployment',           '18'],
  ['6. Database Schema (Prisma)',              '20'],
  ['7. API Reference',                         '21'],
  ['8. Deployment Guide',                      '23'],
  ['9. Performance Targets',                   '24'],
  ['10. Roadmap & Future Features',            '25'],
];

tocItems.forEach(([label, pg]) => add(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [8560, 800],
    rows: [new TableRow({ children: [
      new TableCell({ borders: { ...noBdrAll(), bottom: bdr(C.gray200) }, width: { size: 8560, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [para([run(label, { size: 22, color: C.slate })], { after: 0 })] }),
      new TableCell({ borders: { ...noBdrAll(), bottom: bdr(C.gray200) }, width: { size: 800, type: WidthType.DXA },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        children: [para([run(pg, { size: 22, color: C.muted })], { after: 0, align: AlignmentType.RIGHT })] }),
    ]})],
  })
));

add(blank(100), para([new PageBreak()], { after: 0 }));

// ══════════════════════════════════════════════════════════════════════════════
//  1. PROJECT OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('1. Project Overview & Goals'),
  blank(60),
  body('Smart Expense Tracker with AI Insights is a production-grade, full-stack SaaS platform that helps individuals and small teams track, categorise, and understand their spending habits. It combines a modern Next.js frontend, a robust Express.js REST API, a PostgreSQL database, and Google Gemini for AI-powered financial insights — all without relying on Stripe or OpenAI.'),
  blank(60),
  body('This document is your complete, phase-wise implementation blueprint. Follow each phase in order and you will have a working, deployable, portfolio-ready application by the end.', { italic: true }),
  blank(80),
  h2('What You Will Build'),
  ...featureGrid([
    featureCell('💰', 'Expense Management', 'Full CRUD: add, edit, delete, filter, and paginate expenses with categories and tags.', C.blue, C.blueLight),
    featureCell('🤖', 'AI Insights (Gemini)', 'Monthly spending summaries, anomaly detection, and personalised budget advice via Google Gemini API.', C.purpleAcc, C.purpleBg),
    featureCell('🔐', 'Authentication', 'JWT sessions + Google OAuth via NextAuth v5. Protected routes, role-based access.', C.greenAcc, C.greenBg),
    featureCell('📄', 'PDF Reports', 'Auto-generated monthly and custom-range reports using PDFKit. Downloadable in-app.', C.amberAcc, C.amberBg),
    featureCell('📊', 'Analytics Dashboard', 'Real-time charts (Recharts), category breakdowns, spending heatmaps, and trend lines.', C.tealAcc, C.tealBg),
    featureCell('⚡', 'Performance', '35% faster response times via DB indexing, Redis caching, and optimised Prisma queries.', C.blue, C.blueLight),
    featureCell('🗂️', 'Multi-Currency', 'Store expenses in any currency; display with live conversion rates (free exchangerate API).', C.greenAcc, C.greenBg),
    featureCell('🏷️', 'Budget Goals', 'Set monthly budgets per category; receive AI alerts when nearing limits.', C.purpleAcc, C.purpleBg),
  ]),
  h2('Project Goals'),
  ...bullet([
    'Recruiter-level code quality: clean architecture, TypeScript everywhere, proper error handling',
    'Deployable to Vercel (frontend) + Railway (backend + Redis) with a single command',
    'Portfolio-worthy: covers auth, databases, AI, caching, PDF generation, and REST APIs',
    'No paid API dependencies beyond a free Gemini tier and a free PostgreSQL host (Neon)',
  ]),
  blank(100),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  2. ARCHITECTURE OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('2. Architecture Overview'),
  blank(60),
  body('The application follows a clean, layered architecture with a clear separation between the Next.js frontend, the Express.js API, and the database layer.'),
  blank(80),
  h3('System Architecture Diagram (Text)'),
  ...codeBlock([
    '  ┌─────────────────────────────────────────────────────┐',
    '  │               BROWSER / CLIENT                      │',
    '  │  Next.js 15 App Router  ·  React Query  ·  Zustand  │',
    '  └────────────────────────┬────────────────────────────┘',
    '                           │ HTTPS',
    '  ┌────────────────────────▼────────────────────────────┐',
    '  │              Next.js API Routes (BFF)               │',
    '  │  /api/auth  ·  /api/expenses  ·  /api/reports       │',
    '  └────────────────────────┬────────────────────────────┘',
    '                           │ HTTP (internal)',
    '  ┌────────────────────────▼────────────────────────────┐',
    '  │           Express.js REST API Server                │',
    '  │  Controllers → Services → Repositories              │',
    '  │  Auth MW  ·  Rate Limit  ·  Validation (Zod)        │',
    '  └───┬──────────────┬─────────────────┬───────────────┘',
    '      │              │                 │',
    '  ┌───▼───┐    ┌─────▼────┐    ┌──────▼──────┐',
    '  │  PG   │    │  Redis   │    │  Gemini API │',
    '  │ (Neon)│    │  Cache   │    │  (Google)   │',
    '  └───────┘    └──────────┘    └─────────────┘',
    '  Prisma ORM    BullMQ Queue    AI Insights',
  ]),
  h3('Key Architectural Decisions'),
  ...bullet([
    'Next.js App Router as the frontend + thin BFF (Backend for Frontend) layer for auth-gated proxying',
    'Separate Express.js server handles heavy lifting: file uploads, PDF generation, AI calls, queues',
    'Prisma ORM for type-safe DB access with automatic migration history',
    'Redis for two purposes: API response caching (TTL-based) and BullMQ job queues for async AI calls',
    'Google Gemini API replaces OpenAI — free tier is sufficient for AI insights at portfolio scale',
    'All secrets live in .env files; never committed to git',
  ]),
  blank(100),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  3. TECH STACK
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('3. Full Tech Stack'),
  blank(60),
  ...makeTable(
    ['Layer', 'Technology', 'Version', 'Why This Choice'],
    [1600, 2400, 1000, 4360],
    [
      ['Frontend',      'Next.js (App Router)',  'v15',     'SSR, SSG, API routes, image optimisation, and edge support in one framework'],
      ['Frontend',      'TypeScript',            '5.x',     'Full type safety across frontend, backend, and shared types'],
      ['Frontend',      'Tailwind CSS',          '3.x',     'Utility-first styling; no CSS bloat; works perfectly with shadcn/ui'],
      ['Frontend',      'shadcn/ui',             'latest',  'Accessible, unstyled component library built on Radix UI primitives'],
      ['Frontend',      'React Query',           'v5',      'Server-state management, caching, background refetch, and optimistic updates'],
      ['Frontend',      'Zustand',               'v4',      'Minimal client-side global state (theme, filters, user prefs)'],
      ['Frontend',      'Recharts',              'v2',      'Composable SVG charts for spending breakdowns and trends'],
      ['Backend',       'Express.js',            '4.x',     'Lightweight, widely understood REST API server; easy to test'],
      ['Backend',       'Node.js',               '20 LTS',  'Long-term support runtime; excellent async performance'],
      ['Database',      'PostgreSQL (Neon)',      '16',      'Free serverless PostgreSQL; JSONB for flexible data; excellent indexing'],
      ['ORM',           'Prisma',                '5.x',     'Type-safe queries, auto-migration, Prisma Studio for inspection'],
      ['Auth',          'NextAuth.js',           'v5',       'Google OAuth + JWT in ~20 lines; handles PKCE, sessions, and callbacks'],
      ['AI',            'Google Gemini API',     '1.5 Pro', 'Free tier generous enough for portfolio use; excellent reasoning quality'],
      ['Caching',       'Redis (Upstash/local)', 'latest',  'In-memory TTL cache for API routes; also powers BullMQ job queue'],
      ['Queue',         'BullMQ',                'v5',      'Redis-backed job queue for async AI insight generation'],
      ['PDF',           'PDFKit',                'latest',  'Programmatic PDF generation in Node.js; no external services needed'],
      ['Validation',    'Zod',                   'v3',      'Runtime + compile-time schema validation on all API inputs'],
      ['Testing',       'Vitest + Supertest',    'latest',  'Fast unit tests (Vitest) and integration tests (Supertest) for the API'],
      ['Deployment',    'Vercel',                '-',       'Zero-config Next.js deployment with edge network'],
      ['Deployment',    'Railway',               '-',       'Express + Redis in one project; free starter tier available'],
    ],
    C.blueDark
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  4. FOLDER STRUCTURE
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('4. Project Folder Structure'),
  blank(60),
  body('The monorepo is split into two packages: /frontend (Next.js) and /backend (Express.js), sharing a /shared types package.'),
  blank(80),
  ...codeBlock([
    'smart-expense-tracker/',
    '├── frontend/                    # Next.js 15 App',
    '│   ├── src/',
    '│   │   ├── app/                 # App Router pages',
    '│   │   │   ├── (auth)/          # Login / register routes',
    '│   │   │   ├── dashboard/       # Main dashboard',
    '│   │   │   ├── expenses/        # Expense list + detail',
    '│   │   │   ├── reports/         # PDF reports page',
    '│   │   │   ├── analytics/       # Charts & insights',
    '│   │   │   ├── settings/        # User preferences',
    '│   │   │   ├── api/             # Next.js BFF API routes',
    '│   │   │   │   ├── auth/[...nextauth]/route.ts',
    '│   │   │   │   └── proxy/       # Proxy to Express backend',
    '│   │   │   └── layout.tsx',
    '│   │   ├── components/',
    '│   │   │   ├── ui/              # shadcn/ui primitives',
    '│   │   │   ├── layout/          # Sidebar, Navbar, Footer',
    '│   │   │   ├── expenses/        # ExpenseCard, ExpenseForm',
    '│   │   │   ├── charts/          # SpendingChart, HeatMap',
    '│   │   │   ├── ai/              # AIInsightPanel',
    '│   │   │   └── reports/         # ReportGenerator',
    '│   │   ├── hooks/               # useExpenses, useAI, useFilters',
    '│   │   ├── lib/                 # API client, auth config',
    '│   │   ├── store/               # Zustand stores',
    '│   │   └── types/               # Shared TypeScript types',
    '│   ├── public/',
    '│   ├── next.config.ts',
    '│   └── tailwind.config.ts',
    '│',
    '├── backend/                     # Express.js API Server',
    '│   ├── src/',
    '│   │   ├── routes/              # Express route definitions',
    '│   │   │   ├── auth.routes.ts',
    '│   │   │   ├── expense.routes.ts',
    '│   │   │   ├── category.routes.ts',
    '│   │   │   ├── report.routes.ts',
    '│   │   │   ├── ai.routes.ts',
    '│   │   │   └── budget.routes.ts',
    '│   │   ├── controllers/         # Request handlers',
    '│   │   ├── services/            # Business logic',
    '│   │   │   ├── expense.service.ts',
    '│   │   │   ├── ai.service.ts    # Gemini integration',
    '│   │   │   ├── pdf.service.ts   # PDFKit',
    '│   │   │   └── cache.service.ts # Redis helpers',
    '│   │   ├── middleware/',
    '│   │   │   ├── auth.middleware.ts',
    '│   │   │   ├── rateLimit.middleware.ts',
    '│   │   │   └── validate.middleware.ts',
    '│   │   ├── lib/',
    '│   │   │   ├── prisma.ts',
    '│   │   │   ├── redis.ts',
    '│   │   │   ├── logger.ts',
    '│   │   │   └── queue.ts         # BullMQ',
    '│   │   ├── workers/',
    '│   │   │   └── ai.worker.ts     # Async Gemini job processor',
    '│   │   └── app.ts               # Express app factory',
    '│   ├── prisma/',
    '│   │   ├── schema.prisma',
    '│   │   └── seed.ts',
    '│   └── tests/',
    '│       ├── unit/',
    '│       └── integration/',
    '│',
    '├── shared/                      # Shared TS types (both packages)',
    '│   └── types/index.ts',
    '│',
    '├── docker-compose.yml           # Local dev (PG + Redis)',
    '├── .env.example',
    '└── README.md',
  ]),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  5. ENVIRONMENT VARIABLES
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('5. Environment Variables'),
  blank(60),
  body('Create two .env files: frontend/.env.local and backend/.env. Never commit these to version control.'),
  blank(80),
  h3('backend/.env'),
  ...makeTable(
    ['Variable', 'Example Value', 'Description'],
    [3000, 2760, 3600],
    [
      ['DATABASE_URL',           'postgresql://user:pass@host/db', 'Neon / Supabase connection string'],
      ['REDIS_URL',              'redis://localhost:6379',          'Local or Upstash Redis URL'],
      ['JWT_SECRET',             'your-32-char-secret',            'Signs JWT access tokens'],
      ['GEMINI_API_KEY',         'AIzaSy...',                      'Google AI Studio key (free)'],
      ['GEMINI_MODEL',           'gemini-1.5-pro',                 'Model name (or gemini-1.5-flash)'],
      ['EXCHANGERATE_API_KEY',   'abc123...',                      'Free tier from exchangerate-api.com'],
      ['PORT',                   '4000',                           'Express server port'],
      ['NODE_ENV',               'development',                    'development | production'],
      ['CORS_ORIGIN',            'http://localhost:3000',          'Allowed frontend origin'],
      ['LOG_LEVEL',              'info',                           'Winston log level'],
      ['RATE_LIMIT_WINDOW_MS',   '60000',                          'Rate limit window in ms'],
      ['RATE_LIMIT_MAX',         '100',                            'Max requests per window per user'],
      ['QUEUE_CONCURRENCY',      '3',                              'BullMQ worker concurrency'],
    ],
    C.gray700
  ),
  h3('frontend/.env.local'),
  ...makeTable(
    ['Variable', 'Example Value', 'Description'],
    [3200, 2560, 3600],
    [
      ['NEXTAUTH_URL',           'http://localhost:3000',          'Full URL of your Next.js app'],
      ['NEXTAUTH_SECRET',        'your-secret-here',               'NextAuth session signing secret'],
      ['GOOGLE_CLIENT_ID',       '123.apps.googleusercontent.com', 'Google OAuth client ID'],
      ['GOOGLE_CLIENT_SECRET',   'GOCSPX-...',                     'Google OAuth client secret'],
      ['NEXT_PUBLIC_API_URL',    'http://localhost:4000',          'Express backend public URL'],
    ],
    C.gray700
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 1
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('1', 'Foundation & Authentication', 'Week 1–2  |  ~25 hours', '1E3A8A'),
  body('Set up the entire monorepo, both servers, the database, and user authentication before touching any expense logic. Getting this right makes everything else easier.'),
  blank(80),
  h2('Phase 1 — Step-by-Step Tasks'),
  blank(40),
  h3('Step 1.1 — Monorepo Initialisation'),
  ...numbered([
    'Create the root folder: mkdir smart-expense-tracker && cd smart-expense-tracker',
    'Initialise git: git init && echo "node_modules\n.env*" > .gitignore',
    'Create subfolders: mkdir frontend backend shared',
    'Initialise each package: run npm init -y inside frontend/, backend/, and shared/',
    'Add a root package.json with workspaces: ["frontend","backend","shared"]',
  ]),
  blank(60),
  h3('Step 1.2 — Frontend Bootstrap (Next.js)'),
  body('Inside frontend/, run the following:'),
  ...codeBlock([
    'npx create-next-app@latest . \\',
    '  --typescript --tailwind --eslint --app --src-dir \\',
    '  --import-alias "@/*"',
    '',
    '# Install core dependencies',
    'npm install @tanstack/react-query zustand next-auth@beta \\',
    '            recharts lucide-react zod axios',
    '',
    '# Install shadcn/ui',
    'npx shadcn@latest init',
    'npx shadcn@latest add button card input label badge \\',
    '     select dialog sheet skeleton toast progress',
  ]),
  blank(60),
  h3('Step 1.3 — Backend Bootstrap (Express.js)'),
  body('Inside backend/, run the following:'),
  ...codeBlock([
    'npm install express cors dotenv helmet morgan winston \\',
    '            express-rate-limit zod bcryptjs jsonwebtoken \\',
    '            @prisma/client ioredis bullmq @google/generative-ai \\',
    '            pdfkit axios uuid',
    '',
    'npm install -D typescript ts-node nodemon prisma \\',
    '            @types/express @types/node @types/cors \\',
    '            @types/bcryptjs @types/jsonwebtoken vitest supertest',
    '',
    '# Initialise Prisma',
    'npx prisma init --datasource-provider postgresql',
    '',
    '# Initialise TypeScript',
    'npx tsc --init',
  ]),
  blank(60),
  h3('Step 1.4 — Docker Compose for Local Dev'),
  body('Create docker-compose.yml in the root to run PostgreSQL and Redis locally:'),
  ...codeBlock([
    'version: "3.9"',
    'services:',
    '  postgres:',
    '    image: postgres:16-alpine',
    '    environment:',
    '      POSTGRES_DB: expense_tracker',
    '      POSTGRES_USER: postgres',
    '      POSTGRES_PASSWORD: postgres',
    '    ports: ["5432:5432"]',
    '    volumes: ["pg_data:/var/lib/postgresql/data"]',
    '',
    '  redis:',
    '    image: redis:7-alpine',
    '    ports: ["6379:6379"]',
    '',
    'volumes:',
    '  pg_data:',
  ]),
  blank(60),
  h3('Step 1.5 — NextAuth v5 with Google OAuth'),
  ...bullet([
    'Go to console.cloud.google.com → Create project → OAuth 2.0 Credentials',
    'Set Authorised redirect URI to: http://localhost:3000/api/auth/callback/google',
    'Copy Client ID and Client Secret into frontend/.env.local',
    'Create frontend/src/app/api/auth/[...nextauth]/route.ts — configure GoogleProvider + JwtStrategy',
    'Create frontend/src/lib/auth.ts with authOptions (session: jwt, pages: signIn: /login)',
    'Wrap the root layout with <SessionProvider> from next-auth/react',
    'Create a middleware.ts in frontend/src/ to protect /dashboard, /expenses, /reports routes',
    'Build a clean /login page with "Sign in with Google" button using signIn() from next-auth/react',
  ]),
  blank(60),
  h3('Step 1.6 — JWT Auth on Express'),
  ...bullet([
    'Create backend/src/middleware/auth.middleware.ts: verifies JWT from Authorization header',
    'The JWT is issued by NextAuth; the Express backend validates it using the same JWT_SECRET',
    'All protected Express routes use this middleware — no session cookies on the API',
    'Create GET /api/me route that returns the authenticated user profile from DB',
    'On first Google login, upsert user in the database (create if new, update last login if existing)',
  ]),
  ...callout(
    'Phase 1 Deliverable — Checklist',
    [
      'npm run dev starts both frontend (port 3000) and backend (port 4000) simultaneously',
      '"Sign in with Google" works end-to-end; user is persisted to PostgreSQL',
      'Navigating to /dashboard without login redirects to /login',
      'Express GET /api/me returns { id, email, name } with a valid JWT',
      'Docker containers for Postgres + Redis are running locally',
    ],
    C.greenAcc, C.greenBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 2
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('2', 'Core Expense Features', 'Week 3–4  |  ~30 hours', '065F46'),
  body('Build the full expense CRUD system: database schema, REST API, and the React UI. This is the heart of the application.'),
  blank(80),
  h2('Phase 2 — Database Schema (Prisma)'),
  body('Define these models in backend/prisma/schema.prisma:'),
  ...codeBlock([
    'model User {',
    '  id         String    @id @default(cuid())',
    '  email      String    @unique',
    '  name       String?',
    '  avatarUrl  String?',
    '  currency   String    @default("USD")',
    '  createdAt  DateTime  @default(now())',
    '  expenses   Expense[]',
    '  budgets    Budget[]',
    '  categories Category[]',
    '}',
    '',
    'model Expense {',
    '  id          String    @id @default(cuid())',
    '  amount      Decimal   @db.Decimal(12, 2)',
    '  currency    String    @default("USD")',
    '  description String',
    '  date        DateTime',
    '  categoryId  String',
    '  category    Category  @relation(fields: [categoryId], references: [id])',
    '  userId      String',
    '  user        User      @relation(fields: [userId], references: [id])',
    '  tags        String[]  // JSONB array of tag strings',
    '  notes       String?',
    '  receiptUrl  String?',
    '  createdAt   DateTime  @default(now())',
    '  updatedAt   DateTime  @updatedAt',
    '  @@index([userId, date])       // Phase 5 optimisation',
    '  @@index([userId, categoryId]) // Phase 5 optimisation',
    '}',
    '',
    'model Category {',
    '  id       String    @id @default(cuid())',
    '  name     String',
    '  icon     String    @default("tag")',
    '  color    String    @default("#6B7280")',
    '  userId   String?   // null = system default category',
    '  user     User?     @relation(fields: [userId], references: [id])',
    '  expenses Expense[]',
    '}',
    '',
    'model Budget {',
    '  id         String   @id @default(cuid())',
    '  userId     String',
    '  user       User     @relation(fields: [userId], references: [id])',
    '  categoryId String?',
    '  amount     Decimal  @db.Decimal(12, 2)',
    '  period     String   @default("monthly")',
    '  month      Int?',
    '  year       Int?',
    '  @@unique([userId, categoryId, month, year])',
    '}',
  ]),
  blank(60),
  h2('Phase 2 — REST API Endpoints'),
  ...makeTable(
    ['Method', 'Route', 'Auth', 'Description'],
    [900, 3200, 700, 4560],
    [
      ['GET',    '/api/expenses',               'JWT', 'List expenses — supports ?page, ?limit, ?category, ?from, ?to, ?search'],
      ['POST',   '/api/expenses',               'JWT', 'Create a new expense; validates body with Zod schema'],
      ['GET',    '/api/expenses/:id',           'JWT', 'Get single expense by ID (owner-only)'],
      ['PATCH',  '/api/expenses/:id',           'JWT', 'Partial update — only provided fields are changed'],
      ['DELETE', '/api/expenses/:id',           'JWT', 'Soft delete (sets deletedAt timestamp)'],
      ['GET',    '/api/expenses/summary',       'JWT', 'Aggregated totals by category and by month for dashboard'],
      ['GET',    '/api/categories',             'JWT', 'List system + user-created categories'],
      ['POST',   '/api/categories',             'JWT', 'Create a custom category with name, icon, and color'],
      ['GET',    '/api/budgets',                'JWT', 'List budgets for current month'],
      ['POST',   '/api/budgets',                'JWT', 'Set a monthly budget for a category'],
      ['GET',    '/api/reports/monthly',        'JWT', 'Generate PDF for current or specified month; streams binary'],
      ['GET',    '/api/ai/insights',            'JWT', 'Queue a Gemini AI insight job; returns jobId for polling'],
      ['GET',    '/api/ai/insights/:jobId',     'JWT', 'Poll job status; returns result when complete'],
    ],
    C.blueDark
  ),
  h2('Phase 2 — Expense Service (Backend)'),
  body('Create backend/src/services/expense.service.ts. This file holds all business logic — no DB queries in controllers.'),
  ...bullet([
    'listExpenses(userId, filters): uses Prisma findMany with dynamic where clause and cursor-based pagination',
    'createExpense(userId, data): validates that categoryId belongs to this user or is a system category',
    'updateExpense(userId, id, data): ownership check before update; returns updated record',
    'deleteExpense(userId, id): sets deletedAt field; never truly removes the row',
    'getSummary(userId, month, year): uses Prisma groupBy to aggregate totals by category in one query',
  ]),
  blank(60),
  h2('Phase 2 — Frontend UI'),
  blank(40),
  h3('Expense List Page (/expenses)'),
  ...bullet([
    'useExpenses() hook: wraps React Query useInfiniteQuery for cursor-based infinite scroll',
    'Filter bar: category dropdown, date range picker, search input — all update URL query params via useSearchParams',
    'ExpenseCard component: shows amount, category icon + colour badge, description, date, and tags',
    'Empty state with illustration when no expenses match filters',
    'Optimistic updates: deleting an expense removes it from the list immediately; rolls back on error',
  ]),
  blank(40),
  h3('Add/Edit Expense Form'),
  ...bullet([
    'React Hook Form + Zod resolver for client-side validation before sending to API',
    'Fields: amount, currency (select), description, category (searchable select), date, tags (multi-input), notes (textarea)',
    'On submit: POST /api/expenses via Axios; React Query invalidates the list cache automatically',
    'Open inside a Sheet (slide-over) from shadcn/ui — no full page navigation needed',
  ]),
  ...callout(
    'Phase 2 Deliverable — Checklist',
    [
      'Full expense CRUD works in the UI with real-time list updates',
      'Filtering by category, date range, and search text works correctly',
      'Custom categories can be created and assigned to expenses',
      'Monthly budget amounts can be set per category',
      'API returns proper 400 errors for invalid inputs (Zod validation)',
      'Soft-deleted expenses do not appear in the list',
    ],
    C.greenAcc, C.greenBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 3
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('3', 'AI Integration (Google Gemini)', 'Week 5  |  ~15 hours', '5B21B6'),
  body('Integrate Google Gemini to provide AI-powered spending summaries, anomaly detection, and personalised budget advice. Uses a BullMQ queue so AI calls never block the API.'),
  blank(80),
  h2('Phase 3 — Setup Google Gemini'),
  ...numbered([
    'Go to aistudio.google.com → Get API key (free, no billing required for development)',
    'Add GEMINI_API_KEY and GEMINI_MODEL=gemini-1.5-flash to backend/.env',
    'Install the SDK: npm install @google/generative-ai in the backend package',
    'Create backend/src/lib/gemini.ts that exports an initialised GenerativeModel instance',
  ]),
  blank(60),
  h2('Phase 3 — AI Service'),
  body('Create backend/src/services/ai.service.ts with three core AI functions:'),
  blank(40),
  h3('Function 1 — generateSpendingSummary(userId, month, year)'),
  ...bullet([
    'Fetches the user\'s expenses for the given month (using the optimised summary query from Phase 2)',
    'Builds a structured prompt: total spent, breakdown by category, top 3 largest expenses',
    'Sends to Gemini and requests a 3-paragraph natural language summary in the user\'s preferred tone',
    'Caches the result in Redis with key ai:summary:{userId}:{month}:{year} and TTL of 24 hours',
    'Returns { summary: string, generatedAt: Date }',
  ]),
  blank(40),
  h3('Function 2 — detectAnomalies(userId)'),
  ...bullet([
    'Compares last 30 days of expenses against the prior 3-month rolling average by category',
    'Flags any category where spending is more than 40% above the average',
    'Sends flagged data to Gemini asking: "Explain these anomalies and suggest corrective actions"',
    'Returns { anomalies: Anomaly[], advice: string }',
  ]),
  blank(40),
  h3('Function 3 — generateBudgetAdvice(userId)'),
  ...bullet([
    'Compares current month\'s spending against the user\'s set budgets',
    'Sends budget vs. actual data to Gemini asking for prioritised savings recommendations',
    'Prompt engineering: instruct Gemini to respond in JSON with { advice: string[], priority: "high"|"medium"|"low" }[]',
    'Parse the JSON response and store in DB (AIInsight table) with the userId and timestamp',
  ]),
  blank(60),
  h2('Phase 3 — BullMQ Async Queue'),
  body('AI calls can take 3–8 seconds. Never run them synchronously in an API route. Use a job queue:'),
  ...codeBlock([
    '// backend/src/lib/queue.ts',
    'import { Queue, Worker } from "bullmq";',
    'import { redis } from "./redis";',
    '',
    'export const aiQueue = new Queue("ai-insights", { connection: redis });',
    '',
    '// Enqueue a job and return the job ID immediately',
    'export async function enqueueInsight(data: { userId: string; type: string }) {',
    '  const job = await aiQueue.add("insight", data, {',
    '    attempts: 3,',
    '    backoff: { type: "exponential", delay: 2000 },',
    '  });',
    '  return job.id;',
    '}',
    '',
    '// backend/src/workers/ai.worker.ts — runs in a separate process',
    'new Worker("ai-insights", async (job) => {',
    '  const { userId, type } = job.data;',
    '  if (type === "summary") await generateSpendingSummary(userId, ...);',
    '  if (type === "anomaly") await detectAnomalies(userId);',
    '  if (type === "advice")  await generateBudgetAdvice(userId);',
    '}, { connection: redis, concurrency: 3 });',
  ]),
  blank(60),
  h2('Phase 3 — API Routes for AI'),
  ...bullet([
    'POST /api/ai/insights: accepts { type: "summary"|"anomaly"|"advice" }, enqueues job, returns { jobId }',
    'GET /api/ai/insights/:jobId: polls job state; returns { status: "pending"|"active"|"completed"|"failed", result? }',
    'GET /api/ai/insights/latest: returns the most recent completed insight of each type from DB',
  ]),
  blank(60),
  h2('Phase 3 — Frontend AI Panel'),
  ...bullet([
    'AIInsightPanel component on the dashboard: shows summary, anomalies, and advice tabs',
    'useAIInsights() hook: polls GET /api/ai/insights/:jobId every 3 seconds until status is "completed"',
    'Trigger button: "Regenerate AI Insights" — calls POST and starts polling; shows skeleton loader during wait',
    'Display anomalies as coloured alert cards (red = high, amber = medium)',
    'Display budget advice as prioritised list with priority badges',
    'Cache the last result in Zustand so the panel shows stale data instantly while regenerating',
  ]),
  ...callout(
    'Phase 3 Deliverable — Checklist',
    [
      'Clicking "Generate Insights" shows a loading state then displays the AI summary within ~8 seconds',
      'Anomalies are detected and explained when spending spikes above the 40% threshold',
      'Budget advice is returned as structured JSON and rendered as a prioritised action list',
      'Failed AI jobs retry automatically up to 3 times via BullMQ backoff',
      'Redis caches AI results for 24 hours — repeated requests do not call Gemini again',
    ],
    C.greenAcc, C.greenBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 4
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('4', 'PDF Reports & Analytics Dashboard', 'Week 6  |  ~20 hours', '0D9488'),
  body('Build the PDF report generator and the full analytics dashboard with interactive charts.'),
  blank(80),
  h2('Phase 4 — PDF Report Generation (PDFKit)'),
  body('Create backend/src/services/pdf.service.ts. This service generates a professional expense report and streams the binary to the client.'),
  blank(40),
  h3('Report Structure'),
  ...bullet([
    'Cover section: user name, report period (e.g. "May 2026"), total spent, currency',
    'Summary table: category | budgeted | actual | variance | % used — coloured rows for over-budget categories',
    'Expense list: date | description | category | amount — sorted by date, paginated across multiple PDF pages',
    'Charts section: a horizontal bar chart drawn with PDFKit\'s native line drawing primitives (no external chart lib needed)',
    'AI Summary section (optional): paste the latest Gemini text summary into the report footer',
    'Page numbers and generation timestamp in the footer of every page',
  ]),
  blank(40),
  h3('PDF Route Implementation'),
  ...codeBlock([
    '// backend/src/routes/report.routes.ts',
    'router.get("/monthly", authMiddleware, async (req, res) => {',
    '  const { month, year } = req.query;',
    '  const expenses = await expenseService.listForReport(req.userId, month, year);',
    '',
    '  res.setHeader("Content-Type", "application/pdf");',
    '  res.setHeader("Content-Disposition",',
    '    `attachment; filename="expenses-${year}-${month}.pdf"`);',
    '',
    '  const stream = pdfService.generateMonthlyReport(expenses, req.user);',
    '  stream.pipe(res);',
    '  stream.end();',
    '});',
  ]),
  blank(40),
  h3('Frontend Download Button'),
  ...bullet([
    'ReportGenerator component: month/year picker + "Download PDF" button',
    'On click: fetch /api/reports/monthly?month=5&year=2026 with responseType: "blob"',
    'Convert blob to an object URL and trigger a programmatic anchor click to download the file',
    'Show a progress spinner during the fetch; disable the button until complete',
  ]),
  blank(60),
  h2('Phase 4 — Analytics Dashboard'),
  blank(40),
  h3('Chart 1 — Monthly Spending Trend (Line Chart)'),
  ...bullet([
    'Data: last 12 months total spending aggregated with Prisma groupBy date trunc month',
    'Renders a Recharts LineChart with animated dots; hover tooltip shows exact total',
    'Overlay a second line for the average monthly budget if budgets are set',
  ]),
  blank(40),
  h3('Chart 2 — Category Breakdown (Donut Chart)'),
  ...bullet([
    'Data: current month spending grouped by category from /api/expenses/summary',
    'Recharts PieChart in donut mode; each slice coloured using the category\'s stored colour hex',
    'Clicking a slice drills down to show that category\'s expense list in a Sheet panel',
  ]),
  blank(40),
  h3('Chart 3 — Spending Heatmap (Calendar Grid)'),
  ...bullet([
    'Data: daily expense totals for the current month',
    'Rendered as a CSS Grid of 31 cells; cell background intensity scales with daily spend amount',
    'Built with pure Tailwind classes — no third-party heatmap library needed',
    'Hover tooltip shows the exact date total',
  ]),
  blank(40),
  h3('Chart 4 — Budget vs Actual Bar Chart'),
  ...bullet([
    'Data: current month\'s budgets joined with actual spending by category',
    'Recharts BarChart with two bars per category (budgeted in blue, actual in red if over, green if under)',
    'Over-budget categories highlighted with a warning icon in the legend',
  ]),
  ...callout(
    'Phase 4 Deliverable — Checklist',
    [
      'Clicking "Download PDF" produces a well-formatted expense report PDF with correct data',
      'All four charts render with real data from the API (not mock data)',
      'Clicking a donut slice opens the filtered expense list for that category',
      'Dashboard summary cards (Total Spent, Budget Used, Top Category, Largest Expense) update dynamically',
      'Reports page lets users select any past month and download its PDF',
    ],
    C.greenAcc, C.greenBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 5
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('5', 'Performance Optimisation', 'Week 7  |  ~15 hours', '92400E'),
  body('This phase is responsible for the 35% response time improvement claimed in the resume bullet. Every optimisation here is measurable and explainable in an interview.'),
  blank(80),
  h2('Phase 5 — Database Optimisations'),
  blank(40),
  h3('Optimisation 1 — Composite Indexes (biggest win)'),
  body('The Expense table already has these indexes in the schema from Phase 2. Add the migration:'),
  ...codeBlock([
    '-- 00X_add_expense_indexes.sql  (created by: npx prisma migrate dev)',
    'CREATE INDEX idx_expenses_user_date     ON "Expense" ("userId", "date" DESC);',
    'CREATE INDEX idx_expenses_user_category ON "Expense" ("userId", "categoryId");',
    '',
    '-- Before: sequential scan on 50k rows = ~180ms',
    '-- After:  index scan                  = ~12ms  (93% faster on this query)',
  ]),
  blank(40),
  h3('Optimisation 2 — Select Only Required Fields'),
  ...bullet([
    'Never use findMany without a select clause on large tables',
    'The expense list query selects only: id, amount, description, date, category.name, category.color, tags',
    'Omitting notes and receiptUrl from list queries reduces payload size by ~40%',
  ]),
  blank(40),
  h3('Optimisation 3 — Cursor-Based Pagination'),
  ...bullet([
    'Replace OFFSET pagination with cursor-based: WHERE id > lastCursor ORDER BY id LIMIT 20',
    'Offset pagination reads and discards N rows before returning results; cursor goes straight to the record',
    'For page 50 of 1000 records: offset takes ~90ms, cursor takes ~4ms',
  ]),
  blank(40),
  h3('Optimisation 4 — Single Aggregation Query for Summary'),
  body('Replace N+1 category queries with one Prisma groupBy:'),
  ...codeBlock([
    'const summary = await prisma.expense.groupBy({',
    '  by: ["categoryId"],',
    '  where: { userId, date: { gte: monthStart, lte: monthEnd } },',
    '  _sum: { amount: true },',
    '  _count: { id: true },',
    '});',
    '// One query instead of one per category — saves 5–15 round trips',
  ]),
  blank(60),
  h2('Phase 5 — Redis Caching'),
  blank(40),
  h3('What to Cache and for How Long'),
  ...makeTable(
    ['Cache Key Pattern', 'TTL', 'Invalidated When'],
    [3600, 1200, 4560],
    [
      ['expenses:list:{userId}:{filterHash}', '60 s',  'Any expense is created, updated, or deleted for this user'],
      ['expenses:summary:{userId}:{month}',   '5 min', 'Any expense is created/deleted in that month'],
      ['categories:{userId}',                 '1 hr',  'User creates or deletes a category'],
      ['ai:summary:{userId}:{month}',         '24 hr', 'User manually triggers "Regenerate Insights"'],
      ['exchangerate:{from}:{to}',            '1 hr',  'TTL only — exchange rates change hourly'],
    ],
    C.gray700
  ),
  h3('Cache Aside Pattern Implementation'),
  ...codeBlock([
    '// backend/src/services/cache.service.ts',
    'export async function withCache<T>(',
    '  key: string, ttl: number, fetcher: () => Promise<T>',
    '): Promise<T> {',
    '  const cached = await redis.get(key);',
    '  if (cached) return JSON.parse(cached) as T;',
    '',
    '  const data = await fetcher();',
    '  await redis.setex(key, ttl, JSON.stringify(data));',
    '  return data;',
    '}',
    '',
    '// Usage in expense.service.ts:',
    'return withCache(`expenses:summary:${userId}:${month}`, 300, () =>',
    '  prisma.expense.groupBy({ ... })',
    ');',
  ]),
  blank(60),
  h2('Phase 5 — API-Level Optimisations'),
  ...bullet([
    'Enable HTTP compression with the compression npm package on Express — reduces JSON payload size by 60–70%',
    'Add ETag headers to GET endpoints: clients can use If-None-Match for 304 Not Modified responses',
    'Connection pooling: Prisma uses a connection pool by default; set connection_limit=10 in the DB URL',
    'Rate limiting per user (express-rate-limit + Redis store): prevents any single user from hammering the AI endpoint',
  ]),
  ...callout(
    'Measuring the 35% Improvement',
    [
      'Use Apache Bench: ab -n 1000 -c 10 http://localhost:4000/api/expenses to benchmark before and after each change',
      'Record baseline P95 latency before Phase 5, then after each optimisation to show cumulative improvement',
      'Target: GET /api/expenses P95 < 80ms (from ~230ms baseline on 10k+ rows)',
      'Document each measurement in a PERFORMANCE.md file to discuss in interviews',
    ],
    C.amberAcc, C.amberBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PHASE 6
// ══════════════════════════════════════════════════════════════════════════════
add(
  ...phaseBanner('6', 'Testing & Deployment', 'Week 8  |  ~20 hours', '991B1B'),
  body('Write tests to prove the app works correctly, then deploy the full stack to production.'),
  blank(80),
  h2('Phase 6 — Testing Strategy'),
  blank(40),
  h3('Unit Tests (Vitest)'),
  ...bullet([
    'Test expense.service.ts: mock Prisma client using vi.mock("@prisma/client") and assert correct query parameters',
    'Test ai.service.ts: mock the Gemini SDK; assert the prompt contains the correct spending data',
    'Test pdf.service.ts: assert the PDF stream is created and has non-zero length',
    'Test Zod schemas: assert valid inputs pass and invalid inputs throw with the correct error message',
    'Target: 80%+ line coverage on all service files',
  ]),
  blank(40),
  h3('Integration Tests (Supertest)'),
  ...bullet([
    'Spin up a test Express app with a real test PostgreSQL database (use DATABASE_URL_TEST env var)',
    'Seed the test DB before each test suite; truncate after each test',
    'Test each API route: POST /api/expenses creates a record; GET /api/expenses returns it; DELETE removes it',
    'Test auth middleware: routes return 401 when no JWT is provided',
    'Test rate limiting: hitting an endpoint 101 times returns 429 on the 101st request',
  ]),
  blank(40),
  h3('Running Tests'),
  ...codeBlock([
    '# Unit tests (fast, no DB needed)',
    'npm run test              # runs vitest',
    'npm run test:coverage     # generates coverage report',
    '',
    '# Integration tests (needs Docker DB running)',
    'docker compose up -d postgres',
    'DATABASE_URL_TEST=postgresql://... npm run test:integration',
  ]),
  blank(60),
  h2('Phase 6 — Production Deployment'),
  blank(40),
  h3('Step 1 — Deploy Backend to Railway'),
  ...numbered([
    'Go to railway.app → New Project → Deploy from GitHub Repo → select the backend/ folder',
    'Add a Redis service in the same Railway project (one click)',
    'Set all environment variables from backend/.env in Railway\'s Variables tab',
    'Railway auto-detects Node.js and runs npm start; set start command to: node dist/server.js',
    'Add a custom domain or use the generated railway.app subdomain',
    'Run database migrations: add a Deploy Command: npx prisma migrate deploy',
  ]),
  blank(40),
  h3('Step 2 — Deploy Database to Neon'),
  ...numbered([
    'Go to neon.tech → Create project → Copy the connection string',
    'Add ?sslmode=require to the connection string',
    'Paste into Railway\'s DATABASE_URL environment variable',
    'Neon provides a serverless PostgreSQL with a free tier (3 GB storage, enough for portfolio use)',
  ]),
  blank(40),
  h3('Step 3 — Deploy Frontend to Vercel'),
  ...numbered([
    'Go to vercel.com → New Project → Import from GitHub → select the frontend/ folder',
    'Vercel auto-detects Next.js and configures the build correctly',
    'Set environment variables: NEXTAUTH_URL (your Vercel URL), NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_API_URL (your Railway backend URL)',
    'Update Google OAuth console: add your Vercel domain to Authorised redirect URIs',
    'Every push to main triggers an automatic redeploy on Vercel',
  ]),
  blank(40),
  h3('Step 4 — Deploy AI Worker'),
  ...bullet([
    'The BullMQ worker must run as a separate process alongside the Express server',
    'In Railway: add a second service in the same project, pointing to the same repo but with start command: node dist/workers/ai.worker.js',
    'Both services share the same Redis instance via the REDIS_URL environment variable',
    'Railway\'s free tier supports two services; upgrade to Hobby ($5/month) if needed',
  ]),
  ...callout(
    'Phase 6 Deliverable — Checklist',
    [
      'All unit tests pass with 80%+ coverage: npm run test:coverage',
      'Integration tests pass against the test database',
      'Frontend is live on Vercel; Google OAuth works with the production domain',
      'Backend API is accessible at the Railway URL; GET /api/health returns { status: "ok" }',
      'Prisma migrations have been applied to the Neon production database',
      'AI worker is running and processing jobs from the production Redis queue',
      'PDF download works end-to-end in production',
    ],
    C.greenAcc, C.greenBg
  ),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  API REFERENCE
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('7. Full API Reference'),
  blank(60),
  h2('Authentication'),
  body('All API endpoints except /api/health require a Bearer JWT token in the Authorization header:'),
  ...codeBlock([
    'Authorization: Bearer <jwt_token>',
    '',
    '# Token is obtained from NextAuth session:',
    'const session = await getSession();',
    'const token = session.accessToken;',
  ]),
  blank(60),
  h2('Error Response Format'),
  body('All errors follow this consistent shape:'),
  ...codeBlock([
    '{',
    '  "error":   "Validation failed",',
    '  "code":    "VALIDATION_ERROR",',
    '  "status":  400,',
    '  "details": [{ "field": "amount", "message": "Must be a positive number" }]',
    '}',
  ]),
  blank(60),
  h2('Expense Endpoints'),
  ...makeTable(
    ['Endpoint', 'Query / Body', 'Response'],
    [3000, 3200, 3160],
    [
      ['GET /api/expenses',      '?cursor, limit=20, categoryId, from, to, search', '{ data: Expense[], nextCursor, total }'],
      ['POST /api/expenses',     '{ amount, currency, description, date, categoryId, tags?, notes? }', '{ data: Expense }'],
      ['GET /api/expenses/:id',  '-', '{ data: Expense }'],
      ['PATCH /api/expenses/:id','Partial body — any expense fields', '{ data: Expense }'],
      ['DELETE /api/expenses/:id','-', '{ data: { id } }'],
      ['GET /api/expenses/summary','?month, year', '{ data: CategorySummary[], total }'],
    ],
    C.blueDark
  ),
  h2('AI Endpoints'),
  ...makeTable(
    ['Endpoint', 'Body', 'Response'],
    [3000, 3200, 3160],
    [
      ['POST /api/ai/insights',        '{ type: "summary"|"anomaly"|"advice", month?, year? }', '{ data: { jobId } }'],
      ['GET /api/ai/insights/:jobId',  '-', '{ data: { status, result?, error? } }'],
      ['GET /api/ai/insights/latest',  '-', '{ data: { summary?, anomalies?, advice? } }'],
    ],
    C.blueDark
  ),
  blank(100),
  para([new PageBreak()], { after: 0 }),
);

// ══════════════════════════════════════════════════════════════════════════════
//  PERFORMANCE TARGETS
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('8. Performance Targets'),
  blank(60),
  ...makeTable(
    ['Metric', 'Before Optimisation', 'After Optimisation', 'How'],
    [2800, 2200, 2200, 2160],
    [
      ['GET /api/expenses P95 latency',   '~230 ms', '< 80 ms',  'Composite index + cursor pagination + Redis cache'],
      ['GET /api/expenses/summary P95',   '~180 ms', '< 30 ms',  'groupBy instead of N queries + Redis TTL 5 min'],
      ['PDF generation time',             '~3 s',    '< 1.5 s',  'Parallel data fetching + stream response (no buffering)'],
      ['AI insight generation',           '5–10 s',  '< 2 s*',   '*Returns cached result; fresh job runs async in worker'],
      ['Dashboard initial load',          '~2.1 s',  '< 700 ms', 'Next.js SSR + React Query prefetch + HTTP compression'],
      ['DB connection overhead',          '~40 ms',  '< 5 ms',   'Prisma connection pool (limit=10) reuses connections'],
    ],
    C.blueDark
  ),
  blank(100),
);

// ══════════════════════════════════════════════════════════════════════════════
//  ROADMAP
// ══════════════════════════════════════════════════════════════════════════════
add(
  h1('9. Roadmap & Future Features'),
  blank(60),
  h3('Near-term (after initial launch)'),
  ...bullet([
    'Receipt OCR: upload a photo of a receipt; use Google Vision API (free tier) to extract amount and merchant',
    'Recurring expenses: mark an expense as recurring (weekly/monthly); auto-create future entries via a cron job',
    'CSV import: paste or upload a bank statement CSV; map columns and bulk-import expenses',
    'Team/shared expenses: invite family members to a shared workspace; split expenses by percentage',
  ]),
  blank(60),
  h3('Long-term'),
  ...bullet([
    'Mobile app: React Native Expo sharing the same TypeScript types and backend API',
    'Bank sync: integrate with Plaid (or a free alternative like Nordigen for EU) to auto-import transactions',
    'Predictive budgeting: use Gemini to forecast next month\'s spending based on historical trends',
    'Multi-workspace: multiple named expense workspaces (personal, business, travel) per account',
  ]),
  blank(100),
  para([run('End of Document', { italic: true, color: C.muted, size: 20 }), run('  —  Smart Expense Tracker with AI Insights 2026', { color: C.muted, size: 20 })], { after: 0, align: AlignmentType.CENTER }),
);

// ── Build doc ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ]
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }
        ]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 22, color: C.dark } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: C.blueDark },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: C.blue },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: C.slate },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      }
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/Smart_Expense_Tracker_README.docx', buf);
  console.log('Done:', buf.length, 'bytes');
});
