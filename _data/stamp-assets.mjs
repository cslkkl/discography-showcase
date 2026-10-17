/* 給 HTML 裡的本地 js/css 引用加上版本號，避免「HTML 已更新、JS 還是快取的舊版」
   而混版。混版的後果不是樣式走鐘，而是**整頁卡死**：舊 JS 找不到已被刪掉的元素就
   在 addEventListener 拋錯，初始化中斷，唱片架停在「全部封面疊在中央」的狀態。

   版本字串取 js/、css/、assets/fonts/fonts.css 與 **stage/dist/** 的內容雜湊
   （同日改動也會換值）；純日期不行——同一天先後兩次改動會得到同一個版本號，
   使用者手上的舊 JS 不會被換掉，混版照樣發生。
   字體表也在範圍內：@font-face 換檔而 HTML 引用沒換，舊快取會缺新 face，
   瀏覽器會靜默回退到下一個字組，看不出壞掉、只看得出「字不對」。

   stage/dist/ 為什麼也要在範圍內：舞台的產物（lyric-stage.js 與 assets/lyric-stage.css）
   是**固定檔名**，由 js/lyric-stage.js 以固定 URL 動態載入，HTML 引用不到它們。
   只蓋 HTML 的章，重建舞台之後瀏覽器仍會沿用舊模組——同一個混版事故、換一個入口。
   所以這個版本號同時被寫進 js/lyric-stage.js 的 STAGE_VERSION 常數，
   由載入器接到兩個產物 URL 上（`stage/dist/**?v=<版本>`）。

   自引用怎麼避免：STAGE_VERSION 的**值本身**不進雜湊——算雜湊前先把那一行歸一化，
   否則會變成「寫進去 → 內容變 → 雜湊變 → 再寫」永遠不收敛。
   這與 data.js 被排除是同一個道理（它會隨建置狀態漂移，算進來版本就對不上）。

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

/* 版本常數在 js/lyric-stage.js 裡的位置。載入器讀它、stamp 寫它；
   這一行是兩邊唯一的契約，改字串要兩邊一起改。 */
const MARKER = /(\/\* stamp:stage-version \*\/\s*var STAGE_VERSION = ')[^']*(')/;

/* 算雜湊前把版本常數的值歸一化：值不參與雜湊，版本才會收敛。 */
function normalize(text) {
  return MARKER.test(text) ? text.replace(MARKER, "$1'\u0000'$2") : text;
}

/* 只涵蓋 HTML 會引用的資源，逐檔吃內容；排序保證可重現。
   排除生成物 data.js：它有公開態與本機態兩種內容，算進來會讓版本戳隨建置狀態
   漂移——同一份原始碼在 `npm run build` 與 `npm run listen` 之後會算出兩個版本，
   而提交的是公開態那個，本機聽歌時就永遠對不上。 */
const SKIP = new Set(['data.js']);
/* HTML 直接引用的單檔資源（不在 js/、css/ 之下）：字體表。
   它與 css/ 同性質——都是站點執行期樣式，改了就必須換版本號。 */
const EXTRA = ['assets/fonts/fonts.css'];
/* 檔名固定、但由 JS 動態載入的產物樹（HTML 引用不到，所以要一起進雜湊）。 */
const TREES = ['stage/dist'];

/** 遞迴列出目錄下的檔案，回傳相對於 base 的 POSIX 路徑並排序。 */
function walk(abs, base) {
  const found = [];
  const stack = [abs];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue; /* 目錄不存在（尚未建置舞台）就當作沒有 */
    }
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile()) {
        found.push(path.relative(base, p).split(path.sep).join('/'));
      }
    }
  }
  return found.sort();
}

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
      const text = fs.readFileSync(path.join(abs, n), 'utf8');
      if (n.endsWith('.js')) assertParses(rel, path.join(abs, n));
      h.update(rel + '\u0000');
      h.update(normalize(text));
      h.update('\u0000');
    }
  }
  for (const tree of TREES) {
    const abs = path.join(root, tree);
    for (const rel of walk(abs, root)) {
      h.update(rel + '\u0000');
      h.update(fs.readFileSync(path.join(root, rel)));
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

/* 舞台產物的版本：同一個版本號寫進載入器的常數，讓兩個固定檔名的產物
   也能帶上 `?v=`。沒有這個，重建舞台等於對快取無效。 */
const loaderRel = 'js/lyric-stage.js';
const loaderPath = path.join(root, loaderRel);
const loaderBefore = fs.readFileSync(loaderPath, 'utf8');
if (!MARKER.test(loaderBefore)) {
  console.error(`· ${loaderRel} 找不到 STAGE_VERSION 標記，舞台產物版本未寫入。`);
  console.error("  預期此行：/* stamp:stage-version */ var STAGE_VERSION = '...';");
  process.exit(1);
}
const loaderAfter = loaderBefore.replace(MARKER, `$1${stamp}$2`);
if (loaderAfter !== loaderBefore) {
  fs.writeFileSync(loaderPath, loaderAfter, 'utf8');
  changed++;
  console.log(`· ${loaderRel} 的 STAGE_VERSION 已更新為 ${stamp}`);
} else {
  console.log(`· ${loaderRel} 的 STAGE_VERSION 已是 ${stamp}`);
}
console.log(`完成：${changed} 個檔案有變動（版本 ${stamp}）`);
