/*  local: place-media.mjs — 把使用者自備的音檔與歌詞對齊到站點目錄。
 *
 *  用法：
 *    node _data/place-media.mjs --artist jj-lin --from "D:\我的音樂\林俊傑"
 *    node _data/place-media.mjs --artist jj-lin --from "..." --write
 *
 *  它在做什麼：
 *    1. 從 js/data.js 讀該歌手的專輯與曲目（權威來源，不另建清單）
 *    2. 掃描來源目錄（遞迴）的音檔與 sidecar .lrc
 *    3. 依「檔名序號 → 曲名」對應曲目；檔名沒有序號時用曲名比對
 *    4. 用 FLAC 檔頭時長交叉驗證，把重名與多專輯的歧義解掉
 *    5. 硬連結到 assets/audio/<專輯id>/<兩位序號> <曲名>.<副檔名>
 *       （同卷硬連結，不佔額外空間；刪任一邊資料都還在）
 *
 *  為什麼硬連結而不是複製：一張母帶級 FLAC 可達 200 MB，複製會讓磁碟用量翻倍。
 *
 *  邊界：音檔必須是使用者合法取得的自有檔案（自有 CD 抓軌、購買的 DRM-free 下載）。
 *  音檔、歌詞與登記檔都不進版本庫，見 .gitignore。
 *  落盤後要跑 `node _data/local-audio.mjs --write` 登記，再 `npm run build:local`。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
};
const artistId = opt('artist');
const fromDir = opt('from');
const WRITE = argv.includes('--write');

if (!artistId || !fromDir) {
  console.error('用法：node _data/place-media.mjs --artist <歌手id> --from <來源目錄> [--write]');
  process.exit(2);
}
if (!fs.existsSync(fromDir)) {
  console.error(`來源目錄不存在：${fromDir}`);
  process.exit(2);
}

const AUDIO_EXT = new Set(['.flac', '.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav']);

/* ---------- 讀站點資料（權威曲目表） ---------- */
globalThis.window = {};
new Function(fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8'))();
const D = globalThis.window.DISCOGRAPHY;
const artist = D.artists[artistId];
if (!artist) {
  console.error(`js/data.js 裡沒有歌手 ${artistId}（先跑 npm run build）`);
  process.exit(2);
}
const toS = D.toSimplified;

/* ---------- 正規化與比對 ---------- */
const PUNCT = /[\u3000-\u303f\uff00-\uff0f\uff1a-\uff20\u2010-\u2027·・.,!?:;'"“”‘’\-—_/\\\s]+/g;
function norm(s) {
  let t = String(s)
    .replace(/[（(][^）)]*[）)]/g, ' ')
    .replace(/[《》〈〉「」『』【】]/g, ' ')
    .replace(PUNCT, '')
    .toLowerCase();
  try {
    t = toS(t);
  } catch {
    /* 轉換表不可用時退回原樣 */
  }
  return t;
}
function distance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const pad2 = (n) => String(n).padStart(2, '0');
const stripExt = (name) => name.replace(/\.[^.]+$/, '');

/* FLAC 檔頭的總取樣數 ÷ 取樣率，用來確認對到的是不是那一首 */
function flacSeconds(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(8);
    if (fs.readSync(fd, head, 0, 8, 0) < 8) return null;
    if (head.toString('latin1', 0, 4) !== 'fLaC') return null;
    const info = Buffer.alloc(34);
    if (fs.readSync(fd, info, 0, 34, 8) < 34) return null;
    const rate = (info[10] << 12) | (info[11] << 4) | (info[12] >> 4);
    const total = (info[13] & 0x0f) * 4294967296 + info.readUInt32BE(14);
    if (!rate || !total) return null;
    return total / rate;
  } catch {
    return null;
  } finally {
    if (fd !== undefined)
      try {
        fs.closeSync(fd);
      } catch {
        /* 關閉失敗不影響已讀到的結果 */
      }
  }
}

/* ---------- 來源清單 ---------- */
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const sourceFiles = walk(fromDir);
const audioFiles = sourceFiles.filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()));
const lrcByBase = new Map();
for (const f of sourceFiles) {
  if (path.extname(f).toLowerCase() === '.lrc') {
    lrcByBase.set(stripExt(path.basename(f)).toLowerCase(), f);
  }
}

/* ---------- 目標曲目表 ---------- */
const tracks = [];
artist.albums.forEach((a) => {
  a.tracks.forEach((t) => {
    tracks.push({
      albumId: a.id,
      albumTitle: a.title,
      year: a.year,
      n: t.n,
      zh: t.zh,
      sec: t.sec,
      key: norm(t.zh)
    });
  });
});
const byKey = new Map();
for (const t of tracks) {
  if (!byKey.has(t.key)) byKey.set(t.key, []);
  byKey.get(t.key).push(t);
}

/* ---------- 對應 ---------- */
const plan = [];
const unmatched = [];
const fuzzy = [];
const problems = [];
let durChecked = 0;
let durOk = 0;

for (const file of audioFiles) {
  const base = stripExt(path.basename(file));
  const key = norm(base);
  const sec = flacSeconds(file);
  let cands = byKey.get(key) || [];
  let how = 'title';
  if (!cands.length) {
    const near = tracks.filter((t) => t.key.length >= 4 && distance(t.key, key) <= 1);
    if (near.length === 1) {
      cands = near;
      how = 'fuzzy';
      fuzzy.push({ base, zh: near[0].zh });
    }
  }
  if (!cands.length) {
    unmatched.push(base);
    continue;
  }
  if (cands.length > 1) {
    const bySec = sec ? cands.filter((c) => c.sec != null && Math.abs(c.sec - sec) <= 3) : [];
    if (bySec.length === 1) {
      cands = bySec;
      how = 'length';
    } else if (bySec.length > 1) {
      cands = bySec;
      problems.push(
        `${base}：多張專輯同時命中（${bySec.map((c) => c.albumId).join('、')}），取發行較早者`
      );
    } else {
      problems.push(
        `${base}：同名多曲且時長無法分辨（${cands.map((c) => c.albumId).join('、')}），取先出現者`
      );
    }
  }
  const pick = cands[0];
  if (sec && pick.sec) {
    durChecked++;
    if (Math.abs(sec - pick.sec) <= 3) durOk++;
    else
      problems.push(
        `${base}：時長對不上，檔案 ${sec.toFixed(1)}s vs 資料 ${pick.sec}s` +
          `（差 ${(sec - pick.sec).toFixed(1)}s）`
      );
  }
  const ext = path.extname(file).toLowerCase();
  const lrc = lrcByBase.get(base.toLowerCase()) || null;
  plan.push({ file, ext, lrc, pick, how });
}

/* 同一首被多個檔案命中時只留第一個，其餘報出來 */
const taken = new Map();
const finalPlan = [];
for (const p of plan) {
  const slot = p.pick.albumId + '-' + p.pick.n;
  if (taken.has(slot)) {
    problems.push(
      `${path.basename(p.file)}：第 ${p.pick.n} 首已有檔案（${taken.get(slot)}），已略過`
    );
    continue;
  }
  taken.set(slot, path.basename(p.file));
  finalPlan.push(p);
}
const missing = tracks.filter((t) => !taken.has(t.albumId + '-' + t.n));

/* ---------- 報告 ---------- */
console.log(
  `歌手 ${artistId}（${artist.name}）：${artist.albums.length} 張專輯、${tracks.length} 首`
);
console.log(`來源 ${fromDir}`);
console.log(`掃到音檔 ${audioFiles.length} 個、歌詞 ${lrcByBase.size} 個`);
console.log(
  `對上 ${finalPlan.length} 首（曲名 ${finalPlan.filter((p) => p.how === 'title').length}、` +
    `時長消歧 ${finalPlan.filter((p) => p.how === 'length').length}、` +
    `異體字 ${finalPlan.filter((p) => p.how === 'fuzzy').length}）`
);
console.log(`時長校驗 ${durOk}/${durChecked} 相符（容差 3 秒）`);
if (fuzzy.length) {
  console.log('\n異體字兜底（請人工確認）：');
  fuzzy.forEach((f) => console.log(`  來源「${f.base}」 → 曲目「${f.zh}」`));
}
if (problems.length) {
  console.log('\n需要處理：');
  problems.forEach((p) => console.log('  ! ' + p));
}
console.log(`\n來源裡多出 ${unmatched.length} 個（不屬這 ${tracks.length} 首）：`);
unmatched.slice(0, 40).forEach((u) => console.log('  ' + u));
if (unmatched.length > 40) console.log(`  …另有 ${unmatched.length - 40} 個`);
console.log(`\n資料裡仍缺 ${missing.length} 首：`);
missing.slice(0, 40).forEach((m) => console.log(`  ${m.albumTitle} #${m.n} ${m.zh}`));
if (missing.length > 40) console.log(`  …另有 ${missing.length - 40} 首`);

if (!WRITE) {
  console.log('\n這是報告模式，未寫入任何檔案。要落盤請加 --write。');
  process.exit(0);
}

/* ---------- 落盤（硬連結） ---------- */
let linked = 0;
let lrcLinked = 0;
let reused = 0;
let failed = 0;
for (const p of finalPlan) {
  const dir = path.join(root, 'assets', 'audio', p.pick.albumId);
  fs.mkdirSync(dir, { recursive: true });
  const destName = `${pad2(p.pick.n)} ${p.pick.zh}${p.ext}`;
  const dest = path.join(dir, destName);
  if (fs.existsSync(dest)) {
    const a = fs.statSync(p.file);
    const b = fs.statSync(dest);
    if (a.ino === b.ino && a.dev === b.dev) reused++;
    else {
      problems.push(`${destName} 已存在且非同源，未覆蓋`);
      failed++;
    }
  } else {
    try {
      fs.linkSync(p.file, dest);
      linked++;
    } catch (e) {
      failed++;
      problems.push(`${destName}：硬連結失敗 ${e.message}`);
    }
  }
  if (p.lrc) {
    const ldest = path.join(dir, `${pad2(p.pick.n)} ${p.pick.zh}.lrc`);
    try {
      if (!fs.existsSync(ldest)) {
        fs.linkSync(p.lrc, ldest);
        lrcLinked++;
      }
    } catch (e) {
      problems.push(`${path.basename(ldest)}：歌詞硬連結失敗 ${e.message}`);
    }
  }
}
console.log(
  `\n已落盤：音檔 ${linked} 個（已同源 ${reused}）、歌詞 ${lrcLinked} 個、失敗 ${failed}`
);
console.log('下一步：node _data/local-audio.mjs --write && npm run build:local');
