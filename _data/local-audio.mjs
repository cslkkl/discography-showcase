/*  local-audio.mjs — 掃描自有音檔目錄，生成 _data/local-audio.json。
 *
 *  用法：
 *    node _data/local-audio.mjs                  # 只報告（不寫檔）
 *    node _data/local-audio.mjs --write          # 寫出 _data/local-audio.json
 *    node _data/local-audio.mjs --write --rename # 另把檔名正規化成 <序號>.<副檔名>
 *    node _data/local-audio.mjs --artist jay-chou [--album jay2000]
 *
 *  目錄約定：assets/audio/<專輯id>/<任意檔名>.<m4a|mp3|aac|flac|opus|ogg|wav>
 *
 *  檔名對應規則（先看檔名前綴，再看曲名）：
 *    1. 檔名以數字開頭（"01"、"1 -"、"03."、"07 可愛女人"）→ 取該序號
 *    2. 否則正規化檔名（去空白標點、統一字形）後與該專輯曲名比對，
 *       同時比對繁體原名與簡體轉換結果
 *
 *  輸出格式與 build.mjs 的消費方式一致：{ "<專輯id>-<序號>": "<相對路徑>" }
 *  本工具只寫 local-audio.json，不改 js/data.js；寫完要跑 npm run build。
 *
 *  邊界：音檔由使用者自備且須合法取得（自有 CD 抓軌、購買的 DRM-free 數位專輯）。
 *  音檔與本 json 都不進版本庫，見 .gitignore。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const WRITE = argv.includes('--write');
const RENAME = argv.includes('--rename');
const onlyArtist = opt('artist');
const onlyAlbum = opt('album');

const AUDIO_EXT = new Set(['.m4a', '.mp3', '.aac', '.flac', '.opus', '.ogg', '.wav']);
const AUDIO_DIR = path.join(root, 'assets', 'audio');
const OUT_FILE = path.join(here, 'local-audio.json');

/* ---------- 讀取站點資料（js/data.js 是唯一事實來源） ---------- */
function loadDataset() {
  const file = path.join(root, 'js', 'data.js');
  if (!fs.existsSync(file)) {
    fail('找不到 js/data.js，先跑 npm run build');
  }
  globalThis.window = {};
  return import(fileToUrl(file)).then(() => globalThis.window.DISCOGRAPHY);
}

const fileToUrl = (p) => 'file:///' + p.replace(/\\/g, '/').replace(/^\//, '');

function fail(msg) {
  console.error('錯誤：' + msg);
  process.exit(1);
}

/* ---------- 檔名與曲名的正規化比對 ---------- */
const stripExt = (name) => name.replace(/\.[^.]+$/, '');

/* 全形轉半形、去空白與標點、統一引號與大小寫 */
function normalize(s) {
  return s
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[\s.,\-_()[\]{}'"'!?&·、，。！？：；「」『』（）【】《》]/g, '')
    .toLowerCase();
}

/* 檔名前綴的序號：01 / 1 / 03. / 07 - / [05] */
function leadingNumber(name) {
  const m = stripExt(name).match(/^\s*[[(]?(\d{1,3})[\])]?\s*[-._、]?\s*(?=\D|$)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

/* 改名目標：只補正兩位數序號，後面的描述文字原樣保留。
   檔名本來就正確時回傳原值，呼叫方據此判斷是否需要改名。 */
function renameTarget(file, n) {
  const ext = path.extname(file).toLowerCase();
  const base = stripExt(file)
    .replace(/^\s*[[(]?\d{1,3}[\])]?\s*[-._、]?\s*/, '')
    .trim();
  const num = String(n).padStart(2, '0');
  return base ? `${num} ${base}${ext}` : `${num}${ext}`;
}

/* ---------- 主流程 ---------- */
const D = await loadDataset();
if (!D || !D.order || !D.order.length) fail('js/data.js 裡沒有歌手資料');

/* 專輯索引：id → { artist, id, title, tracks: [{ n, zh }] } */
const albums = new Map();
const tracksByAlbum = new Map();
for (const artistId of D.order) {
  const a = D.artists[artistId];
  for (const al of a.albums || []) {
    albums.set(al.id, { artist: artistId, id: al.id, title: al.title, years: al.year });
    tracksByAlbum.set(
      al.id,
      (al.tracks || []).map((t) => ({ n: t.n, zh: t.zh, sec: t.sec, len: t.len }))
    );
  }
}

if (!fs.existsSync(AUDIO_DIR)) {
  console.log('assets/audio/ 不存在，沒有可登記的音檔。');
  console.log('目錄約定：assets/audio/<專輯id>/<檔名>.<m4a|mp3|...>');
  console.log('專輯 id 清單可跑：node _data/local-audio.mjs --list-albums');
  if (argv.includes('--list-albums')) {
    for (const [id, al] of albums)
      console.log(`${id.padEnd(16)} ${String(al.years).padEnd(6)} ${al.title}`);
  }
  process.exit(0);
}

if (argv.includes('--list-albums')) {
  for (const [id, al] of albums)
    console.log(`${id.padEnd(16)} ${String(al.years).padEnd(6)} ${al.title}`);
  process.exit(0);
}

const dirs = fs
  .readdirSync(AUDIO_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => !onlyAlbum || name === onlyAlbum)
  .filter((name) => {
    if (!onlyArtist) return true;
    const al = albums.get(name);
    return al && al.artist === onlyArtist;
  })
  .sort();

const entries = {}; // "<albumId>-<n>" -> 相對路徑
const matches = []; // { albumId, n, dir, file }；改名後據此組出路徑
const plan = []; // 待正規化的檔名
const problems = [];
let fileCount = 0;
let matchedCount = 0;

for (const albumId of dirs) {
  const tracks = tracksByAlbum.get(albumId);
  if (!tracks) {
    problems.push(
      `目錄 ${albumId}/ 不是已知的專輯 id，已跳過（整目錄 ${countFiles(path.join(AUDIO_DIR, albumId))} 個檔案）`
    );
    continue;
  }
  const dir = path.join(AUDIO_DIR, albumId);
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile() && AUDIO_EXT.has(path.extname(f.name).toLowerCase()))
    .map((f) => f.name)
    .sort();

  const byNumber = new Map();
  const byTitle = new Map();
  const unreadable = [];

  /* 同專輯內的曲名正規化索引（繁體原名 + 簡體轉換），同名曲目取先出現的 */
  for (const t of tracks) {
    const keys = new Set([normalize(t.zh)]);
    if (D.toSimplified) keys.add(normalize(D.toSimplified(t.zh)));
    for (const k of keys) if (k && !byTitle.has(k)) byTitle.set(k, t.n);
  }

  for (const name of files) {
    fileCount++;
    const num = leadingNumber(name);
    if (num !== null) {
      if (byNumber.has(num)) {
        problems.push(`${albumId}/：序號 ${num} 有兩個檔案（${byNumber.get(num)} 與 ${name}）`);
        continue;
      }
      byNumber.set(num, name);
      continue;
    }
    const hit = byTitle.get(normalize(stripExt(name)));
    if (hit) {
      if (byNumber.has(hit)) {
        problems.push(`${albumId}/：序號 ${hit} 已有檔案，${name} 依曲名對到同一首，已略過`);
        continue;
      }
      byNumber.set(hit, name);
      continue;
    }
    unreadable.push(name);
  }

  const missing = [];
  for (const t of tracks) {
    const file = byNumber.get(t.n);
    if (!file) {
      missing.push(t.n);
      continue;
    }
    matches.push({ albumId, n: t.n, dir, file });
    matchedCount++;
    const target = renameTarget(file, t.n);
    if (target !== file) plan.push({ dir, from: file, to: target });
  }

  const label = `${albumId}（${albums.get(albumId).title}）`;
  console.log(
    `${label.padEnd(30)} ${String(byNumber.size).padStart(2)}/${String(tracks.length).padStart(2)} 首`
  );
  if (missing.length) console.log(`  · 缺：第 ${missing.join('、')} 首`);
  if (unreadable.length) console.log(`  · 無法對應：${unreadable.join('、')}`);
}

/* ---------- 報告 ---------- */
console.log('');
console.log(`掃描 ${dirs.length} 個專輯目錄、${fileCount} 個音檔，對上 ${matchedCount} 首。`);

if (problems.length) {
  console.log('');
  console.log('需要處理：');
  for (const p of problems) console.log('  ! ' + p);
}

/* 改名先做、登記後寫：兩者順序顛倒會讓 local-audio.json 指向已被改掉的舊檔名 */
const renamed = new Map(); // "dir|oldName" -> newName
if (RENAME && plan.length) {
  if (!WRITE) {
    console.log('');
    console.log(`以下 ${plan.length} 個檔名可正規化（--rename 需同時給 --write）：`);
    for (const p of plan.slice(0, 20)) console.log('    ' + p.from + ' → ' + p.to);
    if (plan.length > 20) console.log(`    …另有 ${plan.length - 20} 個`);
  } else {
    for (const p of plan) {
      if (p.from === p.to) continue;
      if (fs.existsSync(path.join(p.dir, p.to))) {
        problems.push(`改名衝突，已略過：${p.to} 已存在`);
        continue;
      }
      fs.renameSync(path.join(p.dir, p.from), path.join(p.dir, p.to));
      renamed.set(p.dir + '|' + p.from, p.to);
    }
    console.log('');
    console.log(`已正規化 ${renamed.size} 個檔名（保留描述文字，只補正兩位數序號）。`);
  }
} else if (plan.length) {
  console.log(`（${plan.length} 個檔名可正規化，加 --rename --write 執行）`);
}

if (!WRITE) {
  console.log('');
  console.log('這是報告模式，未寫入任何檔案。要寫出登記檔請加 --write。');
  process.exit(0);
}

/* 登記：名稱以改名後的結果為準 */
for (const m of matches) {
  const finalName = renamed.get(m.dir + '|' + m.file) || m.file;
  entries[m.albumId + '-' + m.n] = 'assets/audio/' + m.albumId + '/' + finalName;
}

/* 排序輸出，鍵值穩定 → 重跑不產生無謂 diff */
const sorted = {};
for (const k of Object.keys(entries).sort((a, b) => a.localeCompare(b, 'en')))
  sorted[k] = entries[k];
fs.writeFileSync(OUT_FILE, JSON.stringify(sorted, null, 2) + '\n', { encoding: 'utf8' });
console.log('');
console.log(`已寫出 _data/local-audio.json（${Object.keys(sorted).length} 首）。`);
console.log('下一步：npm run build:local（本機檔案優先，官方試聽留作後備）');

function countFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase())).length;
  } catch {
    return 0;
  }
}
