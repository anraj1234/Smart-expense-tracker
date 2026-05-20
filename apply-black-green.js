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
  
  const replacements = [
    { from: /dark:bg-slate-900/g, to: 'dark:bg-black' },
    { from: /dark:bg-slate-950\/50/g, to: 'dark:bg-[#0a0a0a]' },
    { from: /dark:bg-slate-950/g, to: 'dark:bg-black' },
    { from: /dark:bg-slate-800/g, to: 'dark:bg-[#111111]' },
    { from: /dark:text-slate-50/g, to: 'dark:text-emerald-400' },
    { from: /dark:text-slate-200/g, to: 'dark:text-emerald-300' },
    { from: /dark:text-slate-300/g, to: 'dark:text-emerald-500' },
    { from: /dark:text-slate-400/g, to: 'dark:text-emerald-600' },
    { from: /dark:border-slate-800/g, to: 'dark:border-emerald-900/40' },
    { from: /dark:border-slate-700/g, to: 'dark:border-emerald-900/60' },
  ];

  let newContent = content;
  for (const r of replacements) {
    newContent = newContent.replace(r.from, r.to);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated theme in ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'smart_expense/app'), processFile);
walkDir(path.join(__dirname, 'smart_expense/components'), processFile);

console.log("Done applying black and green theme.");
