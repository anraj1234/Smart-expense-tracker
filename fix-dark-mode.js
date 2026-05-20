const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Basic safe replacements
  const replacements = [
    { from: /\bbg-white\b(?! dark:bg-)/g, to: 'bg-white dark:bg-slate-900' },
    { from: /\bborder-slate-100\b(?! dark:border-)/g, to: 'border-slate-100 dark:border-slate-800' },
    { from: /\bborder-slate-200\b(?! dark:border-)/g, to: 'border-slate-200 dark:border-slate-800' },
    { from: /\btext-slate-900\b(?! dark:text-)/g, to: 'text-slate-900 dark:text-slate-50' },
    { from: /\btext-slate-500\b(?! dark:text-)/g, to: 'text-slate-500 dark:text-slate-400' },
    { from: /\bbg-slate-50\b(?! dark:bg-)/g, to: 'bg-slate-50 dark:bg-slate-950/50' },
    { from: /\bbg-slate-100\b(?! dark:bg-)/g, to: 'bg-slate-100 dark:bg-slate-800' },
    { from: /\bbg-white\/60\b(?! dark:bg-)/g, to: 'bg-white/60 dark:bg-slate-900/60' },
    { from: /\bborder-white\/40\b(?! dark:border-)/g, to: 'border-white/40 dark:border-slate-700/40' },
  ];

  let newContent = content;
  for (const r of replacements) {
    newContent = newContent.replace(r.from, r.to);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'smart_expense/app'), processFile);
walkDir(path.join(__dirname, 'smart_expense/components'), processFile);

console.log("Done adding dark mode classes.");
