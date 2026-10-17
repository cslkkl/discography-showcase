/* 聲之年輪 — 歌詞舞台的本地視覺主題系統（Task 04 收尾）
 *
 * 目的：讓歌詞舞台**不依賴任何外部 AI 服務**也能完整運作。
 * AI 主題服務（tools/theme-service.mjs）降為**可選精修**：接得上就用真實 AI 的結果，
 * 接不上就用這裡的本地規則，舞台照常啟動、照常有背景與配色。
 *
 * 這裡的東西分三類，**不可混為一談**（狀態列也照這三類分開講）：
 *   1. 本地規則（local rule）——由封面主色算出來的背景、文字配色與環境光。
 *      是確定性的色彩運算，不是判斷，更不是情緒辨識。
 *   2. 人工預設（manual preset）——由人挑的風格主題（憂傷／溫暖／懷舊／明亮／激昂）
 *      與逐曲、逐段的指派。**這是人的審美決定，不是模型輸出**；
 *      每一條都寫明依據（實測能量與發行年代），不宣稱「辨識出情緒」。
 *   3. AI 擴充（未啟用）——真實模型的主題分析。缺密鑰時完全不參與，
 *      也**不得**把上面兩類描述成 AI 分析結果。
 *
 * 零執行期依賴、無建置步驟：與 js/app.js 同性質的經典腳本。
 * 只回傳資料與純函式，不碰 DOM、不發網路請求（載入器負責套用）。
 */
(function () {
  /* ── 1. 五個人工預設主題 ────────────────────────────────────────────────
     底色一律壓在深墨範圍（舞台繼承站點的深底人格），強調色取可讀的中高明度，
     primary 固定近白以免字看不清。intensity 是**動效強度**的建議值，
     不是情緒標籤：段落有能量資料時，段落的值仍然優先（見載入器的優先序）。 */
  var PRESETS = [
    {
      id: 'melancholy',
      label: '憂傷',
      mood: 'melancholy',
      colors: {
        background: '#0b0f18',
        primary: '#eef1f6',
        accent: '#6f8bb5',
        secondary: '#9aa7bd'
      },
      intensity: 'calm',
      background: 'common',
      rationale: '冷色、低飽和、低對比；配收斂的動效'
    },
    {
      id: 'warm',
      label: '溫暖',
      mood: 'warm',
      colors: {
        background: '#160f0b',
        primary: '#f7efe6',
        accent: '#d98f56',
        secondary: '#c9a68a'
      },
      intensity: 'normal',
      background: 'monet',
      rationale: '暖橙與駝色；中等動效'
    },
    {
      id: 'nostalgic',
      label: '懷舊',
      mood: 'nostalgic',
      colors: {
        background: '#12100c',
        primary: '#f2ece1',
        accent: '#b9925e',
        secondary: '#a89a86'
      },
      intensity: 'calm',
      background: 'common',
      rationale: '偏黃的褐與灰；低動效，像舊相紙'
    },
    {
      id: 'bright',
      label: '明亮',
      mood: 'bright',
      colors: {
        background: '#0a1214',
        primary: '#f0fbfc',
        accent: '#5fc8d0',
        secondary: '#a9d7dc'
      },
      intensity: 'normal',
      background: 'latent',
      rationale: '青綠與冷白；中等動效'
    },
    {
      id: 'intense',
      label: '激昂',
      mood: 'intense',
      colors: {
        background: '#180a0a',
        primary: '#fdf0ec',
        accent: '#e05c4a',
        secondary: '#e8a08c'
      },
      intensity: 'chaotic',
      background: 'nomand',
      rationale: '磚紅與暖白；高動效'
    }
  ];

  var PRESET_BY_ID = {};
  for (var i = 0; i < PRESETS.length; i++) {
    PRESET_BY_ID[PRESETS[i].id] = PRESETS[i];
  }

  /* 沒有可用預設時的預設值：中性、安全，不宣稱任何風格。 */
  var DEFAULT_PRESET = 'nostalgic';

  /* ── 2. 逐曲人工預設 ────────────────────────────────────────────────────
     只列**真的量過段落的歌**（storage/segments/ 目前 9 首），其餘一律走本地規則。
     依據欄寫的是實測能量區間與發行年代；`mode` 是推薦的 Folia 展示模式，
     純粹是審美選擇，使用者隨時可以手動換掉。 */
  var SONG_PRESETS = {
    /* 可愛女人 · Jay · 2000｜實測能量 0.110–0.551（calm 6 / normal 9 / chaotic 0）
       中低能量、氣質輕柔；挑懷舊＋柔和繪畫感的模式。 */
    'jay2000-1': {
      preset: 'nostalgic',
      mode: 'monet',
      note: '實測能量中低（0.11–0.55）、2000 年出道作；人工判斷為懷舊基調'
    },
    /* 第二天堂 · 第二天堂 · 2004｜實測能量 0.000–0.795（calm 2 / normal 13 / chaotic 3）
       有近無聲的開場、中段推到 0.785–0.795；挑激昂為主，開場與尾奏另用憂傷。 */
    'jj2004-1': {
      preset: 'intense',
      mode: 'fume',
      note: '實測能量跨度最大（0.00–0.80，含 3 段 chaotic 與近無聲開場）；人工判斷為激昂基調'
    },
    /* Out of the Woods · 1989 · 2014｜實測能量 0.036–0.713（calm 5 / normal 11 / chaotic 0）
       全程沒有 chaotic、副歌最高 0.713；挑明亮基調。 */
    'ts2014-4': {
      preset: 'bright',
      mode: 'sonnet',
      note: '實測能量中高但無 chaotic 段（0.04–0.71）；人工判斷為明亮基調'
    }
  };

  /* ── 3. 逐段人工預設（章節制） ──────────────────────────────────────────
     以段落**起始秒**為鍵（不是索引）：sidecar 重新分析後邊界可能微調，
     用秒數比對並留容差，比用索引耐得住重算。

     語意是**章節**而不是逐段列舉：某一條從它的 start 起生效，直到下一條。
     這樣覆蓋才是完整的——沒列到的段落沿用「當前章節」，
     不會出現「某段突然退回歌曲預設、下一段又跳回」的來回閃動；
     變化也因此是稀疏的（18 段只寫 7 處轉折），符合「不要每句歌詞都重新切換」。
     `mode` 一律不出現在這裡：模式由歌曲預設或使用者決定，
     段落只調光影、背景與動效強度。 */
  var SEGMENT_PRESETS = {
    'jay2000-1': [
      { start: 0, preset: 'nostalgic', background: 'common', intensity: 'calm' },
      { start: 61.9, preset: 'warm', intensity: 'normal' },
      { start: 90.3, preset: 'nostalgic', intensity: 'normal' },
      { start: 175.3, preset: 'warm', intensity: 'normal' },
      { start: 224.9, preset: 'nostalgic', background: 'common', intensity: 'calm' }
    ],
    'jj2004-1': [
      { start: 0, preset: 'melancholy', background: 'common', intensity: 'calm' },
      { start: 24, preset: 'warm', background: 'common', intensity: 'normal' },
      { start: 64.5, preset: 'bright', intensity: 'normal' },
      { start: 112.8, preset: 'warm', intensity: 'normal' },
      { start: 177.5, preset: 'intense', background: 'monet', intensity: 'chaotic' },
      { start: 220.5, preset: 'intense', background: 'nomand', intensity: 'chaotic' },
      { start: 251.7, preset: 'melancholy', background: 'common', intensity: 'calm' }
    ],
    'ts2014-4': [
      { start: 0, preset: 'bright', background: 'latent', intensity: 'calm' },
      { start: 41.1, preset: 'bright', intensity: 'normal' },
      { start: 66.9, preset: 'warm', intensity: 'normal' },
      { start: 124.3, preset: 'bright', intensity: 'normal' },
      { start: 228.6, preset: 'melancholy', background: 'common', intensity: 'calm' }
    ]
  };

  /* 段落起始秒的比對容差：重算後邊界漂移在 1 秒內仍算同一段。 */
  var SEGMENT_TOLERANCE_SEC = 0.75;

  /* Folia 的 6 種背景；只認得的才採用，不編造 id。 */
  var BACKGROUNDS = ['common', 'latent', 'monet', 'nomand', 'sora', 'url'];

  /* ── 色彩工具（純函式） ─────────────────────────────────────────────── */
  function clamp255(v) {
    var n = Math.round(Number(v));
    if (!isFinite(n)) return 0;
    return n < 0 ? 0 : n > 255 ? 255 : n;
  }

  function toHex(triple) {
    var t = Array.isArray(triple) ? triple : [120, 120, 130];
    var h = function (v) {
      return clamp255(v).toString(16).padStart(2, '0');
    };
    return '#' + h(t[0]) + h(t[1]) + h(t[2]);
  }

  /* 兩色線性混合，t=0 取 a、t=1 取 b。用來做環境光的中間色，避免只有兩個極端。 */
  function mix(hexA, hexB, t) {
    var pa = parseHex(hexA);
    var pb = parseHex(hexB);
    var k = Math.max(0, Math.min(1, t));
    return rgbToHex([
      pa[0] + (pb[0] - pa[0]) * k,
      pa[1] + (pb[1] - pa[1]) * k,
      pa[2] + (pb[2] - pa[2]) * k
    ]);
  }

  function parseHex(hex) {
    var s = String(hex || '').replace('#', '');
    if (s.length === 3) {
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    var n = parseInt(s, 16);
    if (!isFinite(n) || s.length !== 6) return [120, 120, 130];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(triple) {
    var h = function (v) {
      return clamp255(v).toString(16).padStart(2, '0');
    };
    return '#' + h(triple[0]) + h(triple[1]) + h(triple[2]);
  }

  /* 相對亮度（WCAG 用同一條公式）：拿來判斷強調色該不該提亮。 */
  function luminance(hex) {
    var p = parseHex(hex).map(function (v) {
      var s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  }

  /* ── 4. 本地規則：由封面主色派生主題 ────────────────────────────────────
     只用資料管線已經算好的 `album.tint`（封面主色三元組），不做任何取樣，
     所以同一個封面永遠得到同一組顏色（決定性）。 */
  function coverTheme(album, song) {
    var tint = (album && album.tint) || [120, 120, 130];
    var accent = toHex(tint);
    /* 背景往墨色壓：只留 18% 的色相，其餘交給站點的深底人格 */
    var bg = rgbToHex([tint[0] * 0.18, tint[1] * 0.18, tint[2] * 0.18]);
    /* 環境光取「強調色與背景之間」的偏亮一側；太暗就提亮，免得看不見。 */
    var ambient = mix(bg, accent, 0.6);
    if (luminance(ambient) < 0.02) {
      ambient = mix(ambient, '#ffffff', 0.25);
    }
    var secondary = mix(accent, '#f4f4f5', 0.45);
    return {
      mood: '封面派生',
      confidence: 0.3,
      colors: {
        background: bg,
        primary: '#f4f4f5',
        accent: accent,
        secondary: secondary
      },
      ambient: ambient,
      mode: null,
      background: null,
      intensity: 'normal',
      rationale: '由這張專輯封面的主色（資料管線的 tint）派生；確定性色彩運算，非情緒辨識',
      provenance: {
        source: 'cover',
        preset: null,
        promptVersion: null,
        inputFingerprint: (song && song.id) || ''
      }
    };
  }

  /* ── 5. 把預設展開成與 coverTheme() 同形的主題 ──────────────────────── */
  function themeFromPreset(preset, songId) {
    return {
      mood: preset.label,
      confidence: null,
      colors: {
        background: preset.colors.background,
        primary: preset.colors.primary,
        accent: preset.colors.accent,
        secondary: preset.colors.secondary
      },
      ambient: mix(preset.colors.background, preset.colors.accent, 0.6),
      mode: null,
      background: preset.background || null,
      intensity: preset.intensity || 'normal',
      rationale: preset.rationale,
      provenance: {
        source: 'preset',
        preset: preset.id,
        promptVersion: null,
        inputFingerprint: songId || ''
      }
    };
  }

  /* ── 6. 對外：這首歌要用哪個主題 ────────────────────────────────────── */
  function songPreset(songId) {
    return (songId && SONG_PRESETS[songId]) || null;
  }

  /**
   * 解析一首歌的自動主題。**永遠回得出東西**：有指派用人工預設，
   * 沒指派就用封面派生的本地規則；兩條路都不需要網路。
   * @returns {{ theme: object, origin: 'preset'|'cover', presetId: string|null, note: string|null }}
   */
  function resolveSong(song, album) {
    var assigned = songPreset(song && song.id);
    if (assigned) {
      var preset = PRESET_BY_ID[assigned.preset];
      if (preset) {
        var theme = themeFromPreset(preset, song.id);
        /* 歌曲層可以指定推薦模式（Folia 模式 id 由 JS 端驗證，這裡只帶字串）。 */
        theme.mode = assigned.mode || null;
        theme.note = assigned.note || null;
        return {
          theme: theme,
          origin: 'preset',
          presetId: preset.id,
          note: assigned.note || null
        };
      }
    }
    var derived = coverTheme(album, song);
    return { theme: derived, origin: 'cover', presetId: null, note: null };
  }

  /**
   * 解析某一段落的章節覆寫。採用「**最後一條不晚於該段的章節**」——
   * 不是只認精確命中：沒列到的段落要沿用當前章節，
   * 否則顏色會在章節之間來回跳。找不到任何章節才回 null（走安全預設：
   * 只讓段落能量驅動動效強度，不動主題與背景）。
   * @returns {{ theme: object|null, background: string|null, intensity: string|null, start: number }|null}
   */
  function resolveSegment(songId, segment) {
    var list = (songId && SEGMENT_PRESETS[songId]) || null;
    if (!list || !segment || !isFinite(segment.start)) return null;
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      /* 容差讓「邊界重算後差了零點幾秒」仍然認得同一條章節。 */
      if (list[i].start - SEGMENT_TOLERANCE_SEC <= segment.start) {
        hit = list[i];
      } else {
        break; /* 清單按 start 遞增 */
      }
    }
    if (!hit) return null;
    var entry = hit;
    var preset = entry.preset ? PRESET_BY_ID[entry.preset] : null;
    var bg =
      entry.background && BACKGROUNDS.indexOf(entry.background) !== -1 ? entry.background : null;
    return {
      start: entry.start,
      /* 只帶 colors 與 intensity：與 stage/src/StageRoot.jsx 的 mergeThemeInput 契約一致。 */
      theme: preset
        ? {
            colors: {
              background: preset.colors.background,
              primary: preset.colors.primary,
              accent: preset.colors.accent,
              secondary: preset.colors.secondary
            },
            intensity: entry.intensity || preset.intensity || null,
            provenance: { source: 'preset', preset: preset.id }
          }
        : null,
      background: bg,
      intensity: entry.intensity || (preset ? preset.intensity : null)
    };
  }

  /** 選單用：五個預設＋兩個「跟隨歌曲」選項。 */
  function presetOptions() {
    var out = [{ id: '', label: '跟隨歌曲' }];
    for (var i = 0; i < PRESETS.length; i++) {
      out.push({ id: PRESETS[i].id, label: PRESETS[i].label });
    }
    return out;
  }

  /** 這首歌有沒有被人工指派過（狀態列要分開講，所以需要問得到）。 */
  function hasSongPreset(songId) {
    return Boolean(songPreset(songId));
  }

  window.JCStageThemes = {
    PRESETS: PRESETS,
    DEFAULT_PRESET: DEFAULT_PRESET,
    BACKGROUNDS: BACKGROUNDS,
    SEGMENT_TOLERANCE_SEC: SEGMENT_TOLERANCE_SEC,
    presetById: function (id) {
      return PRESET_BY_ID[id] || null;
    },
    presetOptions: presetOptions,
    songPreset: songPreset,
    hasSongPreset: hasSongPreset,
    segmentPresets: function (songId) {
      return (songId && SEGMENT_PRESETS[songId]) || null;
    },
    resolveSong: resolveSong,
    resolveSegment: resolveSegment,
    coverTheme: coverTheme,
    themeFromPreset: themeFromPreset,
    /* 色彩工具也開放，方便驗收時對帳（例如檢查對比度）。 */
    mix: mix,
    luminance: luminance,
    toHex: toHex
  };
})();
