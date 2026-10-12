/*  build.mjs - merges the iTunes metadata, the extracted cover colours and the
 *  hand-written editorial layer into js/data.js.
 *  Run:  node _data/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');

/* ---------- source data ---------- */
const raw = JSON.parse(read('albums-raw.json'));
const colors = JSON.parse(read('colors.json'));

/* The iTunes catalogue uses a handful of Japanese shinjitai forms in a few
 * traditional-Chinese titles. Normalise them to the orthodox traditional
 * characters before anything else touches the strings. */
const KANJI_FIX = [
  ['\u5553', '\u555F'], // 啓 -> 啟
  ['\u8AAC', '\u8AAA'], // 説 -> 說
  ['\u6669', '\u6668'], // 晩 -> 晚
  ['\u6D99', '\u6DDA'] // 涙 -> 淚
];
const fix = (s) => KANJI_FIX.reduce((acc, [from, to]) => acc.split(from).join(to), s);

/* Phrase level cleanups that a character map cannot express. */
const PHRASE_FIX = [
  [
    '\u6211\u843D\u6DDA . \u60C5\u7DD2\u96F6\u788E',
    '\u6211\u843D\u6DDA\u3002\u60C5\u7DD2\u96F6\u788E'
  ],
  ['\u54CE\u55E6, \u4E0D\u932F\u54E6', '\u54CE\u55E6\uFF0C\u4E0D\u932F\u54E6']
];
const fixPhrase = (s) => PHRASE_FIX.reduce((acc, [from, to]) => acc.split(from).join(to), s);
const clean = (s) => fixPhrase(fix(s));

/* ---------- editorial layer ---------- */
const META = {
  jay2000: {
    title: 'Jay',
    alt: '同名專輯',
    en: 'Jay',
    blurb:
      '2000 年 11 月發行的出道專輯。十首歌裡沒有一首是為了安全而寫的，〈可愛女人〉開場，〈星晴〉與〈龍捲風〉把旋律放在最前面。',
    signature: ['龍捲風', '星晴']
  },
  fantasy2001: {
    title: '范特西',
    alt: '',
    en: 'Fantasy',
    blurb:
      '第二張專輯，隔年拿下金曲獎最佳流行音樂演唱專輯獎。〈愛在西元前〉、〈簡單愛〉與〈雙截棍〉把東方元素和節奏藍調縫在同一張唱片裡。',
    signature: ['雙截棍', '愛在西元前', '安靜']
  },
  eight2002: {
    title: '八度空間',
    alt: '',
    en: 'The Eight Dimensions',
    blurb:
      '第三張專輯，鋼琴與說唱的比重同時加大。〈半島鐵盒〉的敘事和〈暗號〉的旋律，是這張唱片最常被分開討論的兩極。',
    signature: ['半島鐵盒', '暗號']
  },
  yeh2003: {
    title: '葉惠美',
    alt: '',
    en: 'Yeh Hui-mei',
    blurb:
      '以母親的名字命名。〈以父之名〉的黑暗開場與〈東風破〉的中國風，讓這張專輯成為他創作光譜最寬的一張。',
    signature: ['晴天', '東風破', '以父之名']
  },
  jasmine2004: {
    title: '七里香',
    alt: '',
    en: 'Common Jasmine Orange',
    blurb:
      '夏天發行的第五張專輯。〈七里香〉、〈藉口〉、〈擱淺〉連續三首慢歌，把抒情寫成了一種季節感。',
    signature: ['七里香', '擱淺']
  },
  chopin2005: {
    title: '11月的蕭邦',
    alt: '',
    en: "November's Chopin",
    blurb: '蕭邦是這張專輯的題眼。〈夜曲〉、〈髮如雪〉、〈楓〉把古典鋼琴的語彙放進流行歌的骨架裡。',
    signature: ['夜曲', '髮如雪', '楓']
  },
  still2006: {
    title: '依然范特西',
    alt: '',
    en: 'Still Fantasy',
    blurb:
      '標題是對五年前那張專輯的回應。〈千里之外〉請來費玉清對唱，〈聽媽媽的話〉與〈菊花台〉各自成為一個世代的共同記憶。',
    signature: ['千里之外', '菊花台', '聽媽媽的話']
  },
  busy2007: {
    title: '我很忙',
    alt: '',
    en: 'On the Run',
    blurb:
      '〈青花瓷〉把中國風推到頂點，〈牛仔很忙〉又用鄉村舞曲把它拆解掉。一張同時在兩端使力的專輯。',
    signature: ['青花瓷', '彩虹', '最長的電影']
  },
  capricorn2008: {
    title: '魔杰座',
    alt: '',
    en: 'Capricorn',
    blurb:
      '魔術是整張專輯的隱喻。〈稻香〉的溫度和〈蘭亭序〉的書寫感，是這張唱片最常被引用的兩個切面。',
    signature: ['稻香', '蘭亭序', '說好的幸福呢']
  },
  era2010: {
    title: '跨時代',
    alt: '',
    en: 'The Era',
    blurb: '第十張錄音室專輯。〈煙花易冷〉把中國風寫成了敘事詩，〈超人不會飛〉則少見地直視疲憊。',
    signature: ['煙花易冷', '超人不會飛']
  },
  exclaim2011: {
    title: '驚嘆號',
    alt: '',
    en: 'Exclamation Mark',
    blurb: '電子與舞曲的比重明顯提高。〈水手怕水〉、〈公公偏頭痛〉用玩心稀釋了技術野心。',
    signature: ['公公偏頭痛', '水手怕水']
  },
  opus2012: {
    title: '十二新作',
    alt: '',
    en: 'Opus 12',
    blurb: '第十二張，回到旋律本身。〈紅塵客棧〉與〈明明就〉分別站在中國風和抒情曲的兩側。',
    signature: ['明明就', '紅塵客棧']
  },
  aiyo2014: {
    title: '哎呦，不錯哦',
    alt: '',
    en: 'Aiyo, Not Bad',
    blurb:
      '專輯名來自他的口頭禪。〈算什麼男人〉與〈手寫的從前〉把懷舊寫得很輕，〈鞋子特大號〉則依舊頑皮。',
    signature: ['算什麼男人', '手寫的從前']
  },
  bedtime2016: {
    title: '周杰倫的床邊故事',
    alt: '',
    en: "Jay Chou's Bedtime Stories",
    blurb: '以床邊故事為框架。〈前世情人〉寫給女兒，〈告白氣球〉則成為串流時代流傳最廣的一首。',
    signature: ['告白氣球', '前世情人', '不該']
  },
  greatest2022: {
    title: '最偉大的作品',
    alt: '',
    en: 'Greatest Works of Art',
    blurb: '相隔六年的專輯。同名曲把藝術史寫進歌詞，〈還在流浪〉與〈紅顏如霜〉延續他一貫的距離感。',
    signature: ['最偉大的作品', '還在流浪', '紅顏如霜']
  },
  sun2026: {
    title: '太陽之子',
    alt: '',
    en: 'Children of the Sun',
    blurb:
      '第十六張錄音室專輯，2026 年 3 月發行。十三首曲目中十二首為全新創作，〈那天下雨了〉率先在數位平台上衝出熱度。',
    signature: ['太陽之子', '那天下雨了', '西西里']
  }
};

/* ---------- helpers ---------- */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const INK = hexToRgb('#08080A');
const tintOf = (hex) => mix(hexToRgb(hex), INK, 0.78);

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
 * _data/local-audio.json as { "jay2000-3": "assets/audio/jay2000/03.m4a" }
 * and they win over the preview; the preview stays as the fallback. */
let localAudio = {};
try {
  localAudio = JSON.parse(read('local-audio.json'));
} catch {
  localAudio = {};
}

/* ---------- assemble ---------- */
const albums = raw.map((a, i) => {
  const meta = META[a.key];
  if (!meta) throw new Error('missing editorial metadata for ' + a.key);
  const date = new Date(a.releaseDate);
  const tracks = a.tracks.map((t) => {
    const preview = t.p || null;
    const local = localAudio[a.key + '-' + t.n] || null;
    return {
      n: t.n,
      disc: t.disc || 1,
      zh: clean(t.name),
      sec: Math.round((t.time || 0) / 1000),
      len: fmtRuntime(t.time || 0),
      sig: meta.signature.includes(clean(t.name)),
      audio: local || preview,
      preview: preview,
      local: !!local
    };
  });
  const totalMs = a.tracks.reduce((s, t) => s + (t.time || 0), 0);
  const c = colors[a.key] || {};
  return {
    id: a.key,
    idx: i + 1,
    no: String(i + 1).padStart(2, '0'),
    title: clean(meta.title),
    alt: clean(meta.alt || ''),
    en: meta.en,
    year: date.getFullYear(),
    dateISO: a.releaseDate.slice(0, 10),
    date: fmtDate(a.releaseDate),
    publisher:
      clean((a.copyright || '').replace(/^℗\s*\d{4}\s*/, '').trim()) ||
      'JVR Music International Ltd.',
    trackCount: tracks.length,
    runtime: fmtRuntime(totalMs),
    runtimeSec: Math.round(totalMs / 1000),
    cover: `assets/covers/${a.key}.jpg`,
    blurb: clean(meta.blurb),
    tint: tintOf(c.avg || '#3a3a3a'),
    sourceAvg: c.avg || '#3a3a3a',
    tracks
  };
});

/* ---------- traditional -> simplified tables (OpenCC TSPhrases + TSCharacters) ----------
 * OpenCC resolves phrase level rules before falling back to single characters;
 * we keep that exact order so e.g. 藉口 -> 借口 rather than a bare 藉 -> 借. */
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

/* ---------- derived views ----------
 * Everything below is computed from the album data above. No new facts are
 * introduced, so these views cannot drift away from the discography.        */

/* chapter grouping: 5 + 4 + 5 + 2 = 16 */
const ERA_DEFS = [
  {
    key: 'origins',
    from: 2000,
    to: 2004,
    title: '起點',
    en: 'Origins',
    note: '五張專輯，把旋律、說唱與東方元素確立成自己的語法。聽得出他在找一個只有自己能站的位置。'
  },
  {
    key: 'peak',
    from: 2005,
    to: 2009,
    title: '盛期',
    en: 'The Peak',
    note: '中國風在這一段抵達頂點，也是他產量最密、辨識度最高的四年。慢歌與快歌都留下了標準答案。'
  },
  {
    key: 'expand',
    from: 2010,
    to: 2016,
    title: '擴張',
    en: 'Expansion',
    note: '電子與舞曲的比重明顯提高，玩心與自省並存。他開始願意在作品裡顯露疲憊。'
  },
  {
    key: 'return',
    from: 2022,
    to: 2026,
    title: '回望',
    en: 'Return',
    note: '相隔六年之後回到錄音室，兩張專輯都放慢了腳步，談的是時間而不是技巧。'
  }
];
const eras = ERA_DEFS.map((e, i) => {
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
}).filter((e) => e.count);

/* featured collaborators, parsed out of the credit brackets in track titles */
const COLLAB_FIX = [['Lara梁心頤', '梁心頤']];
const collabMap = {};
albums.forEach((a) =>
  a.tracks.forEach((t) => {
    const m = /\((?:feat\.|with)\s*([^)]+)\)/i.exec(t.zh);
    if (!m) return;
    m[1]
      .split(/[&,、]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((raw) => {
        let name = raw;
        COLLAB_FIX.forEach(([from, to]) => {
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

/* longest and shortest recordings */
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

/* cumulative catalogue growth, one step per release */
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

/* months between consecutive releases */
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

/* signature tracks harvested from the editorial layer */
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

/* ---------- write ---------- */
const banner = `/*  js/data.js - generated by _data/build.mjs on ${new Date().toISOString()}
 *  Album metadata, tracklists and cover colours: Apple Music / iTunes catalogue.
 *  Editorial copy: hand written for this showcase.
 *  Do not edit by hand; edit _data/build.mjs and re-run.                              */`;

const out = `${banner}
window.JC = (function () {
  var ALBUMS = ${JSON.stringify(albums, null, 0)};
  var T2S = ${t2s};
  var PHRASE_KEYS = Object.keys(T2S.phrases).sort(function (a, b) { return b.length - a.length; });
  function toSimplified(s) {
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
  }
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
    albums: ALBUMS,
    tracks: ALL_TRACKS,
    toSimplified: toSimplified,
    eras: ${JSON.stringify(eras)},
    collaborators: ${JSON.stringify(collaborators)},
    longest: ${JSON.stringify(longest)},
    shortest: ${JSON.stringify(shortest)},
    growth: ${JSON.stringify(growth)},
    gaps: ${JSON.stringify(gaps)},
    signature: ${JSON.stringify(signature)},
    distribution: ${JSON.stringify(distribution)},
    stats: { albums: ALBUMS.length, tracks: TOTAL_TRACKS, seconds: TOTAL_SECONDS, span: SPAN_YEARS,
             playable: PLAYABLE,
             from: ALBUMS[0].year, to: ALBUMS[ALBUMS.length - 1].year }
  };
})();
`;

fs.mkdirSync(path.join(root, 'js'), { recursive: true });
fs.writeFileSync(path.join(root, 'js', 'data.js'), out, 'utf8');
console.log(
  `data.js written: ${albums.length} albums, ${albums.reduce((s, a) => s + a.trackCount, 0)} tracks, ` +
    `eras=${eras.length}, collabs=${collaborators.length}, sig=${signature.length}, ` +
    `phrases=${phrasePairs.length}, chars=${charPairs.length}, ${(out.length / 1024).toFixed(1)} KB`
);
