/* 給 HTML 裡的本地 js/css 引用加上版本號，避免「HTML 已更新、JS 還是快取的舊版」
   而混版。混版的後果不是樣式走鐘，而是**整頁卡死**：舊 JS 找不到已被刪掉的元素就
   在 addEventListener 拋錯，初始化中斷，唱片架停在「全部封面疊在中央」的狀態。

   用法：node _data/stamp-assets.mjs [版本字串]
   版本字串預設取當天日期；改過 js/ 或 css/ 就重跑一次（值不變時不動檔案）。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const stamp = argv[0] || new Date().toISOString().slice(0, 10).replace(/-/g, '');

const FILES = ['index.html', 'artist.html'];
const RE = /(src|href)="((?:js\/[A-Za-z0-9_.-]+\.js|css\/[A-Za-z0-9_.-]+\.css))(\?v=[^"]*)?"/g;

let changed = 0;
for (const f of FILES) {
  const p = path.join(root, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(RE, (m, attr, url) => `${attr}="${url}?v=${stamp}"`);
  if (after !== before) {
    fs.writeFileSync(p, after, 'utf8');
    changed++;
    console.log(`· ${f} 已更新為 ?v=${stamp}`);
  } else {
    console.log(`· ${f} 已是 ?v=${stamp}`);
  }
}
console.log(`完成：${changed} 個檔案有變動（版本 ${stamp}）`);
