/*  build.mjs — merges the iTunes facts, the extracted cover colours and the
 *  per-artist editorial layer into js/data.js.
 *
 *  Multi-artist: one folder per artist under _data/artists/<id>/ containing
 *    albums-raw.json   facts (machine fetched, rebuildable)
 *    colors.json       average colour per cover
 *    meta.mjs          the only hand written layer
 *  Adding an artist means adding a folder, never touching this file.
 *
 *  Run:  node _data/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
/* 去 BOM：Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 會寫入 BOM，
   而 JSON.parse 不接受開頭的 U+FEFF。抓取腳本補試聽時會回寫這些 json，
   這裡容錯一次，任何工具寫出的 BOM 都不會再讓整份 data.js 生不出來。 */
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8').replace(/^\uFEFF/, '');
/* 選填的輸入檔：不存在時回退值（新歌手還沒有署名檔、或本機沒有歌詞時的正常狀態） */
const readJson = (p, fallback) => {
  const abs = path.join(here, p);
  if (!fs.existsSync(abs)) return fallback;
  return JSON.parse(read(p));
};

/* ---------- traditional -> simplified tables (OpenCC TSPhrases + TSCharacters) ----------
 * OpenCC resolves phrase level rules before falling back to single characters;
 * we keep that exact order so e.g. 藉口 -> 借口 rather than a bare 藉 -> 借.
 * These tables are the conversion engine and are artist independent. */
function readDict(file) {
  const src = read(file);
  const body = src.slice(src.indexOf('"') + 1, src.lastIndexOf('"'));
  const out = [];
  for (const entry of body.split('|')) {
    const sp = entry.indexOf(' ');
    if (sp < 1) continue;
    const from = entry.slice(0, sp);
    const to = entry.slice(sp + 1).split(' ')[0];
    if (from && to && from !== to) out.push([from, to]);
  }
  return out;
}

const phrasePairs = readDict('TSPhrases.js').sort((a, b) => b[0].length - a[0].length);
const charPairs = readDict('TSCharacters.js').filter(([t]) => t.length === 1);
const phraseMap = Object.fromEntries(phrasePairs);
const charMap = Object.fromEntries(charPairs);
const t2s = JSON.stringify({ phrases: phraseMap, chars: charMap });

/* ---------- shared helpers ---------- */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const INK = hexToRgb('#08080A');
const tintOf = (hex) => mix(hexToRgb(hex), INK, 0.78);

/* per-album accent, derived from the cover itself: the vivid colour becomes
 * the accent, luminance decides whether text on it is ink or paper, and the
 * accent is pulled into a usable band so it never vanishes against the page. */
const rgbToHex = (rgb) =>
  '#' +
  rgb
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
const lumOf = (rgb) => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
const PAPER = [243, 240, 234];
const albumTheme = (c) => {
  let rgb = hexToRgb(c.vivid || c.avg || '#3a3a3a');
  let lum = lumOf(rgb);
  if (lum < 0.18) rgb = mix(rgb, [255, 255, 255], 0.38);
  if (lum > 0.82) rgb = mix(rgb, INK, 0.3);
  lum = lumOf(rgb);
  return { accent: rgbToHex(rgb), accentOn: rgbToHex(lum > 0.5 ? INK : PAPER) };
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};
const fmtRuntime = (ms) => {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/* ---------- audio ----------
 * Playback uses the official 30 second preview clip Apple publishes alongside
 * each track in the same catalogue response. No recording is copied into this
 * project. If you own the records, describe local files in
 * _data/local-audio.json as { "jay2000-3": "assets/audio/jay2000/03.m4a" };
 * the key is prefixed by the album id, which is globally unique per artist,
 * so one file serves every artist. Local files win; the preview stays as the
 * fallback.
 *
 * Local audio is opt-in. The committed js/data.js has to stay valid for
 * everyone, so a plain build ignores local-audio.json; fold the local files in
 * only for your own listening with `npm run build:local` (--local). */
const withLocal = process.argv.includes('--local');
let localAudio = {};
let localLyrics = {};
if (withLocal) {
  try {
    localAudio = JSON.parse(read('local-audio.json'));
  } catch {
    localAudio = {};
  }
  try {
    localLyrics = JSON.parse(read('local-lyrics.json'));
  } catch {
    localLyrics = {};
  }
}

/* ---------- discover artists ---------- */
const artistsRoot = path.join(here, 'artists');
const ids = fs
  .readdirSync(artistsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((id) => fs.existsSync(path.join(artistsRoot, id, 'meta.mjs')))
  .sort();

if (!ids.length) throw new Error('no artist folder with meta.mjs under _data/artists/');

/* ---------- load the editorial layers ---------- */
const editorial = {};
for (const id of ids) {
  const mod = await import(pathToFileURL(path.join(artistsRoot, id, 'meta.mjs')).href);
  editorial[id] = mod.default;
  if (!editorial[id] || editorial[id].id !== id) {
    throw new Error(
      `meta.mjs id mismatch: folder "${id}" vs exported "${editorial[id] && editorial[id].id}"`
    );
  }
}

/* five covers for the hero fan; fall back to an even spread across the timeline */
const autoFan = (albums) => {
  if (albums.length <= 5) return albums.map((a) => a.id);
  const picks = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.round((i * (albums.length - 1)) / 4);
    if (!picks.includes(albums[idx].id)) picks.push(albums[idx].id);
  }
  return picks;
};

/* ---------- per artist pipeline ---------- */
function buildArtist(ed) {
  const raw = JSON.parse(read(path.join('artists', ed.id, 'albums-raw.json')));
  const colors = JSON.parse(read(path.join('artists', ed.id, 'colors.json')));
  /* 署名（事實）：由 _data/extract-credits.mjs 從歌詞 sidecar 的製作人員行抽出，
     入庫於 artists/<id>/credits.json。檔不存在就整批留空——新歌手還沒有歌詞時
     就是這個狀態，不是錯誤。 */
  const credits = readJson(path.join('artists', ed.id, 'credits.json'), {});
  /* 逐曲文案（編輯層）：meta.mjs 的 songs，鍵是 `<專輯id>-<序號>`。
     只允許填已存在的曲目，打錯鍵會直接報錯而不是靜默失效。 */
  const songsEd = ed.songs || {};

  const fix = (s) => ed.kanjiFix.reduce((acc, [from, to]) => acc.split(from).join(to), s);
  const fixPhrase = (s) => ed.phraseFix.reduce((acc, [from, to]) => acc.split(from).join(to), s);
  const clean = (s) => fixPhrase(fix(s));

  /* ---------- 一首歌的檔案紀錄（Song Archive） ----------
     舊欄位（n / disc / zh / sec / len / sig / audio / preview / local / lyrics）原樣保留，
     這裡是新增的、每首歌自帶的檔案屬性：id 與整位歌手共用一個鍵空間
     （`<專輯id>-<序號>`，與 local-audio.json、meta.mjs 的 songs 同一把鍵）。

     三層職責不變：事實（標題、年份、時長、封面）來自 albums-raw.json；
     署名（詞曲編曲製作）來自 facts 層的 credits.json；逐曲文案來自 meta.mjs 的 songs。
     編輯層填了就蓋過事實層。

     未收錄的欄位不寫進去（沿用 track.lyrics 的做法）：
     公開產物因此仍然逐位元組不含歌詞欄位，消費者一律以「有值才顯示」處理。 */
  function songRecord(a, meta, rec, key, cred, edSong) {
    const song = {
      id: key,
      /* 整位歌手目錄裡的檔案編號，由 buildArtist 在全部專輯建好後統一填 */
      no: 0,
      title: rec.zh,
      artist: ed.name,
      album: clean(meta.title),
      albumId: a.key,
      year: new Date(a.releaseDate).getFullYear(),
      duration: rec.len,
      durationSec: rec.sec,
      cover: 'assets/covers/' + a.key + '.jpg',
      /* 空字串 = 未收錄。四個署名欄位一律存在，形狀固定；其餘選填 */
      lyricist: cred.lyricist || '',
      composer: cred.composer || '',
      arranger: cred.arranger || '',
      producer: cred.producer || ''
    };
    if (edSong) {
      for (const f of ['lyricist', 'composer', 'arranger', 'producer', 'description', 'story']) {
        if (edSong[f]) song[f] = clean(edSong[f]);
      }
      if (edSong.tags && edSong.tags.length) song.tags = edSong.tags.map(clean);
    }
    /* 其他署名（混音／母帶／吉他…）：編輯層寫了就整批蓋過事實層 */
    const extra = edSong && edSong.credits && edSong.credits.length ? edSong.credits : cred.credits;
    if (extra && extra.length) song.credits = extra;
    /* 歌詞：只有本機態才有 sidecar 路徑。逐行時間由 js/lyrics.js 解析成
       `[{ time, text }]`（見 js/README.md）；歌詞文本不進 data.js——
       它是第三方版權文本，逐首內嵌也會讓產物多出約 2 MB。 */
    if (rec.lyrics) song.lyrics = { source: rec.lyrics, format: 'lrc' };
    return song;
  }

  const albums = raw.map((a, i) => {
    const meta = ed.albums[a.key];
    if (!meta) throw new Error(`missing editorial metadata for ${ed.id}/${a.key}`);
    const date = new Date(a.releaseDate);
    /* 曲目序號 `n` 是站點內的鍵：音檔路徑、本機登記檔、播放定位都用 (專輯id, n)。
       所以它必須在專輯內唯一且連續，不能直接沿用目錄的 trackNumber——
       雙 CD 精選集會按碟重新從 1 編號（林志炫《單身情歌.超炫精選》兩首 #2、
       兩首 #4），撞鍵會讓兩首歌指向同一個音檔。缺號（《True Live》缺 #2）
       也一併補平。碟號另存 disc 供顯示，不參與鍵。 */
    const tracks = a.tracks.map((t, ti) => {
      const preview = t.p || null;
      const n = ti + 1;
      const key = a.key + '-' + n;
      const local = localAudio[key] || null;
      /* 歌詞只有在本機聽歌模式才寫入：它與音檔同屬第三方版權文本，
         公開產物不該帶本機路徑，也本就不含歌詞內容。 */
      const lyric = localLyrics[key] || null;
      const rec = {
        n,
        disc: t.disc || 1,
        zh: clean(t.name),
        sec: Math.round((t.time || 0) / 1000),
        len: fmtRuntime(t.time || 0),
        sig: meta.signature.includes(clean(t.name)),
        audio: local || preview,
        preview: preview,
        local: !!local
      };
      /* 沒有歌詞就不寫這個欄位：公開產物因此與加入歌詞前逐位元組相同 */
      if (lyric) rec.lyrics = lyric;
      rec.song = songRecord(a, meta, rec, key, credits[key] || {}, songsEd[key]);
      return rec;
    });
    const totalMs = a.tracks.reduce((s, t) => s + (t.time || 0), 0);
    const c = colors[a.key] || {};
    return {
      id: a.key,
      idx: i + 1,
      no: String(i + 1).padStart(2, '0'),
      /* Apple 目錄的專輯 id：官方深鏈可直達這張專輯，不必讓使用者再搜一次 */
      collectionId: a.collectionId || null,
      title: clean(meta.title),
      alt: clean(meta.alt || ''),
      en: meta.en,
      year: date.getFullYear(),
      dateISO: a.releaseDate.slice(0, 10),
      date: fmtDate(a.releaseDate),
      publisher:
        clean((a.copyright || '').replace(/^℗\s*\d{4}\s*/, '').trim()) || ed.publisherFallback,
      trackCount: tracks.length,
      runtime: fmtRuntime(totalMs),
      runtimeSec: Math.round(totalMs / 1000),
      cover: `assets/covers/${a.key}.jpg`,
      blurb: clean(meta.blurb),
      tint: tintOf(c.avg || '#3a3a3a'),
      sourceAvg: c.avg || '#3a3a3a',
      theme: albumTheme(c),
      tracks
    };
  });

  /* 檔案編號：整位歌手的目錄當成一冊卷宗，第幾筆就是這首歌的檔案號
     （app.js 的 archiveNo() 過去自己數，現在直接讀 song.no，兩者同一個口徑） */
  let songNo = 0;
  albums.forEach((a) =>
    a.tracks.forEach((t) => {
      t.song.no = ++songNo;
    })
  );

  /* 逐曲文案的鍵校驗：打錯鍵必須當場報錯，不能靜默失效 */
  for (const k of Object.keys(songsEd)) {
    if (!albums.some((a) => a.tracks.some((t) => t.song.id === k))) {
      throw new Error(`meta.mjs 的 songs 有對不上的鍵：${ed.id}/${k}`);
    }
  }

  /* 時間軸：某一年發行了哪些作品（song id）與哪幾張專輯。
     由曲目直接推導，供未來的年份軸與「某年的作品」查詢使用。 */
  const timeline = [];
  {
    const byYear = new Map();
    albums.forEach((a) =>
      a.tracks.forEach((t) => {
        if (!byYear.has(a.year))
          byYear.set(a.year, { year: a.year, count: 0, albums: [], songs: [] });
        const row = byYear.get(a.year);
        row.count++;
        if (!row.albums.includes(a.id)) row.albums.push(a.id);
        row.songs.push(t.song.id);
      })
    );
    timeline.push(...[...byYear.values()].sort((x, y) => x.year - y.year));
  }

  const eras = ed.eras
    .map((e, i) => {
      const items = albums.filter((a) => a.year >= e.from && a.year <= e.to);
      return {
        key: e.key,
        no: String(i + 1).padStart(2, '0'),
        title: clean(e.title),
        en: e.en,
        note: clean(e.note),
        from: e.from,
        to: e.to,
        count: items.length,
        tracks: items.reduce((s, a) => s + a.trackCount, 0),
        runtime: fmtRuntime(items.reduce((s, a) => s + a.runtimeSec, 0) * 1000),
        ids: items.map((a) => a.id),
        covers: items.map((a) => ({ id: a.id, title: a.title, cover: a.cover, year: a.year }))
      };
    })
    .filter((e) => e.count);

  const collabMap = {};
  albums.forEach((a) =>
    a.tracks.forEach((t) => {
      const m = /\((?:feat\.|with)\s*([^)]+)\)/i.exec(t.zh);
      if (!m) return;
      m[1]
        .split(/[&,、]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((name0) => {
          let name = name0;
          ed.collabFix.forEach(([from, to]) => {
            if (name === from) name = to;
          });
          if (!collabMap[name]) collabMap[name] = { name, tracks: [] };
          collabMap[name].tracks.push({
            album: a.id,
            albumTitle: a.title,
            albumNo: a.no,
            year: a.year,
            zh: t.zh,
            len: t.len,
            // the card is already headed by this name, so drop the credit bracket
            short: t.zh.replace(/\s*\((?:feat\.|with)[^)]*\)/i, '').trim() || t.zh
          });
        });
    })
  );
  const collaborators = Object.keys(collabMap)
    .map((k) => collabMap[k])
    .sort((a, b) => b.tracks.length - a.tracks.length || a.name.localeCompare(b.name))
    .map((c) => ({ name: c.name, count: c.tracks.length, tracks: c.tracks }));

  const flatTracks = [];
  albums.forEach((a) =>
    a.tracks.forEach((t) =>
      flatTracks.push({
        album: a.id,
        albumTitle: a.title,
        albumNo: a.no,
        year: a.year,
        n: t.n,
        zh: t.zh,
        len: t.len,
        sec: t.sec
      })
    )
  );
  const byLength = flatTracks.slice().sort((a, b) => b.sec - a.sec);
  const longest = byLength.slice(0, 12);
  const shortest = byLength.slice(-8).reverse();

  let running = 0;
  const growth = albums.map((a) => {
    running += a.trackCount;
    return {
      album: a.id,
      title: a.title,
      no: a.no,
      year: a.year,
      dateISO: a.dateISO,
      add: a.trackCount,
      total: running
    };
  });

  const monthIndex = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() * 12 + d.getMonth();
  };
  const gaps = albums
    .map((a, i) => {
      if (!i) return null;
      const prev = albums[i - 1];
      const months = monthIndex(a.dateISO) - monthIndex(prev.dateISO);
      return {
        from: prev.id,
        to: a.id,
        fromNo: prev.no,
        toNo: a.no,
        fromTitle: prev.title,
        toTitle: a.title,
        year: a.year,
        months,
        label: months >= 12 ? (months / 12).toFixed(1) + ' 年' : months + ' 個月'
      };
    })
    .filter(Boolean);
  const longestGap = gaps.reduce((m, g) => (g.months > m.months ? g : m), gaps[0]);
  const median = (xs) => {
    const s = xs.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  };

  const distribution = {
    trackCounts: albums.map((a) => ({
      id: a.id,
      title: a.title,
      no: a.no,
      year: a.year,
      n: a.trackCount
    })),
    runtimes: albums.map((a) => ({
      id: a.id,
      title: a.title,
      no: a.no,
      year: a.year,
      sec: a.runtimeSec,
      label: a.runtime
    })),
    trackMin: Math.min(...albums.map((a) => a.trackCount)),
    trackMax: Math.max(...albums.map((a) => a.trackCount)),
    runtimeMin: Math.min(...albums.map((a) => a.runtimeSec)),
    runtimeMax: Math.max(...albums.map((a) => a.runtimeSec)),
    runtimeTotal: fmtRuntime(albums.reduce((s, a) => s + a.runtimeSec, 0) * 1000),
    gapMin: Math.min(...gaps.map((g) => g.months)),
    gapMax: Math.max(...gaps.map((g) => g.months)),
    gapMedian: median(gaps.map((g) => g.months)),
    longestGap,
    shortestAlbum: albums.reduce((m, a) => (a.trackCount < m.trackCount ? a : m), albums[0]),
    longestAlbum: albums.reduce((m, a) => (a.runtimeSec > m.runtimeSec ? a : m), albums[0])
  };

  const signature = [];
  albums.forEach((a) =>
    a.tracks.forEach((t) => {
      if (t.sig)
        signature.push({
          album: a.id,
          albumTitle: a.title,
          albumNo: a.no,
          year: a.year,
          n: t.n,
          zh: t.zh,
          len: t.len
        });
    })
  );

  const heroFan = ed.heroFan || autoFan(albums);
  const fanAlbums = heroFan.map((fid) => albums.find((a) => a.id === fid)).filter(Boolean);
  const covers = fanAlbums.map((a) => ({ id: a.id, title: a.title, cover: a.cover, year: a.year }));
  const center = fanAlbums[Math.floor(fanAlbums.length / 2)] || albums[0];
  const tint = tintOf((colors[center.id] || {}).avg || '#3a3a3a');

  return {
    ed,
    albums,
    eras,
    timeline,
    collaborators,
    longest,
    shortest,
    growth,
    gaps,
    distribution,
    signature,
    heroFan,
    covers,
    tint
  };
}

const built = ids.map((id) => buildArtist(editorial[id]));

/* ---------- emit ---------- */
/* ---------- 歌曲檔案資料模型（契約宣告） ----------
 *  every track 自帶一份 song 紀錄（見 buildArtist 的 songRecord）。這裡把
 *  欄位名稱與版本號一併寫進產物，讓未來的遷移可以按版本判斷、不必靠猜形狀。
 *  - required：一律存在（署名可以是空字串，代表未收錄）
 *  - optional：未收錄就不寫這個欄位（沿用 track.lyrics 的既有做法）
 *  - lyricsLine：執行時 js/lyrics.js 解析 sidecar LRC 得到的一行歌詞的形狀 */
const SONG_SCHEMA = {
  version: 2,
  required: [
    'id',
    'no',
    'title',
    'artist',
    'album',
    'albumId',
    'year',
    'duration',
    'durationSec',
    'cover',
    'lyricist',
    'composer',
    'arranger',
    'producer'
  ],
  optional: ['credits', 'description', 'story', 'tags', 'lyrics'],
  /* 一行的形狀：time 是秒（數字），text 是該行文字；end 由解析器補（下一行起點） */
  lyricsLine: ['time', 'text', 'end'],
  /* 歌詞文本不內嵌：第三方版權文本，且逐首內嵌會讓產物多出約 2 MB。
     公開產物連 song.lyrics 都沒有；本機態它只是一個 sidecar 描述子。 */
  lyricsInline: false
};

const banner = `/*  js/data.js - generated by _data/build.mjs
 *  Multi-artist: window.DISCOGRAPHY.order lists the artist ids, and
 *  window.DISCOGRAPHY.artists[id] holds one showcase each.
 *  Album metadata, tracklists and cover colours: Apple Music / iTunes catalogue.
 *  Editorial copy: hand written per artist under _data/artists/<id>/meta.mjs.
 *  Do not edit by hand; edit the editorial layer and re-run.                        */`;

const toSimplifiedSrc = `  function toSimplified(s) {
    var i, k, j, out = '', buf = '';
    for (i = 0; i < s.length; i++) {
      var matched = null;
      for (j = 0; j < PHRASE_KEYS.length; j++) {
        k = PHRASE_KEYS[j];
        if (k.length <= s.length - i && s.substr(i, k.length) === k) { matched = k; break; }
      }
      if (matched) { out += buf; buf = ''; out += T2S.phrases[matched]; i += matched.length - 1; }
      else { buf += s.charAt(i); }
      if (buf.length > 8) { out += T2S.chars[buf.charAt(0)] || buf.charAt(0); buf = buf.slice(1); }
    }
    for (j = 0; j < buf.length; j++) out += T2S.chars[buf.charAt(j)] || buf.charAt(j);
    return out;
  }`;

let out = `${banner}
window.DISCOGRAPHY = (function () {
  var T2S = ${t2s};
  var PHRASE_KEYS = Object.keys(T2S.phrases).sort(function (a, b) { return b.length - a.length; });
${toSimplifiedSrc}
  var ARTISTS = {};
`;

built.forEach((b) => {
  const ed = b.ed;
  out += `
  ARTISTS[${JSON.stringify(ed.id)}] = (function () {
    var ALBUMS = ${JSON.stringify(b.albums, null, 0)};
    var ALL_TRACKS = [];
    ALBUMS.forEach(function (a) {
      a.tracks.forEach(function (t, ti) {
        ALL_TRACKS.push({
          album: a.id, albumTitle: a.title, albumNo: a.no, year: a.year, idx: a.idx,
          n: t.n, ti: ti, zh: t.zh, len: t.len, sec: t.sec, sig: t.sig,
          audio: t.audio, preview: t.preview, local: t.local,
          cover: a.cover, coverSm: 'assets/covers/responsive/' + a.id + '-480.jpg'
        });
      });
    });
    var PLAYABLE = ALL_TRACKS.filter(function (t) { return !!t.audio; }).length;
    var TOTAL_TRACKS = ALL_TRACKS.length;
    var TOTAL_SECONDS = ALBUMS.reduce(function (s, a) { return s + a.runtimeSec; }, 0);
    var SPAN_YEARS = ALBUMS[ALBUMS.length - 1].year - ALBUMS[0].year + 1;
    return {
      id: ${JSON.stringify(ed.id)},
      name: ${JSON.stringify(ed.name)},
      en: ${JSON.stringify(ed.en)},
      seal: ${JSON.stringify(ed.seal)},
      tagline: ${JSON.stringify(ed.tagline)},
      taglineEn: ${JSON.stringify(ed.taglineEn)},
      intro: ${JSON.stringify(ed.intro)},
      theme: ${JSON.stringify(ed.theme)},
      /* 這位歌手的目錄在哪些官方平台找得到：人工判斷，見下 */
      listen: ${JSON.stringify(ed.listen || ['apple', 'youtube'])},
      listenNote: ${JSON.stringify(ed.listenNote || '')},
      albums: ALBUMS,
      tracks: ALL_TRACKS,
      toSimplified: toSimplified,
      eras: ${JSON.stringify(b.eras)},
      timeline: ${JSON.stringify(b.timeline)},
      collaborators: ${JSON.stringify(b.collaborators)},
      longest: ${JSON.stringify(b.longest)},
      shortest: ${JSON.stringify(b.shortest)},
      growth: ${JSON.stringify(b.growth)},
      gaps: ${JSON.stringify(b.gaps)},
      signature: ${JSON.stringify(b.signature)},
      distribution: ${JSON.stringify(b.distribution)},
      heroFan: ${JSON.stringify(b.heroFan)},
      covers: ${JSON.stringify(b.covers)},
      tint: ${JSON.stringify(b.tint)},
      stats: { albums: ALBUMS.length, tracks: TOTAL_TRACKS, seconds: TOTAL_SECONDS, span: SPAN_YEARS,
               playable: PLAYABLE,
               from: ALBUMS[0].year, to: ALBUMS[ALBUMS.length - 1].year }
    };
  })();
`;
});

out += `  return {
    toSimplified: toSimplified,
    order: ${JSON.stringify(ids)},
    schema: ${JSON.stringify(SONG_SCHEMA)},
    artists: ARTISTS
  };
})();
`;

fs.mkdirSync(path.join(root, 'js'), { recursive: true });
fs.writeFileSync(path.join(root, 'js', 'data.js'), out, 'utf8');

/* 本機態的 js/lyrics/ 是 file:// 下的歌詞內聯 payload（見 .agents/notes/ 的
   file协议歌词读取 決策）：公開產物必須零歌詞，而那個目錄一複製出去就是歌詞全文，
   所以公開建置直接刪掉整個目錄。
   反過來說，跑一次 `npm run build` 就會讓本機的 file:// 歌詞失效（與音檔同一條注意事項），
   要恢復用 `npm run listen`。 */
const lyricsDir = path.join(root, 'js', 'lyrics');
if (!withLocal && fs.existsSync(lyricsDir)) {
  const n = fs.readdirSync(lyricsDir).length;
  fs.rmSync(lyricsDir, { recursive: true, force: true });
  console.log(`  (已刪除 js/lyrics/ 的 ${n} 個內聯歌詞檔：這份產物要能公開)`);
}

const totalTracks = built.reduce((s, b) => s + b.albums.reduce((x, a) => x + a.trackCount, 0), 0);
console.log(
  `data.js written: ${ids.length} artist(s) [${ids.join(', ')}], ${totalTracks} tracks, ` +
    `phrases=${phrasePairs.length}, chars=${charPairs.length}, ${(out.length / 1024).toFixed(1)} KB`
);
if (!withLocal && fs.existsSync(path.join(here, 'local-audio.json'))) {
  const n = Object.keys(JSON.parse(read('local-audio.json'))).length;
  console.log(`  (已略過 ${n} 首自有音檔：這份產物要能公開；本機聽歌請用 npm run build:local)`);
}
built.forEach((b) => {
  console.log(
    `  - ${b.ed.id}: ${b.albums.length} albums / ${b.albums.reduce((s, a) => s + a.trackCount, 0)} tracks, ` +
      `eras=${b.eras.length}, collabs=${b.collaborators.length}, sig=${b.signature.length}`
  );
});
