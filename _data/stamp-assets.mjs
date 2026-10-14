/* 給 HTML 裡的本地 js/css 引用加上版本號，避免「HTML 已更新、JS 還是快取的舊版」
   而混版。混版的後果不是樣式走鐘，而是**整頁卡死**：舊 JS 找不到已被刪掉的元素就
   在 addEventListener 拋錯，初始化中斷，唱片架停在「全部封面疊在中央」的狀態。

   版本字串取 js/ 與 css/ 全部檔案的內容雜湊（同日改動也會換值）；
   純日期不行——同一天先後兩次改動會得到同一個版本號，
   使用者手上的舊 JS 不會被換掉，混版照樣發生。

   用法：node _data/stamp-assets.mjs [版本字串]
   不給版本時自動按內容雜湊算；值不變時不動檔案。 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

/* 只涵蓋 HTML 會引用的兩個目錄，逐檔吃內容；排序保證可重現 */
function contentStamp() {
  const h = crypto.createHash('sha256');
  for (const dir of ['js', 'css']) {
    const abs = path.join(root, dir);
    let names;
    try {
      names = fs
        .readdirSync(abs)
        .filter((n) => /\.(js|css)$/.test(n))
        .sort();
    } catch {
      continue;
    }
    for (const n of names) {
      h.update(dir + '/' + n + '\u0000');
      h.update(fs.readFileSync(path.join(abs, n)));
      h.update('\u0000');
    }
  }
  return h.digest('hex').slice(0, 8);
}

const stamp = argv[0] || contentStamp();

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
