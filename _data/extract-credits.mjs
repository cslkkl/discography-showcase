/*  extract-credits.mjs — 從歌詞 sidecar 的製作人員行抽出署名，
 *  寫成 _data/artists/<id>/credits.json（事實層：可重建、要入庫）。
 *
 *  為什麼要有這一層：歌曲檔案（Song Archive）要顯示作詞／作曲／編曲／製作人，
 *  但 Apple 目錄不提供署名，只有 sidecar `.lrc` 的頭幾行寫著
 *  「詞：徐若瑄」這類製作人員行。歌詞文本本身不進版本庫（第三方版權），
 *  署名是事實、可以入庫，所以由本工具抽出來單獨保存。
 *
 *  用法：
 *    node _data/extract-credits.mjs                # 只報告，不寫檔
 *    node _data/extract-credits.mjs --write        # 寫出各歌手的 credits.json
 *    node _data/extract-credits.mjs --artist <id>  # 只處理某位歌手
 *    node _data/extract-credits.mjs --names        # 另列出署名對照表（繁體化稽核用）
 *
 *  前置：先跑 `node _data/local-audio.mjs --write`，讓 _data/local-lyrics.json
 *  登記各曲的 sidecar 歌詞路徑。沒有這份登記檔（例如剛複製倉庫、本機沒有音檔）
 *  就直接結束，已入庫的 credits.json 不受影響。
 *
 *  繁體化：歌曲檔案顯示的署名要與站點一致（資料以繁體保存，執行時轉簡體）。
 *  規則見 toTraditional()：只有單一候選的簡體字才自動轉，多候選者保留原字
 *  （范／于／余／胡／朴這些姓氏在繁體裡就是本字），少數需要指定者寫在 NAME_FIX。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const WRITE = argv.includes('--write');
const SHOW_NAMES = argv.includes('--names');
const onlyArtist = opt('artist');

/* ---------- 角色 ----------
 * 左邊是來源（LRC）寫法，右邊是本站的規範欄位。詞／曲／編曲／製作人四項
 * 收進 song 的固定欄位，其餘（混音／母帶／吉他…）留在 credits 陣列。
 * 「Music & Lyrics」同時是詞與曲，兩個欄位都填。 */
const CANON = [
  {
    field: 'lyricist',
    keys: ['作词', '作詞', '填词', '填詞', '词', '詞', 'lyrics by', 'written by']
  },
  { field: 'composer', keys: ['作曲', '曲', 'composed by', 'music by'] },
  { field: 'arranger', keys: ['编曲', '編曲', 'arranged by'] },
  { field: 'producer', keys: ['制作人', '製作人', 'producer', 'produced by'] }
];
/* 詞曲同時：兩個欄位都填 */
const BOTH = [
  { key: 'music & lyrics', fields: ['lyricist', 'composer'] },
  { key: '词曲', fields: ['lyricist', 'composer'] },
  { key: '詞曲', fields: ['lyricist', 'composer'] }
];

/* 其餘署名的中文標籤（英文來源統一成站點用語；沒列到的原樣保留） */
const EXTRA_LABELS = {
  'mixed by': '混音',
  mix: '混音',
  混音: '混音',
  'recorded by': '錄音',
  'additional recording by': '錄音',
  'vocals recorded by': '錄音',
  录音: '錄音',
  'mastered by': '母帶',
  母带: '母帶',
  guitar: '吉他',
  吉他: '吉他',
  bass: '貝斯',
  贝斯: '貝斯',
  'drums by': '鼓',
  鼓: '鼓',
  strings: '弦樂',
  'strings by': '弦樂',
  'piano and synthesizer by': '鋼琴與合成器',
  'vocals by': '和聲',
  'backing vocals': '和聲',
  和声: '和聲',
  'published by': '出版',
  发行: '發行',
  label: '廠牌',
  engineer: '工程',
  监制: '監製',
  出品: '出品',
  企划: '企劃',
  op: 'OP',
  sp: 'SP'
};

/* 所有可辨識的角色關鍵詞（正規化為小寫、去空白），長詞優先 */
const ALL_KEYS = [
  ...BOTH.map((b) => b.key),
  ...CANON.flatMap((c) => c.keys),
  ...Object.keys(EXTRA_LABELS)
]
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => b.length - a.length);

const normKey = (s) => s.toLowerCase().replace(/\s+/g, '');
/* 標籤查表用同一把鍵（英文來源寫 "Recorded by"，鍵是 'recorded by'） */
const EXTRA_BY_KEY = new Map(Object.entries(EXTRA_LABELS).map(([k, v]) => [normKey(k), v]));

/* 一行裡的區段切法：找出所有「角色：」標記，兩兩之間的文字歸前一個角色。
 * 一個時間戳底下常擠著兩三個角色（實測 "词：方文山 作曲：林俊杰"），
 * 只認開頭那個標記會把後面那半截一起算成第一個角色的值。 */
function segments(body) {
  const marks = [];
  for (const key of ALL_KEYS) {
    const re = new RegExp(
      '(?:^|[\\s/、,])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:：]',
      'gi'
    );
    let m;
    while ((m = re.exec(body)) !== null) {
      marks.push({ key, at: m.index + m[0].indexOf(key), end: m.index + m[0].length });
    }
  }
  marks.sort((a, b) => a.at - b.at || b.key.length - a.key.length);
  /* 重疊的標記只留最長的那個（"作曲" 蓋住 "曲"） */
  const kept = [];
  for (const mk of marks) {
    const last = kept[kept.length - 1];
    if (last && mk.at < last.end) {
      if (mk.key.length > last.key.length) kept[kept.length - 1] = mk;
      continue;
    }
    kept.push(mk);
  }
  if (!kept.length) return null;
  const out = [];
  for (let i = 0; i < kept.length; i++) {
    const stop = i + 1 < kept.length ? kept[i + 1].at : body.length;
    out.push({ key: kept[i].key, value: body.slice(kept[i].end, stop).trim() });
  }
  return out;
}

/* 時間戳行：[mm:ss.xx]（抽出署名只看帶時間戳的行，避免把 [ti:] 之類的標籤算進來） */
const STAMP = /^\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/;

/* 值的清理：切開並列的多個名字。
 * 分隔符有 / 、 , & + 與「連兩個以上空白」（單一空白要留著，Taylor Swift 靠它）。
 * 括號內的逗號與 & 是署名的一部分（母帶署名常寫成 "(New York, NY)"），
 * 所以掃描時要帶著括號深度：只有深度 0 的分隔符才算分隔符，
 * 否則一個地名會被拆成兩個「署名」。「周杰伦 Jay Chou」這種中英並列不會被切開。 */
const SEP = /[/、,&+]/;
const OPEN = /[(（[]/;
const CLOSE = /[)）\]]/;

function splitNames(value) {
  const parts = [];
  let buf = '';
  let depth = 0;
  let spaces = 0;
  for (const ch of value) {
    if (OPEN.test(ch)) depth++;
    else if (CLOSE.test(ch) && depth) depth--;
    if (!depth && SEP.test(ch)) {
      parts.push(buf);
      buf = '';
      spaces = 0;
      continue;
    }
    if (ch === ' ') {
      spaces++;
      /* 連兩個空白是分隔符；單一個要留著 */
      if (!depth && spaces >= 2) {
        parts.push(buf);
        buf = '';
        continue;
      }
      buf += ch;
      continue;
    }
    spaces = 0;
    buf += ch;
  }
  parts.push(buf);
  return parts
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((s) => s.length <= 60)
    .filter((s) => /[\u4e00-\u9fffA-Za-z]/.test(s))
    .filter((s) => !/…|\.\.\.$/.test(s));
}

/* ---------- 簡 → 繁 ---------- */
function readDict(file) {
  const src = read(path.join(here, file));
  const body = src.slice(src.indexOf('"') + 1, src.lastIndexOf('"'));
  const map = new Map();
  for (const entry of body.split('|')) {
    const sp = entry.indexOf(' ');
    if (sp < 1) continue;
    map.set(
      entry.slice(0, sp),
      entry
        .slice(sp + 1)
        .split(' ')
        .filter(Boolean)
    );
  }
  return map;
}
const ST = readDict('STCharacters.js');

/* 多候選字的指定：值必須是人工確認過的繁體寫法。
 * 這張表只放「原字保留會是錯的」那幾個——多候選字若原字本身也在候選裡，
 * 姓名用原本那個字通常才對（范／于／余／胡／朴／梁／秋／家／周…），
 * 所以預設保留；只有指名單位的知名署名需要指定。 */
const NAME_FIX = {
  周杰伦: '周杰倫',
  林俊杰: '林俊傑',
  林义杰: '林義傑',
  洪伟杰: '洪偉傑',
  钟兴民: '鍾興民',
  蔡政勋: '蔡政勳',
  黄雨勋: '黃雨勳',
  吴广隆: '吳廣隆',
  庄景云: '莊景雲',
  简胜: '簡勝',
  小广: '小廣'
};

/* 轉換後的異體字歸一：OpenCC 的簡→繁輸出是台灣標準（s2t），會給出峯／爲／啓
 * 這幾個異體，而本站慣用另一形——同一條理由見各 meta.mjs 的 kanjiFix
 * （iTunes 回傳的日文新字體也是這樣被转正的）。實測這三個字是署名裡
 * 唯一與站點其他檔案不同形的字（各 4 至 5 次，其餘 20 組異體字皆無差異）。 */
const VARIANT_FIX = { 峯: '峰', 爲: '為', 啓: '啟' };

/* 轉換規則：
 *   1. NAME_FIX 命中（子字串，長者優先）→ 以指定為準
 *      子字串而非全等比對：同一人會有「林俊杰」與「林俊杰 JJ LIN」兩種寫法
 *   2. 不在字典裡的字 → 原樣（拉丁字母、數字、標點都走這條）
 *   3. 只有一個候選 → 轉（迈→邁、勋→勳、尧→堯…）
 *   4. 多候選而原字本身是候選 → 保留（范、于、余、胡、朴…在姓名裡就是本字）
 *   5. 多候選而原字不是候選 → 取首選（钟→鍾、苏→蘇、发→發…） */
const NAME_FIX_KEYS = Object.keys(NAME_FIX).sort((a, b) => b.length - a.length);

function toTraditional(name) {
  let fixed = name;
  for (const k of NAME_FIX_KEYS) {
    if (fixed.includes(k)) fixed = fixed.split(k).join(NAME_FIX[k]);
  }
  let out = '';
  for (const ch of fixed) {
    const cand = ST.get(ch);
    if (!cand || !cand.length) out += ch;
    else if (cand.length === 1) out += cand[0];
    else if (cand.includes(ch)) out += ch;
    else out += cand[0];
  }
  return [...out].map((ch) => VARIANT_FIX[ch] || ch).join('');
}

/* ---------- 站點資料：專輯 id → 歌手 ---------- */
async function loadDataset() {
  const file = path.join(root, 'js', 'data.js');
  if (!fs.existsSync(file)) fail('找不到 js/data.js，先跑 npm run build');
  globalThis.window = {};
  await import(pathToFileURL(file).href);
  return globalThis.window.DISCOGRAPHY;
}
function fail(msg) {
  console.error('錯誤：' + msg);
  process.exit(1);
}

const D = await loadDataset();
if (!D || !D.order || !D.order.length) fail('js/data.js 裡沒有歌手資料');

const albumArtist = new Map();
const trackKeys = new Set();
for (const id of D.order) {
  for (const a of D.artists[id].albums || []) {
    albumArtist.set(a.id, id);
    for (const t of a.tracks || []) trackKeys.add(a.id + '-' + t.n);
  }
}

/* ---------- 讀歌詞登記檔 ---------- */
let registry = {};
try {
  registry = JSON.parse(read(path.join(here, 'local-lyrics.json')));
} catch {
  console.log('沒有 _data/local-lyrics.json：本機沒有登記歌詞 sidecar。');
  console.log('先跑 npm run audio -- --write（或 npm run listen）再回來。');
  console.log('已入庫的 credits.json 不受影響，沒有東西被改動。');
  process.exit(0);
}

const keys = Object.keys(registry);
if (!keys.length) fail('local-lyrics.json 是空的，沒有可抽取的署名');

/* ---------- 抽取 ---------- */
const byArtist = new Map(); // artistId -> { key -> record }
const unknown = [];
let scanned = 0;
let unreadable = 0;
const nameSeen = new Map(); // 來源署名 -> 次數

for (const key of keys.sort()) {
  const rel = registry[key];
  if (!rel) continue;
  if (!trackKeys.has(key)) {
    unknown.push(key);
    continue;
  }
  const artistId = albumArtist.get(key.replace(/-\d+$/, ''));
  if (!artistId) {
    unknown.push(key);
    continue;
  }
  if (onlyArtist && artistId !== onlyArtist) continue;
  const file = path.join(root, rel);
  let text;
  try {
    text = read(file);
  } catch {
    unreadable++;
    continue;
  }
  scanned++;

  const fields = new Map(); // field -> Set(names)
  const extras = new Map(); // label -> Set(names)
  const add = (map, k, v) => {
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(v);
  };

  for (const line of text.split(/\r?\n/)) {
    const m = STAMP.exec(line);
    if (!m) continue;
    const body = line.slice(m[0].length).trim();
    if (!body) continue;
    const segs = segments(body);
    if (!segs) continue;
    for (const seg of segs) {
      const key2 = normKey(seg.key);
      const names = splitNames(seg.value);
      if (!names.length) continue;
      const both = BOTH.find((b) => normKey(b.key) === key2);
      const canon = CANON.find((c) => c.keys.some((k) => normKey(k) === key2));
      for (const raw of names) {
        const name = toTraditional(raw);
        nameSeen.set(raw, (nameSeen.get(raw) || 0) + 1);
        if (both) both.fields.forEach((f) => add(fields, f, name));
        else if (canon) add(fields, canon.field, name);
        else {
          const label = EXTRA_BY_KEY.get(key2) || toTraditional(seg.key.trim());
          add(extras, label, name);
        }
      }
    }
  }

  if (!fields.size && !extras.size) continue;
  const rec = {};
  for (const f of ['lyricist', 'composer', 'arranger', 'producer']) {
    if (fields.has(f)) rec[f] = [...fields.get(f)].join('、');
  }
  if (extras.size) {
    rec.credits = [...extras.entries()].map(([role, set]) => ({ role, name: [...set].join('、') }));
  }
  if (!byArtist.has(artistId)) byArtist.set(artistId, {});
  byArtist.get(artistId)[key] = rec;
}

/* ---------- 報告 ---------- */
const totalCredits = [...byArtist.values()].reduce((s, o) => s + Object.keys(o).length, 0);
console.log(`掃描 ${scanned} 首登記歌詞，${totalCredits} 首抽到署名。`);
if (unreadable) console.log(`  · 讀不到的檔案 ${unreadable} 個（登記檔指向的檔案不存在）`);
if (unknown.length) console.log(`  · 登記檔裡有 ${unknown.length} 個對不上目錄的鍵，已略過`);
for (const id of [...byArtist.keys()].sort()) {
  const o = byArtist.get(id);
  const ks = Object.keys(o);
  const roles = { lyricist: 0, composer: 0, arranger: 0, producer: 0, credits: 0 };
  ks.forEach((k) => Object.keys(roles).forEach((r) => o[k][r] && roles[r]++));
  console.log(
    `  - ${id}: ${ks.length} 首（詞 ${roles.lyricist}／曲 ${roles.composer}／` +
      `編曲 ${roles.arranger}／製作 ${roles.producer}／其他署名 ${roles.credits}）`
  );
}

if (SHOW_NAMES) {
  const rows = [...nameSeen.entries()]
    .map(([raw, n]) => ({ raw, n, zh: toTraditional(raw) }))
    .sort((a, b) => b.n - a.n || a.raw.localeCompare(b.raw, 'en'));
  console.log('\n署名對照表（來源 → 繁體）：');
  /* 只印「有改動」與「含多候選字（保留原字，需人眼確認）」兩種：
     397 條全印會淹掉真正要複核的那幾條 */
  let shown = 0;
  for (const r of rows) {
    const changed = r.raw !== r.zh;
    const amb = [...r.zh].some((c) => {
      const v = ST.get(c);
      return v && v.length > 1;
    });
    if (!changed && !amb) continue;
    shown++;
    console.log(
      `  ${String(r.n).padStart(4)}  ${r.raw}${changed ? '  →  ' + r.zh : ''}` +
        (amb ? '   [多候選字，保留原字]' : '')
    );
  }
  console.log(`  （共 ${rows.length} 個不同署名，需複核 ${shown} 條）`);
}

if (!WRITE) {
  console.log('\n這是報告模式，未寫入任何檔案。要寫出 credits.json 請加 --write。');
  process.exit(0);
}

/* ---------- 寫檔 ---------- */
let written = 0;
for (const [id, obj] of [...byArtist.entries()].sort()) {
  const sorted = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = obj[k];
  /* 排序輸出、LF、無 BOM：重跑不產生無謂 diff，build.mjs 的 JSON.parse 也不吃 BOM */
  const out = path.join(here, 'artists', id, 'credits.json');
  fs.writeFileSync(out, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  written++;
}
console.log(`\n已寫出 ${written} 位歌手的 credits.json。下一步：npm run build`);
