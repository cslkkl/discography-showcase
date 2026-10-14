/* 給 HTML 裡的本地 js/css 引用加上版本號，避免「HTML 已更新、JS 還是快取的舊版」
   而混版。混版的後果不是樣式走鐘，而是**整頁卡死**：舊 JS 找不到已被刪掉的元素就
   在 addEventListener 拋錯，初始化中斷，唱片架停在「全部封面疊在中央」的狀態。

   版本字串取 js/、css/ 與 assets/fonts/fonts.css 的內容雜湊（同日改動也會換值）；
   純日期不行——同一天先後兩次改動會得到同一個版本號，
   使用者手上的舊 JS 不會被換掉，混版照樣發生。
   字體表也在範圍內：@font-face 換檔而 HTML 引用沒換，舊快取會缺新 face，
   瀏覽器會靜默回退到下一個字組，看不出壞掉、只看得出「字不對」。

   用法：node _data/stamp-assets.mjs [版本字串]
   不給版本時自動按內容雜湊算；值不變時不動檔案。 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);

/* 蓋章之前先驗語法。先前的缺口：js/ 有語法錯誤時 stamp 照樣換版本號，
   於是 HTML 會引用一個根本跑不起來的腳本——那正是「整頁卡死」那類事故，
   而且畫面上看不出是語法問題。用 vm.Script 只解析不執行，無副作用。
   （app.js / landing.js / lyrics.js 都是非模組的經典腳本。） */
function assertParses(file, abs) {
  try {
    new vm.Script(fs.readFileSync(abs, 'utf8'), { filename: file });
  } catch (e) {
    console.error(`· ${file} 語法錯誤，已中止蓋章：${e.message}`);
    process.exit(1);
  }
}

/* 只涵蓋 HTML 會引用的資源，逐檔吃內容；排序保證可重現。
   排除生成物 data.js：它有公開態與本機態兩種內容，算進來會讓版本戳隨建置狀態
   漂移——同一份原始碼在 `npm run build` 與 `npm run listen` 之後會算出兩個版本，
   而提交的是公開態那個，本機聽歌時就永遠對不上。 */
const SKIP = new Set(['data.js']);
/* HTML 直接引用的單檔資源（不在 js/、css/ 之下）：字體表。
   它與 css/ 同性質——都是站點執行期樣式，改了就必須換版本號。 */
const EXTRA = ['assets/fonts/fonts.css'];
function contentStamp() {
  const h = crypto.createHash('sha256');
  for (const rel of EXTRA) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    h.update(rel + '\u0000');
    h.update(fs.readFileSync(abs));
    h.update('\u0000');
  }
  for (const dir of ['js', 'css']) {
    const abs = path.join(root, dir);
    let names;
    try {
      names = fs
        .readdirSync(abs)
        .filter((n) => /\.(js|css)$/.test(n) && !SKIP.has(n))
        .sort();
    } catch {
      continue;
    }
    for (const n of names) {
      const rel = dir + '/' + n;
      if (n.endsWith('.js')) assertParses(rel, path.join(abs, n));
      h.update(rel + '\u0000');
      h.update(fs.readFileSync(path.join(abs, n)));
      h.update('\u0000');
    }
  }
  return h.digest('hex').slice(0, 8);
}

const stamp = argv[0] || contentStamp();

const FILES = ['index.html', 'artist.html'];
const RE =
  /(src|href)="((?:js\/[A-Za-z0-9_.-]+\.js|css\/[A-Za-z0-9_.-]+\.css|assets\/fonts\/fonts\.css))(\?v=[^"]*)?"/g;

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
