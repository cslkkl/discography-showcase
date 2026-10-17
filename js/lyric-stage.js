/*  js/lyric-stage.js — Task 04 完整歌詞舞台的站點側裝載器
 *
 *  零依賴、無建置，隨 artist.html 以經典腳本載入。它只做「裝載與銜接」，
 *  不做渲染：真正的 14 種 Folia 模式在獨立子專案 stage/ 裡建置成
 *  `stage/dist/lyric-stage.js`，未進舞台前不載入任何渲染器（含 CSS）。
 *
 *  契約見 docs/task-04-architecture.md：
 *    · 全站只有一個 <audio id="plAudio">（js/app.js 擁有）；舞台不得建第二個音訊元素，
 *      停／播／拖進度／上下首一律由站點驅動，舞台只「請求」seek。
 *    · 舞台放在 Shadow DOM 裡：stage 的 CSS 是上游 Tailwind 產物（199 KB，內含 :root
 *      與 html/body 級選擇器），直接掛進文件會改到站點樣式；放進 shadow root 兩邊互不影響。
 *    · 逐行 LRC 沒有逐字時間，舞台側標成 estimated（見 stage/src/bridge/lines.js）。
 *
 *  三條歌詞入口（播放列按鈕、歌曲檔案的「閱讀歌詞」、狀態列「查看歌詞」）都收斂到
 *  `open(albumId, n)`；js/app.js 只在 `window.JCLyricStage` 存在時改走這裡，
 *  取不到模組（例如 file:// 下 CORS 擋掉 import）就退回原本的 js/lyrics.js 舞台。
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 產物路徑與本機受控 AI 主題服務（tools/theme-service.mjs）。
     服務是**可選**的：連不上就用封面主題、沒有段落，舞台照常可用。 */
  var STAGE_DIR = 'stage/dist/';
  var MODULE_FILE = 'lyric-stage.js';
  var CSS_FILE = 'assets/lyric-stage.css';
  /* 舞台產物的版本戳，由 `npm run stamp` 依 **stage/dist/ 的內容雜湊** 寫入。
     為什麼需要：舞台產物是固定檔名，HTML 引用不到它們，只蓋 HTML 的章對它們無效——
     重建舞台之後瀏覽器仍會沿用舊模組，是同一個混版事故換一個入口。
     這一行是 stamp 唯一的寫入點（標記不可改字串），下面兩個 URL 都吃它。 */
  /* stamp:stage-version */ var STAGE_VERSION = '1a7ae92d';
  var SERVICE = 'http://127.0.0.1:8788';
  var SERVICE_TIMEOUT = 2500;

  /* 產物路徑一律以 **document.baseURI** 解成絕對 URL。
     不能把相對字串直接丟給 import()：動態 import 是相對「腳本自己的 URL」解析，
     這支在 js/ 底下，會變成 /js/stage/dist/lyric-stage.js（實測 404，整個舞台掛不上）。
     fetch() 走的是文件基底，兩者不一致正是這個坑難看的地方。
     帶上 STAGE_VERSION：沒有它，import() 與 fetch() 都會命中同一個舊快取的 URL。 */
  function stageUrl(file) {
    var url = new URL(STAGE_DIR + file, document.baseURI);
    if (STAGE_VERSION) url.searchParams.set('v', STAGE_VERSION);
    return url.href;
  }

  /* 模式與背景的中文名：舞台只回 id，站點要顯示人看得懂的名字。
     沒列到的 id 直接顯示 id，不編造名稱。
     這裡（以及本檔所有寫進 DOM 的文案）一律寫**繁體原文**：站點的語言層
     （js/app.js 的 localize()）認的就是「繁體原文」，寫完之後由站點補一次轉換。
     不能自己先轉簡體——localize() 會把第一次看到的字串記成快取原文，
     自己先轉會讓那份原文變成簡體，繁簡切換就再也回不去（全站文案同一條規則）。 */
  var MODE_LABEL = {
    classic: '經典',
    monet: '莫內',
    cadenza: '華彩',
    partita: '組曲',
    fume: '煙墨',
    claddagh: '克拉達',
    cappella: '人聲',
    tilt: '傾斜',
    diorama: '微縮',
    pendolo: '鐘擺',
    sonnet: '十四行',
    tempera: '蛋彩',
    lumiere: '繪光'
  };
  /* 不提供給使用者的模式：`still`（靜止／字幕居中不動）。
     為什麼是「白名單式隱藏」而不是從清單刪掉：上游的 BUILTIN_VISUALIZER_MODES
     （stage/vendored/folia/src/types/visualizerModes.ts）是逐字複本、不得修改，
     而且它在 registry 初始化時會斷言「清單 ≡ 各模式的 entry 目錄」——只刪清單項
     會當場拋錯。所以站點側在**建選單與選值時**把它濾掉：使用者選不到、下拉裡不存在，
     舞台內部仍認得這個 id（auto 若回報它，由 syncFromState／掛載處回退到 monet）。
     注意：`stillCovered`（滾動鎖定那段）是英文副詞，與此無關，別一起改。 */
  var MODE_HIDDEN = { still: 1 };
  var BG_LABEL = {
    common: '素底',
    latent: '潛像',
    monet: '莫內',
    nomand: '無界',
    sora: '天空',
    url: '自訂圖'
  };
  /* 每一個模式的**一句效果**（MODE_DESC）。上游只給 id 與詩性名字（見上面
     MODE_LABEL），沒看過的人分不出「微縮」「十四行」「克拉達」差在哪裡，
     所以再給一句人話：MODE_DESC 說「是什麼」——4–8 個漢字，
     收合後顯示在控件上、展開時在每一列第二行。
     這些句子是**照 stage/vendored/folia 各模式的實作**寫的，不是照名字猜的：
       classic  逐詞發光，字在原地亮起、唱過的字留下餘光（classic/Visualizer.tsx 的 waiting／active／passed）
       monet    左側一條可捲動的歌詞欄，遠近的行分大小與模糊（monet/MonetLyricsRail.tsx）
       cadenza  一句拆成片段、散到種子決定的落點上，唱過的字繼續漂（cadenza/cadenzaPlacements.ts）
       partita  一行先切塊、再排進欄位裡，字在欄內錯開亮（partita/partitaLayout.ts）
       fume     整首排成一篇文稿，相機在文稿上移動、字逐字印出來（fume/fumeArticleLayout.ts）
       claddagh 字素沿橢圓排成一圈，字距按量測展開（claddagh/claddaghLayout.ts）
       cappella 一行一句的對話氣泡，左右各有頭像與表情（cappella/cappellaMessages.ts）
       tilt     一句拆成 1–4 行，字的上下位移交錯（tilt/VisualizerTilt.tsx 的 tilt offsets）
       diorama  三維場景，鏡頭沿蜿蜒路徑逐句飛行（diorama/CameraRig.tsx、dioramaSequencer.ts）
       pendolo  歌詞排在左側的弧線上，換行時擒縱輪與擺錘走一格（pendolo/pendoloGeometry.ts）
       sonnet   大字海報分鏡，鏡頭追著正在唱的那個字（sonnet/sonnetCameraTracking.ts）
       tempera  網點版畫拼貼，每隔幾秒換一幅構圖（tempera/temperaCompositions.ts）
       lumiere  近黑底上的體積光束與煙塵，被光掃到的字才亮（lumiere/light/rig.ts）
     一律只講使用者看得到的東西；不寫 WebGL／shader／particle 一類的實作詞。 */
  var MODE_DESC = {
    classic: '逐字點亮',
    monet: '左側歌詞滾動',
    cadenza: '詞句散落浮游',
    partita: '分欄分行排布',
    fume: '墨跡逐字浮現',
    claddagh: '詞句繞成一圈',
    cappella: '對話氣泡逐句',
    tilt: '字句高低錯落',
    diorama: '三維場景穿行',
    pendolo: '擺錘環形走字',
    sonnet: '海報字版運鏡',
    tempera: '版畫拼貼換景',
    lumiere: '光束穿透煙霧'
  };
  var INTENSITY_LABEL = { calm: '收斂', normal: '一般', chaotic: '奔放' };

  var stageEl,
    sfHost,
    sfTitle,
    sfMeta,
    sfMode,
    sfModeList,
    sfModeName,
    sfModeDesc,
    sfBg,
    sfIntensity,
    sfTheme,
    sfAuto,
    sfStatus,
    sfClose;
  var stageMount = null; /* 已載入的舞台模組 */
  var handle = null; /* 掛載後的 StageHandle */
  var stageHost = null; /* 這一輪掛載用的宿主（每次掛載換一個新 div，見 mountStage） */
  /* 尚未完成的卸載：teardown() 觸發的卸載還沒跑完就重開時，新實例要排得到它後面
     （見 disposeStage）。上游 handle.dispose() 是非同步的，不排隊就會出現
     「舊根還在卸、新根已掛上」。 */
  var pendingUnmount = Promise.resolve();
  /* 等上一輪卸載的上限（毫秒）：正常卸載是幾十毫秒，這個值只在「上游卡住」時生效，
     用來保證新一輪不會被永遠拖住（見 waitForUnmount）。 */
  var UNMOUNT_WAIT_MS = 1500;
  var activeMode = null; /* 舞台實際在跑的那個模式（選單要反映它，不是選單自己的第一項） */
  /* 已經為哪個「不提供的模式」送過回退命令：同一個 id 只送一次，
     免得 auto 持續回報 still 時每幀都下命令（回報↔回退互踢）。 */
  var modeFallbackSent = '';
  /* 站點預設模式：與 js/stage-themes.js 的 DEFAULT_MODE 對齊。
     這裡另存一份是因為「隱藏模式的回退」屬選單層，不該依賴主題模組先載入。 */
  var DEFAULT_MODE = (window.JCStageThemes && window.JCStageThemes.DEFAULT_MODE) || 'monet';
  var bridge = null;
  var analyser = null;
  var shellReady = false;
  var openSeq = 0; /* 過期回應守衛：換歌後才回來的分析結果一律作廢 */
  var activeRef = null; /* 舞台正對應的那一首：{ album, n } */
  var activeSongId = null;
  var lastFocus = null;
  var THEME_CACHE = {}; /* songId → SongTheme，模組層快取（同一首歌只分析一次） */
  /* 主題服務的 meta 按**歌曲 id** 存，供狀態列區分「真實 AI」「測試替身」「封面派生」。
     舊版只看 theme.provenance.source === 'ai' 就寫「主題：AI」，
     於是測試替身（model:'test-double'）也會被寫成真實 AI。
     為什麼按歌曲存而不是只留「最近一次」：分析是並行的，慢的那一首回來時
     使用者可能已經換歌；寫進單一全域會讓新歌的狀態列掛上舊歌的來源標記
     （舊歌的 AI／替身診斷會冒充成新歌的）。 */
  var THEME_META = {}; /* songId → { status, reason, testDouble, model, elapsedMs } */
  var THEME_PENDING = {}; /* songId → Promise：同一首同時只送一次（去重） */
  var THEME_GEN = {}; /* songId → 代次：只有最新那一輪可以寫快取與 meta */
  var lastStageState = null; /* 舞台回報的最新狀態快照（見 onState） */
  var lastLocalTheme = null; /* 這一首的本地自動主題（人工預設或封面派生），選單與恢復自動都用它 */
  /* 預設主題的中文名：**惰性**讀 js/stage-themes.js，避免依賴兩支腳本的載入順序。
     取不到就回 null，狀態列顯示 id——不編造名稱。 */
  function presetLabel(id) {
    var t = window.JCStageThemes;
    if (!t || !t.presetById) return null;
    var p = t.presetById(id);
    return p ? p.label : null;
  }

  /* 目前這一首的主題服務 meta：只認 activeSongId 那一格。
     舊歌的遲到回應因此不會被讀到，也不會覆蓋新歌的來源。 */
  function currentAiMeta() {
    return activeSongId ? THEME_META[activeSongId] || null : null;
  }

  /* ── 取節點 ─────────────────────────────────────────────────────────── */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function nodes() {
    if (shellReady) return true;
    stageEl = document.getElementById('stageFull');
    if (!stageEl) return false;
    sfHost = $('#sfHost', stageEl);
    sfTitle = $('#sfTitle', stageEl);
    sfMeta = $('#sfMeta', stageEl);
    sfMode = $('#sfMode', stageEl);
    sfModeList = $('#sfModeList', stageEl);
    sfModeName = sfMode ? $('.sf-mode-name', sfMode) : null;
    sfModeDesc = sfMode ? $('.sf-mode-desc', sfMode) : null;
    sfBg = $('#sfBg', stageEl);
    sfIntensity = $('#sfIntensity', stageEl);
    sfTheme = $('#sfTheme', stageEl);
    sfAuto = $('#sfAuto', stageEl);
    sfStatus = $('#sfStatus', stageEl);
    sfClose = $('#sfClose', stageEl);
    shellReady = true;
    return true;
  }

  /* ── 站點查詢：跨歌手解析那一首（見 js/app.js 的 trackOf） ───────────── */
  function lookup(albumId, n) {
    var t = window.JCTracks;
    if (!t || typeof t.trackOf !== 'function') return null;
    return t.trackOf(albumId, n);
  }

  /* 狀態列由**兩段**組成，彼此不覆蓋：
       · 訊息（lastMessage）：使用者做了什麼、發生什麼事（按鍵回饋、降級說明）。
       · 摘要（lastSummary）：畫面上**現在**是什麼（主題來源、段落、鎖定、實際主色）。
     舊版只有一個字串，於是兩者互相蓋掉：段落覆寫後摘要就被舊訊息吃掉，
     狀態列也不再反映當下（實測主色已換、狀態列仍寫舊的）。
     摘要一律由 refreshSummary() 現算，不在呼叫端拼字串。 */
  var lastMessage = '';
  var lastSummary = '';
  var statusTheme = null; /* 摘要裡「主題來源」要用哪一份主題 */
  var statusSegments = null; /* 目前套用的段落（含人工預設標記） */

  function renderStatus() {
    if (!nodes() || !sfStatus) return;
    var parts = [];
    if (lastMessage) parts.push(lastMessage);
    if (lastSummary) parts.push(lastSummary);
    sfStatus.textContent = parts.join(' · ');
    /* 沒有話要說就整塊不佔位：控制列是 flex 版面（.sf-status 有 flex: 1 1 60%），
       空節點留著會多一段空白。用 hidden 語意化隱藏空容器，不是拿 CSS 藏文字。 */
    sfStatus.hidden = parts.length === 0;
    /* 每一次寫入都是新的文字節點，站點切換語言時掃不到「還沒寫出來」的字，
       所以寫完就請站點補一次轉換（見 notifyStageText）。 */
    notifyStageText();
    /* 內部細節（鎖定項目／段落驅動了什麼／信心／來源／逐字精度）不進可見文案，
       改放屬性供排查；可見那一行因此只留下使用者真正讀得懂的句子。 */
    try {
      sfStatus.setAttribute('data-status-detail', statusDetail());
    } catch {
      /* 診斷字串失敗不影響可見狀態列 */
    }
  }

  /* 重算摘要。呼叫端只要在「狀態可能變了」時叫一次，內容一律現算。
     **這裡絕不能拋錯**：它被 syncFromState／onState 呼叫，而 onState 是舞台的
     回報路徑——一次例外會沿著 React 的提交往上冒，把 mountStage 的 then 鏈打斷，
     後面的初始化（例如主題選單的填充）就再也不會執行。
     實測踩過：themeLine 讀了 null 的 theme.mood，主題選單因此永遠是空的。 */
  function refreshSummary() {
    try {
      lastSummary = describe(statusTheme, statusSegments, degradedLine(lastStageState));
    } catch {
      /* 摘要壞掉只影響那一行字，不能影響舞台本身。 */
      lastSummary = '';
    }
    renderStatus();
  }

  /** 寫一則訊息；摘要會接在後面，不會被蓋掉。 */
  function say(text) {
    lastMessage = text || '';
    renderStatus();
  }

  /** 換一份主題／一組段落時，先記下來再重算摘要。 */
  function setStatusSource(theme, segments) {
    statusTheme = theme || null;
    if (segments !== undefined) statusSegments = segments || null;
    refreshSummary();
  }

  /* ── 歌詞文本：走站點的解析器，不另寫一套 ───────────────────────────── */
  /* 回傳 Promise<{lines, text}>；取不到或解析不出就 rejected。 */
  function fetchLyrics(track) {
    return new Promise(function (resolve, reject) {
      var rel = track && track.lyrics;
      if (!rel) {
        reject(new Error('no-lyrics'));
        return;
      }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', rel, true);
      xhr.onload = function () {
        if (xhr.status && xhr.status !== 200 && xhr.status !== 0) {
          reject(new Error('http ' + xhr.status));
          return;
        }
        var text = xhr.responseText || '';
        var parser = window.JCLyrics && window.JCLyrics.parseLrc;
        var lines = parser ? parser(text, track.zh) : [];
        if (!lines.length) {
          reject(new Error('empty'));
          return;
        }
        resolve({ lines: lines, text: text });
      };
      xhr.onerror = function () {
        reject(new Error('xhr-error'));
      };
      xhr.send(null);
    });
  }

  /* 取不到歌詞的內部代碼（no-lyrics / empty / xhr-error / http N）不直接給使用者看：
     實測狀態列會出現「舞台載入失敗（empty）」這種英文代碼，使用者分不出
     「這個檔沒有可用的時間軸」與「檔案讀不到」。 */
  function lyricFailText(err) {
    var code = (err && err.message) || '';
    if (code === 'no-lyrics') return '這首沒有本機歌詞';
    if (code === 'empty') return '這個歌詞檔沒有可用的時間軸';
    if (code === 'xhr-error' || /^http /.test(code)) return '讀不到歌詞檔';
    return '舞台載入失敗';
  }

  /* ── 封面主題：沒有 AI 也要能看的那條路（不是降級替代品） ───────────── */
  /* 由專輯封面派生的主色（資料管線已算好 tint / sourceAvg）組一組深底主題。 */
  function coverTheme(album, song) {
    var tint = (album && album.tint) || [120, 120, 130];
    var toHex = function (v) {
      var c = Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0');
      return c;
    };
    var base = '#' + toHex(tint[0]) + toHex(tint[1]) + toHex(tint[2]);
    /* 背景往墨色壓：只留 18% 的色相，其餘交給站點的深底人格 */
    var bg = '#' + toHex(tint[0] * 0.18) + toHex(tint[1] * 0.18) + toHex(tint[2] * 0.18);
    return {
      mood: '封面派生',
      confidence: 0.3,
      colors: { background: bg, primary: '#f4f4f5', accent: base, secondary: '#c9c9d1' },
      mode: null,
      background: null,
      intensity: 'normal',
      rationale: '由這張專輯封面的主色派生；未接上 AI 主題服務時使用',
      provenance: {
        source: 'cover',
        promptVersion: null,
        inputFingerprint: (song && song.id) || ''
      }
    };
  }

  /* ── 本機受控 AI 主題服務（可選） ───────────────────────────────────── */
  function serviceJson(path, options, timeoutMs) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('no-fetch'));
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = 0;
    if (ctl) {
      timer = setTimeout(function () {
        ctl.abort();
      }, timeoutMs || SERVICE_TIMEOUT);
    }
    var opts = options || {};
    if (ctl) opts.signal = ctl.signal;
    return fetch(SERVICE + path, opts)
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error('service ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  /* 整曲主題：先快取，再問服務。輸入只在本機（127.0.0.1）流動，不上傳音檔。
     請求形狀以 tools/theme-service.mjs 的 /theme 為準：`{ song, lyricsText, ... }`，
     不是站點自己的欄位名。原本送 `{ songId, title, artist, lyrics }`，
     服務端讀不到 song.id 就回降級主題（實測日誌 `song-id-missing`），
     舞台因此永遠停在「封面派生」——鏈路看起來是通的，其實輸入一直是空的。 */
  function requestTheme(song, lyricsText) {
    var key = song.id;
    if (THEME_CACHE[key]) return Promise.resolve(THEME_CACHE[key]);
    /* 同一首歌已經在問了：合併到同一條 promise，不要再送一次。
       兩條並行的請求會互相覆蓋 THEME_CACHE／THEME_META——後回來的那條
       （可能是舊的）會把新的結果蓋掉，快取就此定格在較舊的那一份。 */
    if (THEME_PENDING[key]) return THEME_PENDING[key];
    /* 代次：同一首歌每起一輪就 +1，只有最新那一輪可以寫快取與 meta。
       目前去重已讓「同一首兩條並行」不可能發生，這道守衛是為了將來
       任何繞過 THEME_PENDING 的路徑（先防守，不靠單一機制）。 */
    var gen = (THEME_GEN[key] = (THEME_GEN[key] || 0) + 1);
    var body = {
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year
      },
      lyricsText: lyricsText,
      /* 逐行歌詞一併送出：服務端會用時間軸做覆蓋檢查（見 tools/lib/lyrics.mjs） */
      lines: arguments.length > 2 ? arguments[2] : undefined
    };
    var req = serviceJson(
      '/theme',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      },
      60000
    ).then(function (payload) {
      var theme = payload && (payload.theme || payload);
      if (!theme || !theme.colors) throw new Error('bad-theme');
      /* 服務的 meta 才是「這份主題是誰做的」的權威來源：
         testDouble 為 true 時它是測試替身，不是真實模型結果。 */
      var meta = (payload && payload.meta) || null;
      /* 已經不是最新那一輪：把結果交給呼叫端，但不寫快取與 meta
         （寫了就會蓋掉較新那一輪的結果）。 */
      if (THEME_GEN[key] !== gen) return theme;
      /* 寫進**這一首歌**的那一格（見 THEME_META 的說明）：查詢端 currentAiMeta()
         只讀現役那首，所以遲到的舊回應覆蓋不到新歌的來源標記。 */
      THEME_META[key] = meta
        ? {
            status: meta.status || null,
            reason: meta.reason || null,
            testDouble: meta.testDouble === true || theme.model === 'test-double',
            model: theme.model || null,
            elapsedMs: meta.elapsedMs != null ? meta.elapsedMs : null
          }
        : {
            status: null,
            reason: null,
            testDouble: theme.model === 'test-double',
            model: theme.model || null,
            elapsedMs: null
          };
      THEME_CACHE[key] = theme;
      return theme;
    });
    THEME_PENDING[key] = req;
    /* 不論成功或失敗都要清掉在途標記，否則同一首會永遠拿到同一個已失敗的 promise。
       只有「還是我這一條」才清，避免清掉後來者的紀錄。 */
    var clear = function () {
      if (THEME_PENDING[key] === req) delete THEME_PENDING[key];
    };
    req.then(clear, clear);
    return req;
  }

  /* 段落：由 tools/analyze-audio.mjs 預先算好、存在 storage/segments/；沒有就不分段。 */
  function requestSegments(songId) {
    return serviceJson('/segments/' + encodeURIComponent(songId), { method: 'GET' }).then(
      function (payload) {
        var list = payload && (payload.segments || payload);
        if (!Array.isArray(list) || !list.length) throw new Error('no-segments');
        return list;
      }
    );
  }

  /* 段落的靜態回退：sidecar 本來就在 storage/segments/ 裡（機器產物，不含歌詞全文、
     不含本機路徑），所以直接讀檔即可。這一條讓**完全沒有服務**的環境也能段落驅動，
     是本輪「不依賴外部服務」的一半；服務在線時仍優先問服務（可能更新）。 */
  function staticSegments(songId) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('no-fetch'));
    var url = new URL('storage/segments/' + encodeURIComponent(songId) + '.json', document.baseURI);
    return fetch(url.href).then(function (res) {
      if (!res.ok) throw new Error('static-segments ' + res.status);
      return res.json();
    });
  }

  /* 先服務、後靜態。兩者都沒有就回 null（舞台走「未接上段落分析」的說明）。 */
  function loadSegments(songId) {
    return requestSegments(songId).catch(function () {
      return staticSegments(songId).then(function (payload) {
        var list = payload && (payload.segments || payload);
        if (!Array.isArray(list) || !list.length) throw new Error('no-segments');
        return list;
      });
    });
  }

  /* ── 本地視覺主題系統（js/stage-themes.js）────────────────────────────
     這是本輪的架構調整：AI 從「核心依賴」降為「可選精修」。
     舞台啟動只需要這裡的本地解析——人工預設或封面派生的本地規則，兩者都不需要網路。 */
  function themes() {
    return window.JCStageThemes || null;
  }

  /* 解析一首歌的自動主題。沒有載入 stage-themes.js 時退回內建的封面取色，
     所以「少了那支腳本」不會讓舞台沒有背景。 */
  function resolveLocalTheme(song, album) {
    var t = themes();
    if (t && typeof t.resolveSong === 'function') {
      try {
        return t.resolveSong(song, album);
      } catch {
        /* 預設資料壞掉不該讓舞台開不起來：落到下面那條最保險的路。 */
      }
    }
    return { theme: coverTheme(album, song), origin: 'cover', presetId: null, note: null };
  }

  /* 段落 → 舞台認得的段落。把逐段人工預設攤平成
     `{ theme, background, intensity }`，與 stage/src/StageRoot.jsx 的
     mergeThemeInput 契約一致（theme 只帶 colors／intensity／provenance）。
     沒有配置的段落原樣放行：舞台端只用它的 energy 決定動效強度。 */
  function augmentSegments(songId, list) {
    var t = themes();
    if (!t || typeof t.resolveSegment !== 'function') return list;
    return list.map(function (seg) {
      var override = null;
      try {
        override = t.resolveSegment(songId, seg);
      } catch {
        override = null;
      }
      if (!override) return seg;
      var next = {};
      for (var k in seg) {
        if (Object.prototype.hasOwnProperty.call(seg, k)) next[k] = seg[k];
      }
      if (override.theme) next.theme = override.theme;
      if (override.background) next.background = override.background;
      if (override.intensity) next.intensity = override.intensity;
      /* 段落的來源標記：狀態列與驗收都要看得出這是人工預設，不是模型判斷。 */
      next.presetSource = 'manual-preset';
      return next;
    });
  }

  /* 這份主題是不是**真的模型結果**。封面降級、測試替身、缺欄位一律不算。
     這一條是「不得在沒有真實 AI 響應時顯示 AI 分析成功」的唯一判據。 */
  function isRealAiTheme(theme) {
    if (!theme) return false;
    var source = theme.provenance && theme.provenance.source;
    var meta = currentAiMeta();
    var model = theme.model || (meta && meta.model) || null;
    var isDouble = !!(meta && meta.testDouble) || model === 'test-double';
    var status = meta && meta.status;
    /* 快取命中算數（內容本來就是模型產生並存下來的），但替身快取不算。 */
    var fromModel =
      source === 'ai' || source === 'cache' || status === 'generated' || status === 'cache-hit';
    return Boolean(fromModel && !isDouble);
  }

  /* 狀態列要顯示「現在畫面上用的是哪一份主題」：
     真實 AI 進來就用它，否則就是本地的那一份。 */
  function currentThemeFor(aiTheme, localTheme) {
    return isRealAiTheme(aiTheme) ? aiTheme : localTheme;
  }

  /* ── 舞台模組與樣式：按需載入，只載一次 ─────────────────────────────── */
  var cssInjected = false;

  /* shadow root 要在**注入樣式之前**就存在。原本 loadCss 直接 appendChild 到
     sfHost.shadowRoot，那時它還是 null（第一次開舞台），於是樣式整個沒進去——
     實測：shadow 有了、.stage-root 也有了，但 styleTags = 0，舞台在無樣式下渲染。
     這個函式是唯一的建立點，mountStage 也用同一個。 */
  function ensureShadow() {
    if (!sfHost) return null;
    return sfHost.shadowRoot || sfHost.attachShadow({ mode: 'open' });
  }

  function loadCss() {
    if (cssInjected) return Promise.resolve();
    var root = ensureShadow();
    if (!root) return Promise.reject(new Error('no-shadow-root'));
    return fetch(stageUrl(CSS_FILE))
      .then(function (res) {
        if (!res.ok) throw new Error('css ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var style = document.createElement('style');
        style.setAttribute('data-stage-css', '');
        /* 前面這一段是站點側的必要補丁，不是上游樣式：文件裡的 CSS 進不了 shadow root，
           而 shadow 裡的 .stage-full-root 是我們自己加的包裝層，上游不認得它，
           沒有這條它的高度就是 0（實測 .stage-root 量到 0，畫布與歌詞都沒有尺寸）。 */
        style.textContent =
          ':host{display:block;width:100%;height:100%;}' +
          '.stage-full-root{position:relative;width:100%;height:100%;overflow:hidden;}' +
          /* monet 的構圖容器（上游 inline `height: clamp(280px,52vh,520px)`）是左列的
             第 3 個在流子元素，上面壓著「歌手名＋間距＋歌名」（實測 210.2px），而列內
             零餘量（內容 726.7 / 盒子 726.6），所以容器的 Y 就等於上方兩塊之和，
             表現在畫面上是構圖偏下：實測 1440×901 中心差 +81.09px、390×845 +60.8px。
             修法只做一件事：容器留在流內，用 transform 把它整體上移（不影響任何兄弟
             與頁腳的排版，也不改高度）。上移量隨視口漂（原 52.8～81.1，徽章隱藏後各 +24），
             所以按寬度分檔，
             五檔殘差都 ≤5px；不用絕對定位——那會把包含塊換成左列的 padding box，
             實測容器 x 由 3 漂到 −53、歌詞整體左移 56px（已驗證為回歸，故否掉）。
             只作用於 monet：其餘 13 個模式命中 0；diorama／cadenza 的「等待音樂」
             空態帶不在這條選擇器路徑上。

             四檔在 2026-10-17 各再加 24px（−57／−69／−77／−81 → −81／−93／−101／−105）：
             下面的「主題說明徽章」改成 display:none 之後，左列少了那 48px 內容，
             `justify-center` 於是整體下移 24.00px（五檔實測位移差一律 24.00），
             把已經調好的歌詞位置推低了。補回 24px 後中心差回到原本驗收過的
             +0.09／−3.59／−0.07／+3.80／+3.80（768×1024 −6.92、1920×1080 +6.72 屬檔外殘差）。
             若日後恢復那枚徽章，這 24px 必須一併退回。 */
          ".stage-root[data-stage-mode='monet'] .stage-layer .relative.select-none.overflow-hidden{transform:translateY(-81px);}" +
          "@media (min-width:640px){.stage-root[data-stage-mode='monet'] .stage-layer .relative.select-none.overflow-hidden{transform:translateY(-93px);}}" +
          "@media (min-width:1100px){.stage-root[data-stage-mode='monet'] .stage-layer .relative.select-none.overflow-hidden{transform:translateY(-101px);}}" +
          "@media (min-width:1200px){.stage-root[data-stage-mode='monet'] .stage-layer .relative.select-none.overflow-hidden{transform:translateY(-105px);}}" +
          /* monet 與 tempera 各自在左列底部渲染一枚「主題說明」徽章（上游
             VisualizerMonet.tsx / VisualizerTempera 的 `.mt-auto.pt-4` 容器內那個
             `.rounded-full`），文字是 theme.rationale，例如「青綠與冷白；中等動效」。
             那是**給設計者看的推理說明**，不是使用者需要的操作資訊，而且預設模式改成
             monet 之後它正好壓在控制列的標籤行上：徽章 y=752、高 16，`歌词模式` 標籤
             y=751，兩行字疊在一起（實測重疊 16px，截圖可辨）。
             這裡是站點側覆蓋（與上面那條位移補丁同一條路徑），只隱藏這一個容器：
             選擇器限定 `.stage-root .stage-layer` 底下，其餘 11 個模式命中 0，
             上游 vendored 一個位元組都沒動。 */
          '.stage-root .stage-layer .mt-auto.pt-4{display:none !important;}' +
          text;
        root.appendChild(style);
        cssInjected = true;
      });
  }

  function loadModule() {
    if (stageMount) return Promise.resolve(stageMount);
    return import(/* webpackIgnore: true */ /* @vite-ignore */ stageUrl(MODULE_FILE)).then(
      function (mod) {
        stageMount = mod;
        return mod;
      }
    );
  }

  function fillSelect(sel, ids, labels) {
    sel.textContent = '';
    ids.forEach(function (id) {
      var opt = document.createElement('option');
      opt.value = id;
      opt.textContent = labels[id] || id;
      sel.appendChild(opt);
    });
  }

  /* ── 模式選擇器：自繪 combobox／listbox ────────────────────────────────
     為什麼把原生 <select> 換掉：展開的清單在沒有 customizable select
     （appearance: base-select）的瀏覽器上仍是系統外觀——方角、系統亮藍選中，
     而站點指定的呈現是「名稱＋一句效果」的兩級資訊、深色半透明、可內部滾動、
     開合有輕微位移。原生清單無法同時滿足這幾條，所以自繪。

     可及性契約（與原生 select 對齊，不退化）：
       · role=combobox ＋ aria-haspopup/aria-expanded/aria-controls（在 HTML 上）
       · role=listbox／role=option ＋ aria-selected（在每一列上）
       · 焦點**一律留在按鈕上**，用 aria-activedescendant 指出游標那一列——
         所以舞台的焦點圍籬（stageFocusables）看到的 Tab 停點與原生 <select>
         一模一樣只有一個，不會多出 14 個；Tab／Shift+Tab 的行為也不必改。
       · Enter／Space／↓／↑／Home／End／首字快選／Esc／Tab 都支援。
     值一律經過 setModeValue()／currentMode()，不要直接讀寫 .value：
     按鈕沒有 select 的 value 語意，而且程式化同步不該觸發 change。 */
  var modeValue = null; /* 目前選中的模式（按鈕上顯示的那一個） */
  var modeActive = null; /* 清單裡鍵盤游標所在的那一個（不一定等於 modeValue） */
  var modeMenuOpen = false;
  var modeCloseTimer = 0; /* 關閉動畫的收尾計時器（見 closeModeMenu） */

  function modeValueOf(el) {
    return el && el.dataset ? el.dataset.value || null : null;
  }

  function modeOptionEls() {
    return sfModeList ? Array.prototype.slice.call(sfModeList.children) : [];
  }

  /** 目前選中的模式 id；沒有選單時回 null。 */
  function currentMode() {
    return modeValue;
  }

  /** 清單中目前游標所在的節點。 */
  function modeActiveEl() {
    if (!sfModeList || !modeActive) return null;
    return $('#sfModeOpt-' + modeActive, sfModeList);
  }

  /** 更新按鈕上顯示的「名稱＋效果」與每一列的 aria-selected。 */
  function setModeValue(id) {
    if (!sfMode || !sfModeList) return false;
    var hit = null;
    modeOptionEls().forEach(function (el) {
      var on = modeValueOf(el) === id;
      el.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) hit = el;
    });
    if (!hit) return false;
    modeValue = id;
    if (sfModeName) sfModeName.textContent = MODE_LABEL[id] || id;
    if (sfModeDesc) sfModeDesc.textContent = MODE_DESC[id] || '';
    /* 游標預設跟著選中項，這樣再打開清單時是從目前那一項開始 */
    modeActive = id;
    syncModeActive();
    notifyStageText();
    return true;
  }

  /* 游標（.is-active）與 aria-activedescendant 只在清單開著時有意義：
     關著的時候把 aria-activedescendant 拿掉，免得輔助技術讀到一個看不見的游標。 */
  function syncModeActive() {
    if (!sfMode || !sfModeList) return;
    var active = modeActiveEl();
    modeOptionEls().forEach(function (el) {
      el.classList.toggle('is-active', el === active && modeMenuOpen);
    });
    if (modeMenuOpen && active) sfMode.setAttribute('aria-activedescendant', active.id);
    else sfMode.removeAttribute('aria-activedescendant');
  }

  function setModeActive(id) {
    /* 沒變就什麼都不做：這一支會被 pointermove 每個像素叫一次，
       而標記本來就已經在對的那一列上（開啟時 openModeMenu 已經同步過），
       不必每次重掃 14 列（js/AGENTS.md 對指標熱路徑的規定）。 */
    if (!id || id === modeActive) return;
    modeActive = id;
    syncModeActive();
    scrollModeActiveIntoView();
  }

  /* 讓游標那一列留在清單的可視範圍內。手算而不是 scrollIntoView()：
     舞台上任何一次「順便捲動祖先」都會把整頁推走，這裡只該動清單自己的 scrollTop。
     清單是絕對定位元素，所以 offsetTop 相對的正是清單的 padding box。 */
  function scrollModeActiveIntoView() {
    if (!sfModeList || sfModeList.scrollHeight <= sfModeList.clientHeight) return;
    var el = modeActiveEl();
    if (!el) return;
    var top = el.offsetTop;
    var bottom = top + el.offsetHeight;
    if (top < sfModeList.scrollTop) sfModeList.scrollTop = top;
    else if (bottom > sfModeList.scrollTop + sfModeList.clientHeight) {
      sfModeList.scrollTop = bottom - sfModeList.clientHeight;
    }
  }

  /** 依可用模式建立清單；名稱與一句效果都寫在每一列（收合後按鈕顯示選中那一列）。
      傳進來的 ids 是舞台的完整清單，這裡先濾掉 MODE_HIDDEN：**選單與選值都不得出現**。 */
  function fillModeMenu(ids) {
    if (!sfMode || !sfModeList) return;
    sfModeList.textContent = '';
    (ids || []).forEach(function (id) {
      if (MODE_HIDDEN[id]) return;
      var li = document.createElement('li');
      li.className = 'sf-menu-item';
      li.id = 'sfModeOpt-' + id;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset.value = id;
      var name = document.createElement('span');
      name.className = 'sf-opt-name';
      name.textContent = MODE_LABEL[id] || id;
      var desc = document.createElement('span');
      desc.className = 'sf-opt-desc';
      desc.textContent = MODE_DESC[id] || '';
      li.appendChild(name);
      li.appendChild(desc);
      sfModeList.appendChild(li);
    });
    modeValue = null;
    modeActive = null;
    closeModeMenu(true);
  }

  function openModeMenu() {
    if (!sfMode || !sfModeList || modeMenuOpen || !sfModeList.children.length) return;
    modeMenuOpen = true;
    if (modeCloseTimer) {
      clearTimeout(modeCloseTimer);
      modeCloseTimer = 0;
    }
    sfModeList.hidden = false;
    sfMode.setAttribute('aria-expanded', 'true');
    /* 先讓它以一開始那個透明＋下移 6px 的狀態畫過一幀，再加 .is-open 觸發過渡：
       同一個 frame 內完成這兩步，瀏覽器沒有機會算起始樣式，動畫就不會跑
       （見 .agents/notes 的兩次 rAF 記錄）。 */
    requestAnimationFrame(function () {
      if (!modeMenuOpen) return;
      requestAnimationFrame(function () {
        if (modeMenuOpen) sfModeList.classList.add('is-open');
      });
    });
    /* 打開時游標停在目前選中的那一項（沒有就從第一項） */
    if (!modeActive) modeActive = modeValueOf(sfModeList.firstElementChild);
    syncModeActive();
    scrollModeActiveIntoView();
  }

  /* 收清單。immediate=true 是「立刻收乾淨」（換歌、關舞台、重新填充清單），
     否則等 140ms 的淡出跑完再設 hidden——但一定有逾時保底，
     免得 transitionend 沒來（或元素已被移除）時清單永遠收不掉。 */
  function closeModeMenu(immediate) {
    if (!sfMode || !sfModeList) return;
    modeMenuOpen = false;
    sfMode.setAttribute('aria-expanded', 'false');
    sfMode.removeAttribute('aria-activedescendant');
    sfModeList.classList.remove('is-open');
    modeOptionEls().forEach(function (el) {
      el.classList.remove('is-active');
    });
    if (modeCloseTimer) {
      clearTimeout(modeCloseTimer);
      modeCloseTimer = 0;
    }
    if (immediate) {
      sfModeList.hidden = true;
      modeActive = modeValue;
      return;
    }
    modeCloseTimer = setTimeout(function () {
      modeCloseTimer = 0;
      if (!modeMenuOpen) {
        sfModeList.hidden = true;
        modeActive = modeValue;
      }
    }, 220);
  }

  /** 使用者選定一個模式：更新顯示、收起清單，並派送 change 給既有那支處理。 */
  function chooseMode(id) {
    if (!id) return;
    var changed = id !== modeValue;
    if (!setModeValue(id)) return;
    closeModeMenu();
    if (sfMode && sfMode.focus) sfMode.focus({ preventScroll: true });
    /* 走同一個 change 事件，綁在 #sfMode 上的既有處理（鎖定模式、寫狀態列）
       完全不必改——原生 select 也是這樣回報的。 */
    if (changed) sfMode.dispatchEvent(new Event('change'));
  }

  /* 上下移動游標。走到頭尾繞回另一端（原生 select 不繞，但繞回來對 14 項的
     清單更好按；鍵盤結果一樣可預期）。 */
  function stepMode(from, delta) {
    var ids = modeOptionEls().map(modeValueOf);
    if (!ids.length) return null;
    var i = ids.indexOf(from);
    if (i < 0) i = delta > 0 ? -1 : ids.length;
    return ids[(i + delta + ids.length) % ids.length];
  }

  /* 首字快選（原生 select 有，換成自繪控件不該弄丟）：
     連續按鍵在 700ms 內累積成前綴，往後找第一個符合的選項。 */
  var modeTypeBuffer = '';
  var modeTypeAt = 0;
  function modeTypeahead(ch) {
    var now = Date.now();
    if (now - modeTypeAt > 700) modeTypeBuffer = '';
    modeTypeAt = now;
    modeTypeBuffer += ch;
    var ids = modeOptionEls().map(modeValueOf);
    var from = ids.indexOf(modeActive);
    for (var k = 1; k <= ids.length; k++) {
      var id = ids[(from + k + ids.length) % ids.length];
      var label = MODE_LABEL[id] || id;
      if (label.indexOf(modeTypeBuffer) === 0) {
        setModeActive(id);
        return;
      }
    }
  }

  function modeKeydown(e) {
    var key = e.key;
    if (!modeMenuOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        e.preventDefault();
        openModeMenu();
        /* ↑ 從目前選中的前一項開始，↓ 從目前那一項開始（與原生 select 一致） */
        if (key === 'ArrowUp') setModeActive(stepMode(modeActive, -1));
        return;
      }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      e.preventDefault();
      setModeActive(stepMode(modeActive, key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (key === 'Home' || key === 'End') {
      e.preventDefault();
      var els = modeOptionEls();
      var target = key === 'Home' ? els[0] : els[els.length - 1];
      setModeActive(modeValueOf(target));
      return;
    }
    if (key === 'Enter' || key === ' ') {
      /* 這裡要 preventDefault：按鈕預設會把 Enter／Space 轉成 click，
         不擋掉就會變成「選取後又切換一次」。 */
      e.preventDefault();
      if (modeActive && modeActive !== modeValue) chooseMode(modeActive);
      else closeModeMenu();
      return;
    }
    if (key === 'Escape') {
      /* 真正關閉舞台的那一道在 document 的捕獲階段（而且先跑），
         它會看到 modeMenuOpen 而只收清單；這裡只是保險。 */
      e.preventDefault();
      closeModeMenu();
      return;
    }
    if (key === 'Tab') return; /* 交給舞台的焦點圍籬；清單由圍籬那邊一起收掉 */
    if (key && key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      modeTypeahead(key);
    }
  }

  /* 模式選單的事件。監聽器掛在按鈕與清單上；Esc／Tab 的「先後順序」見舞台那一支
     document 監聽（它會先看到這兩個鍵）。 */
  function bindModeMenu() {
    if (!sfMode) return;
    sfMode.addEventListener('click', function () {
      if (modeMenuOpen) closeModeMenu();
      else openModeMenu();
    });
    sfMode.addEventListener('keydown', modeKeydown);
    if (sfModeList) {
      sfModeList.addEventListener('click', function (e) {
        var li = e.target && e.target.closest ? e.target.closest('.sf-menu-item') : null;
        if (!li || !sfModeList.contains(li)) return;
        chooseMode(modeValueOf(li));
      });
      /* 指標移到哪一列，游標就跟到哪一列：這樣 hover 與鍵盤共用同一個高亮，
         不會同時亮兩列。 */
      sfModeList.addEventListener('pointermove', function (e) {
        var li = e.target && e.target.closest ? e.target.closest('.sf-menu-item') : null;
        if (li) setModeActive(modeValueOf(li));
      });
    }
    /* 點到清單與按鈕以外的任何地方就收起來（捕獲階段，先於其他 click 處理）。 */
    document.addEventListener(
      'pointerdown',
      function (e) {
        if (!modeMenuOpen) return;
        var dd = document.getElementById('sfModeDd');
        if (dd && e.target && dd.contains(e.target)) return;
        closeModeMenu();
      },
      true
    );
  }

  /* 告訴站點「舞台剛寫了可見文案」：站點的語言層（js/app.js 的 localize()）只認
     繁體原文，而這裡的字串是執行期寫進 DOM 的，走不到站點切換語言時那一次
     document 級掃描。所以每次寫完就派一次事件，由站點對 #stageFull 補一次轉換
     （監聽在 js/app.js 的 initAudio，事件名與 jc-stage-change 同一家族）。
     這裡不自己轉簡體：localize() 把第一次看到的字串記成快取原文，
     先轉會讓那份原文變成簡體，之後切回繁體就回不去了。 */
  function notifyStageText() {
    try {
      window.dispatchEvent(new Event('jc-stage-text'));
    } catch {
      /* 不支援事件時只影響文案繁簡的時效，畫面本身照常 */
    }
  }

  /* ── 掛載 ───────────────────────────────────────────────────────────── */
  /* 競態守衛（換歌比掛載快時會踩到）：
     1. 每次掛載用**新的宿主**，並先等上一首的根卸乾淨——上游 handle.dispose()
        是非同步的，不等它就掛新根會撞上「同一個宿主被 createRoot 兩次」的老問題
        （React 沿用舊根，畫面停在上一首）。新宿主也讓遲到的舊掛載只拆得掉自己那層。
     2. 掛完若 seq 已經不是現役（使用者又換歌了），只拆自己剛鋪好的那一層，
        絕不碰 handle／bridge／openSeq，也不呼叫 teardown()。 */
  function mountStage(mod, song, lines, theme, segments, seq) {
    var prevDispose = disposeStage();
    var shadow = ensureShadow();
    if (!shadow) return Promise.reject(new Error('no-shadow-root'));
    var mountHost = document.createElement('div');
    mountHost.className = 'stage-full-root';
    shadow.appendChild(mountHost);
    stageHost = mountHost;
    var myBridge = null;
    var myAnalyser = null;

    /* 這一輪已被後開的一首取代：只收自己剛鋪好的東西，不動全域狀態。
       （舊版在過期分支呼叫全域 teardown()，會關掉新舞台、清掉新歌的 handle
       與 bridge，還會 openSeq++ 讓新歌的守衛全部失效。） */
    function dropStale() {
      if (stageHost === mountHost) stageHost = null;
      if (mountHost.parentNode) mountHost.parentNode.removeChild(mountHost);
      if (bridge === myBridge) bridge = null;
      if (analyser === myAnalyser) analyser = null;
      try {
        if (myBridge && typeof myBridge.dispose === 'function') myBridge.dispose();
      } catch {
        /* 收不掉不影響新歌 */
      }
      return null;
    }

    var audioEl = document.getElementById('plAudio');
    myBridge = bridge = mod.createAudioBridge(audioEl, {
      onSeek: function (sec) {
        /* 拖動由站點驅動：走站點自己的 scrub 結束路徑（js/app.js），不在這裡直接寫 currentTime */
        var range = document.getElementById('plRange');
        if (range) {
          range.value = sec;
          range.dispatchEvent(new Event('input', { bubbles: true }));
          range.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    /* 頻譜分析器：一個元素只能接一次（模組內用 WeakMap 記住了），失敗就走上游的 idle 呼吸 */
    myAnalyser = analyser = mod.attachAnalyser(audioEl) || null;
    if (myAnalyser && myAnalyser.context && myAnalyser.context.state === 'suspended') {
      myAnalyser.context.resume().catch(function () {});
    }

    var audio = {
      getTime: myBridge.getTime,
      isPaused: myBridge.isPaused,
      getDuration: myBridge.getDuration,
      subscribe: myBridge.subscribe,
      seek: myBridge.seek,
      getAnalyser: function () {
        return myAnalyser ? myAnalyser.analyser : null;
      }
    };

    var payload = {
      mode: theme && theme.mode ? theme.mode : null,
      theme: theme,
      lines: lines,
      segments: segments || null,
      coverUrl: song.cover || null,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year
      },
      audio: audio,
      reducedMotion: REDUCED.matches,
      background: theme && theme.background ? { mode: theme.background } : undefined,
      /* 舞台在每次狀態變化時回報快照；控制列的 aria-pressed 與選單都由它驅動，
         站點不自己猜「現在是不是自動」。 */
      onState: function (state) {
        if (seq !== openSeq) return;
        syncFromState(state);
      }
    };

    /* 先等上一首卸乾淨（prevDispose 是非同步的），再掛新的——但最多等
       UNMOUNT_WAIT_MS（見 waitForUnmount：上游卡住時不能把新一輪也拖住）；
       掛完若已經不是現役，只拆自己那一層。 */
    return waitForUnmount(prevDispose, UNMOUNT_WAIT_MS)
      .then(function () {
        /* 已經換歌：連掛都不必掛，免得白鋪一層再拆 */
        if (seq !== openSeq) return null;
        return mod.mount(mountHost, payload);
      })
      .then(function (h) {
        if (!h) return dropStale();
        if (seq !== openSeq) {
          /* 掛好的這一層已經不是現役：只拆自己這一層（handle 屬於這一輪，
             bridge／analyser 也是這一輪建的），別碰 handle 以外的全域狀態。
             而且**要等它卸完**：上游的 dispose() 是非同步的，它在 await unmount()
             之後還會 delete <html data-reduce-motion> 這類共享狀態——不等它，
             刪除就會落在新實例的 mount 之後，把新實例的值清掉。 */
          return Promise.resolve()
            .then(function () {
              return typeof h.dispose === 'function' ? h.dispose() : null;
            })
            .catch(function () {
              /* 卸載失敗不影響新歌 */
            })
            .then(function () {
              dropStale();
              syncReduceMotion();
              return null;
            });
        }
        handle = h;
        var ids = h.modeIds || [];
        var bgs = h.backgroundIds || [];
        var defaultMode = typeof mod.getDefaultMode === 'function' ? mod.getDefaultMode() : null;
        /* 選單要反映**實際在跑的那個模式**：payload.mode 為 null 時舞台會用上游預設值，
           而選單的第一個選項不一定是它（實測選單顯示 cadenza、舞台跑 classic）。
           舞台若因能力替換了模式（無 WebGL 的 diorama／lumiere），以舞台回報的為準。 */
        var reported = h.getState ? h.getState() : null;
        lastStageState = reported;
        activeMode =
          (reported && reported.mode) ||
          (payload.mode && ids.indexOf(payload.mode) !== -1 ? payload.mode : defaultMode);
        /* 舞台回報的模式若是不提供的那一個（例如 auto 選到 still，或舊偏好／外部注入），
           掛載時就回退到站點預設模式，而且只做一次：選單、按鈕、data-stage-mode 三者
           必須一致，也不能在這裡進入「回報 → 回退 → 又回報」的迴圈。
           lock:false 是刻意的——這是替 auto 收拾，不是替使用者鎖定。 */
        if (MODE_HIDDEN[activeMode]) {
          activeMode = DEFAULT_MODE;
          try {
            h.setMode(DEFAULT_MODE, { lock: false });
          } catch {
            /* 換模式失敗不影響舞台已成立的畫面：下面 syncFromState 會再校正 */
          }
        }
        fillModeMenu(ids);
        fillSelect(sfBg, bgs, BG_LABEL);
        fillThemeSelect();
        if (activeMode && ids.indexOf(activeMode) !== -1 && !MODE_HIDDEN[activeMode])
          setModeValue(activeMode);
        /* 清單與三個 <select> 的選項都在上面填好了：請站點把這一整批新節點
           一次轉成目前語言（setModeValue 命中時也會派，這裡補沒命中的情況）。 */
        notifyStageText();
        sfBg.value =
          (reported && reported.background) ||
          (payload.background && payload.background.mode) ||
          sfBg.value;
        if (sfAuto)
          sfAuto.setAttribute(
            'aria-pressed',
            reported && reported.auto === false ? 'false' : 'true'
          );
        return h;
      });
  }

  /* 主題選單：五個人工預設＋「跟隨歌曲」。
     選項來自 js/stage-themes.js；那支腳本沒載入時**不填選單也不報錯**，
     舞台仍走內建封面取色，不會出現空白背景。 */
  function fillThemeSelect() {
    if (!sfTheme) return;
    var t = themes();
    var options = t && typeof t.presetOptions === 'function' ? t.presetOptions() : [];
    sfTheme.innerHTML = '';
    for (var i = 0; i < options.length; i++) {
      var opt = document.createElement('option');
      opt.value = options[i].id;
      /* 「跟隨歌曲」把這首歌實際會用的預設名寫進標籤：
         否則選單只顯示「跟隨歌曲」，看不出它其實等於「懷舊」，
         使用者要對照狀態列才知道當下是什麼。 */
      if (!options[i].id && lastLocalTheme && lastLocalTheme.presetId) {
        var autoLabel = presetLabel(lastLocalTheme.presetId) || lastLocalTheme.presetId;
        opt.textContent = '跟隨歌曲（' + autoLabel + '）';
      } else {
        opt.textContent = options[i].label;
      }
      sfTheme.appendChild(opt);
    }
    /* 目前的自動主題若是人工預設，選單就停在「跟隨歌曲」——
       它反映的是「由誰決定」，而不是「正好等於哪個顏色」：
       顏色會被段落覆寫，決定權仍然在歌曲手上。 */
    sfTheme.value = '';
  }

  /* 主題來源的一句話。四條路徑必須分得開，不能都寫成「AI」：
       · 人工預設   → 由人挑的風格主題（js/stage-themes.js 的 PRESETS／SONG_PRESETS）
       · 本地規則   → 由專輯封面主色派生的確定性色彩運算（source 'cover'）
       · 真實 AI    → provider 真的跑了模型（source 'ai'，命中快取時被改寫成 'cache'）
       · 測試替身   → model 為 'test-double'（THEME_PROVIDER=stub），不是真實模型結果；
                      這種輸出也會進快取，所以**快取命中也要一起驗 model**，
                      否則替身結果會被當成真實 AI（正是要避免的誤認） */
  function themeLine(theme) {
    /* 來源以**舞台回報的狀態**為準，不只看主題物件自己的 provenance：
       provenance 說的是「這組顏色從哪來」（preset／cover），
       state.themeSource 說的才是「誰決定的」（manual／segment／ai…）。
       只看 provenance 會把手動選的主題報成單純的人工預設，看不出它已鎖定。 */
    var stateSrc = lastStageState && lastStageState.themeSource;
    var source = stateSrc || (theme && theme.provenance && theme.provenance.source) || 'cover';
    /* 預設 id 的來源有先後：手動或 AI 進來時，主題物件自己帶著 preset，
       以它為準；只有在來源是**歌曲自己的自動選擇**（preset／segment）時，
       才退回「這首歌的本地預設」——那條退路是為了救 onState 比
       setStatusSource 早到、statusTheme 還是 null 的情況。
       隨意退回會出現「手動選了憂傷、摘要卻寫懷舊」這種自我矛盾（實測踩過）。 */
    var ownPreset = theme && theme.provenance && theme.provenance.preset;
    var presetId =
      ownPreset ||
      (source === 'manual' || source === 'ai' || source === 'cache'
        ? null
        : (lastLocalTheme && lastLocalTheme.presetId) || null);
    var meta = currentAiMeta();
    var model = (meta && meta.model) || (theme && theme.model) || null;
    var status = meta && meta.status;
    var isDouble = !!(meta && meta.testDouble) || model === 'test-double';
    var fromModel =
      source === 'ai' || source === 'cache' || status === 'generated' || status === 'cache-hit';
    if (source === 'segment') return '主題：段落覆寫（人工預設）';
    if (source === 'manual') {
      var manLabel = presetId ? presetLabel(presetId) || presetId : null;
      return '主題：手動選擇' + (manLabel ? '（' + manLabel + '）' : '') + '，已鎖定';
    }
    if (fromModel) {
      var suffix = source === 'cache' ? ' · 快取命中' : '';
      if (isDouble) return '主題：測試替身（非真實 AI）' + suffix;
      return '主題：真實 AI（' + ((theme && theme.mood) || '未命名') + '）' + suffix;
    }
    if (source === 'preset' || presetId) {
      var label = presetId ? presetLabel(presetId) || presetId : (theme && theme.mood) || null;
      return '主題：人工預設（' + (label || '未指定') + '）';
    }
    /* 本地規則：講清楚是封面取色算出來的，不是 AI 也不是情緒辨識 */
    return '主題：本地規則（封面派生）';
  }

  /* WebGL 降級：舞台把原因寫在 data-stage-degraded，站點翻成人看得懂的一句。
     `no-webgl-mode-fallback:<mode>` 是「模式被換掉」，比背景替換更需要講出來，
     因為使用者明明選了 diorama／lumiere 卻跑 classic。 */
  function degradedLine(state) {
    var raw = (state && state.degraded) || [];
    var modeFallback = null;
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].indexOf('no-webgl-mode-fallback:') === 0) {
        modeFallback = raw[i].slice('no-webgl-mode-fallback:'.length);
      }
    }
    if (modeFallback) {
      return (
        '這台裝置沒有 WebGL，「' + (MODE_LABEL[modeFallback] || modeFallback) + '」已改用經典模式'
      );
    }
    if (raw.indexOf('no-webgl') !== -1) return '這台裝置沒有 WebGL，已收斂到 2D 呈現';
    if (raw.indexOf('renderer-error') !== -1) return '上一個模式渲染失敗，已換手';
    return null;
  }

  /* 站點側狀態列：主題來源（四條路徑分開講）、段落驅動了什麼、鎖定了什麼、逐字是不是估算。
     段落驅動的項目**照實列**：sidecar 本身沒有 mode／theme／background
     （provenance.modelJudgment 為 false，不含模型的情緒判斷），
     本輪為三首代表歌曲補的是**逐段人工預設**，其餘歌曲只有能量驅動的動效強度。 */
  function describe(theme, segments, degraded) {
    /* 使用者介面只留「會影響他看到什麼」的話：降級原因與渲染失敗。
       主題來源、段落數、實際主色都屬內部狀態，已移到 data-status-detail（不顯示）；
       它們仍然算得出來、排查時讀得到，只是不再擠進控制列下方那一行。
       參數保留原樣（theme／segments）：呼叫端與 statusDetail 都還依賴這條路徑，
       刪參數會連帶動到不該動的業務邏輯。 */
    var parts = [];
    if (degraded) parts.push(degraded);
    return parts.join(' · ');
  }

  /* 診斷細節：不進可見文案，改寫進 #sfStatus 的 data-status-detail，
     排查時仍讀得到（鎖定項目、段落驅動哪些東西、信心值、逐字精度、AI 來源）。 */
  function statusDetail() {
    var parts = [];
    /* 主題來源的判定仍然要算：themeLine 是唯一分得清
       manual／segment／ai／cache／preset／cover 六條路徑的地方。
       它不再進可見文案（使用者不需要看「手動選擇，已鎖定」这种内部状态），
       但排查要讀得到，所以改由 data-status-detail 承載。 */
    try {
      parts.push('theme=' + themeLine(statusTheme));
    } catch {
      /* 診斷字串壞掉不影響任何可見輸出 */
    }
    var locks = (lastStageState && lastStageState.locks) || null;
    /* 目前生效的動效強度：可見文案不再寫它，但排查要知道「現在是哪一檔」，
       否則「三檔到底有沒有生效」只能靠肉眼看動畫。 */
    if (lastStageState && lastStageState.intensity) {
      parts.push(
        'intensity=' +
          lastStageState.intensity +
          '(' +
          (INTENSITY_LABEL[lastStageState.intensity] || '') +
          ')'
      );
    }
    if (locks && (locks.mode || locks.theme || locks.intensity)) {
      var held = [];
      if (locks.mode) held.push('模式');
      if (locks.theme) held.push('主題');
      if (locks.intensity) held.push('強度');
      parts.push('locks=' + held.join('/'));
    }
    if (statusSegments && statusSegments.length) {
      var driven = [];
      var hasMode = false,
        hasTheme = false,
        hasBg = false;
      for (var i = 0; i < statusSegments.length; i++) {
        if (statusSegments[i].mode) hasMode = true;
        if (statusSegments[i].background) hasBg = true;
        if (statusSegments[i].theme && Object.keys(statusSegments[i].theme).length) hasTheme = true;
      }
      if (hasMode) driven.push('模式');
      if (hasBg) driven.push('背景');
      if (hasTheme) driven.push('主題');
      driven.push('動效強度');
      parts.push('segments=' + statusSegments.length + '(' + driven.join('/') + ')');
    }
    if (statusTheme && statusTheme.confidence != null) {
      parts.push('confidence=' + Math.round(statusTheme.confidence * 100) + '%');
    }
    var src = (lastStageState && lastStageState.themeSource) || null;
    if (src) parts.push('source=' + src);
    var aiMeta = currentAiMeta();
    if (aiMeta && aiMeta.status) {
      parts.push('ai=' + aiMeta.status + (aiMeta.testDouble ? '(test-double)' : ''));
    }
    parts.push('word-timing=estimated');
    return parts.join(' ');
  }

  /* ── 站點頭部與舞台自身的重複標題 ──────────────────────────────────────
     `#sfTitle`／`#sfMeta` 是站點畫在舞台上方覆蓋層（`.sf-bar`，absolute，
     不佔布局流）裡的歌名與「歌手 · 專輯 · 年份」。它與舞台內容同處 0 起，
     所以舞台若在左上角也畫標題，兩者會疊在同一高度上（實測 1440×901：
     站點歌名 45–90、meta 94–115，monet 左列歌手名 74–113，重疊 170×16 與 170×19）。
     monet 自己在左列就畫了「歌手／歌名／專輯」三件套，站點那兩行是**重複資訊**，
     所以只在 monet 時把站點那兩行收起來；其餘 12 個模式不畫標題，站點那兩行
     是唯一來源，一律保留。`LYRIC STAGE` 小標與關閉鍵任何模式都保留。
     判定用「舞台實際生效的模式」而不是選單值：無 WebGL 時 monet 會被換成 classic，
     那時站點標題要回來（classic 自己不畫標題）。 */
  var DUP_TITLE_MODES = { monet: 1 };
  function syncDuplicatedTitle(mode) {
    if (!stageEl) return;
    stageEl.classList.toggle('is-title-duplicated', !!DUP_TITLE_MODES[mode]);
  }

  /* 把舞台回報的狀態同步到控制列。aria-pressed 雙向同步的唯一入口：
     手動選模式／調強度 → 舞台回報 auto=false；按恢復自動 → 回報 auto=true。 */
  function syncFromState(state) {
    if (!nodes() || !state) return;
    lastStageState = state;
    if (sfAuto) sfAuto.setAttribute('aria-pressed', state.auto ? 'true' : 'false');
    if (sfMode && state.mode) {
      if (MODE_HIDDEN[state.mode] && handle) {
        /* 遲到的回報仍指向不提供的模式（最可能是 auto 自己選到 still）。
           只回退一次、不鎖定，而且**先記下目標**再送命令：
           否則狀態列／按鈕會停在一個選單裡不存在的值，與舞台不一致。
           已回退過就只更新 activeMode，不再重複下命令（避免回報↔回退互踢）。 */
        activeMode = DEFAULT_MODE;
        /* 按鈕與 aria-selected 也要立刻切到回退後的那一項：這裡**不能早退**，
           否則後面的背景／強度／降級同步整段跳過，界面會停在舊值。
           回退分支只多做一件事（把選單值改成 DEFAULT_MODE），流程照樣往下走。 */
        setModeValue(DEFAULT_MODE);
        if (modeFallbackSent !== state.mode) {
          modeFallbackSent = state.mode;
          try {
            handle.setMode(DEFAULT_MODE, { lock: false });
          } catch {
            /* 回退失敗不影響畫面：舞台仍以自己的模式跑，這裡只是不顯示它 */
          }
        }
      } else {
        /* setModeValue 內部已經處理「游標與 aria-selected」，也會一併更新說明文字 */
        setModeValue(state.mode);
        activeMode = state.mode;
        modeFallbackSent = '';
      }
    }
    syncDuplicatedTitle(state.mode || activeMode);
    if (sfBg && state.background) sfBg.value = state.background;
    if (sfIntensity && state.intensity) sfIntensity.value = state.intensity;
    var deg = degradedLine(state);
    if (deg) {
      stageEl.setAttribute('data-stage-degraded-text', deg);
    } else {
      stageEl.removeAttribute('data-stage-degraded-text');
    }
    /* 狀態變了就把摘要重算一次——「狀態列永遠說實話」的關鍵一步。
       沒有這一步，摘要會停在掛載瞬間的值：實測第二天堂第 0 段套的是憂傷
       #6f8bb5，狀態列卻還寫著歌曲級的激昂 #e05c4a。 */
    refreshSummary();
  }

  /* ── 開 / 關 ────────────────────────────────────────────────────────── */
  /* 通知站點：全屏詞舞台的開／關狀態變了（js/app.js 用它同步播放列的歌詞鈕）。
     舞台自己也會關（關閉鈕、Esc、換到沒有本機歌詞的一首），少了這個訊號，
     站點只在使用者再點一次那顆按鈕時才會發現狀態已經變了：
     實測關掉舞台後 #plLyrics 的 aria-pressed／aria-expanded 仍停在 true。 */
  function announce() {
    try {
      window.dispatchEvent(new Event('jc-stage-change'));
    } catch {
      /* 不支援事件時只影響按鈕狀態的即時性，不影響舞台本身 */
    }
  }

  /* ── 焦點圍籬與背景隔離 ────────────────────────────────────────────────
     舞台是 aria-modal 的全屏對話框，所以：
       · 焦點要在舞台內循環（Tab 與 Shift+Tab 都要繞回來）；
       · 舞台**後面**的頁面內容要 inert，否則鍵盤會走進看不見的播放列與曲目列。
     被隔離的是 #stageFull 的兄弟節點，不是它的祖先：對祖先（body）下 inert
     會把舞台自己一起鎖住。 */
  var INERT_SELECTORS = ['main', '#sheet', '#sarch', '#msb', '.topbar', '#chapters', '#lyricStage'];
  var inertedNodes = [];

  function isolateBackground() {
    releaseBackground(); /* 先清一次，重複開啟不會疊加 */
    for (var i = 0; i < INERT_SELECTORS.length; i++) {
      var node = document.querySelector(INERT_SELECTORS[i]);
      if (!node || node.hasAttribute('inert') || stageEl.contains(node)) continue;
      node.setAttribute('inert', '');
      inertedNodes.push(node);
    }
  }

  /* 只還原「自己設過的」那幾個：不要清掉別人（或其他模組）設定的 inert */
  function releaseBackground() {
    for (var i = 0; i < inertedNodes.length; i++) inertedNodes[i].removeAttribute('inert');
    inertedNodes = [];
  }

  function stageFocusables() {
    var sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var list = stageEl.querySelectorAll(sel);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      /* 用 getClientRects 判可見，不用 offsetParent：舞台是 fixed 定位，
         而 fixed 子元素的 offsetParent 會是 null，會被誤判成隱藏 */
      if (n.disabled || !n.getClientRects().length) continue;
      out.push(n);
    }
    return out;
  }

  /* 焦點在不在舞台裡：也要看 shadow root 內（渲染器的活動焦點住在那裡） */
  function focusInsideStage() {
    var active = document.activeElement;
    if (active && stageEl.contains(active)) return true;
    var host = document.getElementById('sfHost');
    return !!(host && host.shadowRoot && host.shadowRoot.activeElement);
  }

  function trapStageFocus(e) {
    var items = stageFocusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (!focusInsideStage()) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus({ preventScroll: true });
      return;
    }
    var active = document.activeElement;
    if (e.shiftKey && (active === first || active === stageEl)) {
      e.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  /* 焦點還給觸發元素：元素必須還在文件裡、而且不在（仍被隔離的）inert 子樹中，
     否則焦點會掉回 body。真的無處可還時退回播放列的歌词入口。 */
  function restoreFocus() {
    var target = lastFocus;
    if (target && target.focus && document.contains(target) && !target.closest('[inert]')) {
      target.focus({ preventScroll: true });
      return;
    }
    var fallback = document.getElementById('plLyrics');
    if (fallback) fallback.focus({ preventScroll: true });
  }

  function showShell(song) {
    if (!nodes()) return;
    /* 只有「從關到開」才記錄來源焦點：換歌時舞台一直開著，
       記到舞台內部的 <select> 會讓關閉後焦點回不去（實測掉回 body）。 */
    if (!isOpen()) lastFocus = document.activeElement;
    sfTitle.textContent = song.title;
    sfMeta.textContent = song.artist + ' · ' + song.album + ' · ' + song.year;
    stageEl.hidden = false;
    document.documentElement.classList.add('has-stage');
    requestAnimationFrame(function () {
      stageEl.classList.add('is-open');
    });
    document.body.classList.add('is-locked');
    isolateBackground();
    announce();
    /* 先把焦點放進舞台（容器本身），第一次 Tab 到關閉鈕，
       不會一開場就停在 <select> 上被方向鍵誤改模式 */
    if (stageEl.focus) stageEl.focus({ preventScroll: true });
  }

  /* 上游把「減少動效」同步成 `document.documentElement.dataset.reduceMotion`，
     那是**共享**的 document 狀態（stage/dist 的 mount 設、dispose 在
     `await unmount()` 之後 delete）。兩個邊界都要顧：
       1. 舊實例的遲到卸載會 delete 掉新實例剛設好的值（新實例 mount 已跑過、
          不會再設一次，於是失去減少動效樣式）；
       2. 卸載本身失敗或卡住時，上游那行 delete 永遠不會執行，屬性會**殘留**在
          已經關閉的頁面上（實測：reduced motion 開著關掉舞台後
          `data-reduce-motion="uiMicroMotion"` 仍在）。
     所以這裡不是「補寫」而是**以現況為準的同步**：舞台開著且使用者要減少動效就設，
     其餘（舞台關著、或使用者沒有要減少動效）一律刪掉——上游成功卸載時也是刪掉，
     兩邊一致。這個屬性只有舞台自己的樣式在用（stage/src/stage.css 的
     `:root[data-reduce-motion~='uiMicroMotion']`），刪掉不影響站點其他部分。 */
  function syncReduceMotion() {
    var on = !!(stageEl && !stageEl.hidden && REDUCED.matches);
    try {
      if (on) document.documentElement.dataset.reduceMotion = 'uiMicroMotion';
      else delete document.documentElement.dataset.reduceMotion;
    } catch {
      /* 取不到 dataset 時只影響減少動效樣式，不影響舞台運作 */
    }
  }

  /* 等一個可能不會結束的 promise，但**不無限等**。
     上游 handle.dispose() 正常是幾十毫秒，但它是 `await unmount()`——實測把它延後
     8 秒，新一輪就 4 秒內都掛不上（畫面已開、根還沒建）；若它永不 settle，
     等待就等於永久鎖死（本模組沒有別的解鎖路徑）。
     為什麼逾時可以先掛：每次掛載用**自己的宿主**（stageHost），新根不會踩到舊根；
     真正需要「先卸再掛」的同宿主 createRoot 問題已由獨立宿主解掉，等待只是資源
     衛生的加分項，不該拿可用性去換。 */
  function waitForUnmount(p, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var finish = function () {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      Promise.resolve(p).then(finish, finish);
      setTimeout(finish, ms);
    });
  }

  /* 只收渲染層，不動外殼。換歌時要先用它把上一首的 React 根卸掉，
     否則第二首會對同一個宿主再 createRoot 一次（React 會沿用舊根，
     畫面停在前一首，而且舊的 rAF 與 WebGL 上下文不會被回收）。
     回傳一個 promise：上游 handle.dispose() 是非同步的，下一輪掛載要等它跑完
     （見 mountStage 的 prevDispose），不然「先卸再掛」其實沒有真的排隊。
     宿主是每次掛載新開的（stageHost），所以這裡只拆得掉自己那一層。 */
  function disposeStage() {
    var h = handle;
    var host = stageHost;
    var done = null;
    handle = null;
    stageHost = null;
    if (h && typeof h.dispose === 'function') {
      try {
        done = h.dispose();
      } catch {
        /* 卸載失敗不該擋住關閉 */
        done = null;
      }
    }
    if (bridge) {
      try {
        bridge.dispose();
      } catch {
        /* 同上 */
      }
      bridge = null;
    }
    /* 分析器與 AudioContext 由模組的 WeakMap 持有；這裡只斷開引用，
       真正的節點回收交給 page 生命週期（同一顆 <audio> 只能建一次 source）。 */
    analyser = null;
    /* 串在先前那次卸載之後，並且把這一輪的 promise 記進 pendingUnmount：
       關閉後立刻重開時，mountStage 拿到的就是「連上次都還沒跑完」的鏈，
       舊根的 unmount 一定排在新根之前（順序顛倒會撞上 React 沿用舊根）。 */
    pendingUnmount = pendingUnmount
      .catch(function () {})
      .then(function () {
        return done && typeof done.then === 'function' ? done : null;
      })
      .catch(function () {
        /* 非同步卸載失敗：仍然是「已經不歸這一輪管」，不往上拋 */
      })
      .then(function () {
        if (host && host.parentNode) host.parentNode.removeChild(host);
        syncReduceMotion();
      });
    return pendingUnmount;
  }

  function teardown() {
    disposeStage();
    /* 模式清單立刻收乾淨：舞台關掉之後不該留下一個展開中的清單或它的收尾計時器
       （計時器還在的話，下次開舞台會被上一次的殘留影響）。 */
    closeModeMenu(true);
    if (stageEl) {
      stageEl.classList.remove('is-open');
      stageEl.classList.remove('is-title-duplicated');
      stageEl.hidden = true;
    }
    document.documentElement.classList.remove('has-stage');
    /* 關閉時立刻同步一次共享的減少動效屬性：不能只靠 disposeStage() 的鏈尾——
       上游卸載若失敗或卡住，鏈尾永遠不會跑到，屬性就會殘留在已關閉的頁面上 */
    syncReduceMotion();
    /* 捲動鎖要先問「舞台下面還疊著誰」：抽屜（#sheet）與歌曲檔案（#sarch）
       各自會上 body.is-locked，兩個都關了才輪到舞台解除。
       只問 #sheet 是不夠的——從歌曲檔案的「閱讀歌詞」進舞台再關掉舞台時，
       檔案還開著（aria-modal、z-index 1000）而頁面已經可以捲動（實測）。 */
    var sheetBelow = document.getElementById('sheet');
    var archiveBelow = document.getElementById('sarch');
    var stillCovered = (sheetBelow && !sheetBelow.hidden) || (archiveBelow && !archiveBelow.hidden);
    if (!stillCovered) document.body.classList.remove('is-locked');
    activeRef = null;
    activeSongId = null;
    openSeq++;
    /* 先恢復背景互動，再把焦點還回去：順序顛倒時，目標若在剛解除隔離的元素裡
       會因為當下仍是 inert 而收不到焦點 */
    releaseBackground();
    restoreFocus();
    announce();
  }

  function close() {
    if (!stageEl || stageEl.hidden) return;
    teardown();
  }

  function isOpen() {
    return !!stageEl && !stageEl.hidden;
  }

  /* 舞台能不能用：模組產物在不在。file:// 下 import 會被擋掉，這裡先問一次。 */
  var moduleProbe = null;
  function available() {
    if (moduleProbe) return moduleProbe;
    moduleProbe = fetch(stageUrl(MODULE_FILE), { method: 'HEAD' })
      .then(function (res) {
        return res.ok;
      })
      .catch(function () {
        return false;
      });
    return moduleProbe;
  }

  /* 退回基本舞台（js/lyrics.js）：完整舞台的產物取不到時，歌詞仍然讀得到。 */
  function fallback(hit, fail, why) {
    if (window.JCLyrics && typeof window.JCLyrics.openFor === 'function') {
      /* openFor() 會同步回報它到底有沒有受理。受理失敗（沒有歌詞檔、沒有音源、
         這個協定下讀不到）時不能宣稱「先用基本歌詞舞台」——實測那會讓使用者
         同時看到「先用基本舞台」與「歌詞載入失敗」兩句互相矛盾的話。 */
      var ok = window.JCLyrics.openFor(hit.album.title, hit.track, fail);
      fail(ok ? why + '，先用基本歌詞舞台' : why);
      return ok;
    }
    fail(why);
    return false;
  }

  /* 三條入口都走這裡：albumId + n 是穩定身份，跟目前瀏覽哪一位歌手無關。 */
  function open(albumId, n, onFail) {
    var fail = onFail || say;
    if (!nodes()) {
      if (onFail) onFail('歌詞舞台不在這一頁');
      return Promise.resolve(false);
    }
    var hit = lookup(albumId, n);
    if (!hit) {
      fail('找不到這一首');
      return Promise.resolve(false);
    }
    if (!hit.track.audio) {
      fail('這首沒有可用的音源');
      return Promise.resolve(false);
    }
    if (!hit.track.lyrics) {
      fail('這首沒有本機歌詞');
      return Promise.resolve(false);
    }
    var audioEl = document.getElementById('plAudio');
    if (!audioEl || !audioEl.src) {
      fail('先播放一首再開歌詞');
      return Promise.resolve(false);
    }

    var seq = ++openSeq;
    /* 上一首的主題服務結果不得洩漏到這一首的狀態列。meta 現在按歌曲 id 存
       （THEME_META），查詢端只讀 activeSongId 那一格，所以不必也不能在這裡清掉它：
       清掉會讓「同一首再開一次」的 AI／替身診斷消失。這裡只重設與畫面同步的快照。 */
    lastStageState = null;
    var song = {
      id: hit.album.id + '-' + hit.track.n,
      title: hit.track.zh,
      artist: hit.artist.name,
      album: hit.album.title,
      year: hit.album.year,
      cover: hit.album.cover
    };
    activeRef = { album: albumId, n: n };
    activeSongId = song.id;
    showShell(song);
    say('載入舞台…');

    return loadModule()
      .then(function (mod) {
        if (seq !== openSeq) return false;
        return loadCss().then(
          function () {
            return mod;
          },
          function () {
            say('舞台樣式載入失敗，版面可能不完整');
            return mod;
          }
        );
      })
      .then(function (mod) {
        if (seq !== openSeq) return false;
        return fetchLyrics(hit.track).then(function (got) {
          if (seq !== openSeq) return false;
          /* 自動主題走**本地解析**：有指派就用人工預設，沒指派就用封面派生的本地規則。
             兩條路都不需要網路、不需要服務、不需要密鑰，舞台因此永遠有背景與配色。 */
          var local = resolveLocalTheme(song, hit.album);
          /* 命名刻意不用 fallback：那是一個模組層函式（舞台掛不上時的降級入口），
             同名會遮蔽它，讓「舞台載入失敗」那條路徑靜默拿到一個物件而不是函式。 */
          var localTheme = local.theme;
          /* 先記下本地主題再掛載：mountStage 內部會呼叫 fillThemeSelect()，
             而那個選單的「跟隨歌曲（<預設名>）」標籤就讀這裡。 */
          lastLocalTheme = local;
          return mountStage(mod, song, got.lines, localTheme, null, seq).then(function () {
            if (seq !== openSeq || !handle) {
              /* 這一輪已經被後開的一首取代：舞台、handle、bridge 現在都屬於新歌。
                 這裡**不能**呼叫 teardown()——它會關掉新舞台、清掉新歌的 handle
                 與 bridge，還會 openSeq++ 讓新歌的守衛全部失效
                 （換歌比掛載快時就會踩到；mountStage 已經把自己那一層收乾淨了）。 */
              return false;
            }
            /* 歌曲預設可以指定推薦模式（Folia 模式 id）；實測過才用，認不得就略過。 */
            if (localTheme.mode && handle && handle.modeIds.indexOf(localTheme.mode) !== -1) {
              handle.setMode(localTheme.mode, { lock: false });
            }
            if (
              localTheme.background &&
              handle &&
              handle.backgroundIds.indexOf(localTheme.background) !== -1
            ) {
              handle.setBackground(localTheme.background);
            }
            lastLocalTheme = local;
            /* 先取一次舞台狀態再寫狀態列：摘要會讀 lastStageState 的實際主色，
               不先同步就會寫出上一首（或 null）的值。 */
            var early = handle && handle.getState ? handle.getState() : null;
            if (early) syncFromState(early);
            /* 摘要來源＝本地主題（AI 還沒回來，此刻畫面上就是它） */
            setStatusSource(localTheme, null);
            /* 再問兩件可選的事：AI 精修主題、段落。都失敗也不影響上面已經成立的畫面。 */
            return Promise.all([
              requestTheme(song, got.text, got.lines).catch(function () {
                return null;
              }),
              loadSegments(song.id).catch(function () {
                return null;
              })
            ]).then(function (out) {
              if (seq !== openSeq || !handle) return true;
              var theme = out[0];
              var rawSegments = out[1];
              /* 段落先補上逐段人工預設，再交給舞台。
                 沒有配置的歌只走安全預設：舞台端只讓能量驅動動效強度，
                 主題與背景保持不變，不偽造情緒。 */
              var segments = rawSegments ? augmentSegments(song.id, rawSegments) : null;
              if (segments) handle.applySegments(segments);
              /* AI 只有在**真的回了模型結果**時才覆蓋本地主題。
                 封面降級（source cover）、快取命中的替身、服務沒開，都維持本地主題——
                 這樣「沒有真實 AI」時畫面照常，也不會被誤認成 AI 分析成功。 */
              if (theme && isRealAiTheme(theme)) {
                /* 主題是「自動」的那一份：交給舞台記成原件，resumeAuto 才還原得回來。
                   套用後由舞台回報狀態，選單與 aria-pressed 都跟著它走，
                   站點不自己寫模式值（寫了會與實際在跑的模式脫節）。 */
                handle.applyTheme(theme, { source: 'ai' });
                if (theme.mode && handle.modeIds.indexOf(theme.mode) !== -1) {
                  handle.setMode(theme.mode, { lock: false });
                }
                if (theme.background && handle.backgroundIds.indexOf(theme.background) !== -1) {
                  handle.setBackground(theme.background);
                }
                if (theme.intensity) {
                  /* 自動強度不等於手動：用 lock:false，否則一開場就把強度鎖住，
                     使用者再也回不到「跟著段落走」。 */
                  handle.setIntensity(theme.intensity, { lock: false });
                  if (sfIntensity) sfIntensity.value = theme.intensity;
                }
              }
              var latest = handle.getState ? handle.getState() : null;
              if (latest) syncFromState(latest);
              /* 摘要來源換成「真正在畫面上的那一份」：真實 AI 有回來就是它，
                 否則仍是本地主題。段落一起記下，才能列出有幾段是人工預設。 */
              setStatusSource(currentThemeFor(theme, localTheme), segments);
              /* 舞台已經就緒、摘要也出來了，「載入舞台…」這則過場訊息就該退場；
                 留著會讓它永遠黏在狀態列最前面（實測就是這樣）。 */
              say('');
              return true;
            });
          });
        });
      })
      .then(function (ok) {
        if (!ok && seq === openSeq) {
          /* 取不到歌詞：收掉舞台並就地說明，不開一個空舞台 */
          teardown();
          if (!hit.track.lyrics) fail('這首沒有本機歌詞');
          else fallback(hit, fail, '完整舞台沒能掛上');
          return false;
        }
        return ok;
      })
      .catch(function (err) {
        if (seq === openSeq) {
          teardown();
          fallback(hit, fail, lyricFailText(err));
        }
        return false;
      });
  }

  /* ── 控制項 ─────────────────────────────────────────────────────────── */
  /* 舞台開著時歌曲被換掉（播放列的上一首／下一首、清單換歌、連續播放自動跳）：
     舞台必須跟著「真正在播的那一首」走，否則畫面會停在上一首的歌詞與主題
     （實測：切到〈星晴〉後標題仍是〈可愛女人〉）。沒有本機歌詞就收起舞台並說明，
     不會掛著上一首的歌詞假裝還在對應。 */
  function follow(albumId, n, onFail) {
    if (!isOpen()) return;
    var hit = lookup(albumId, n);
    if (!hit || !hit.track.lyrics) {
      close();
      if (onFail) onFail('這首沒有本機歌詞，已收起歌詞舞台');
      return;
    }
    open(albumId, n, onFail);
  }

  function bind() {
    if (!nodes()) return;
    bindModeMenu();
    if (sfClose) {
      sfClose.addEventListener('click', function () {
        close();
      });
    }
    if (sfMode) {
      /* 這支處理的觸發來源是自繪清單派送的 change（見 chooseMode），
         與原生 select 的 change 同一個語意：只在值真的變了才來。 */
      sfMode.addEventListener('change', function () {
        if (!handle) return;
        var wanted = currentMode();
        if (!wanted) return;
        /* 名稱與描述已由 chooseMode → setModeValue 就地寫上（含繁簡轉換的通知），
           不等非同步換手；若舞台因能力降級而換了模式，
           syncFromState 會把值與說明一起校正回來。 */
        /* 手動選模式＝鎖定：段落調度不得再換走它（Task 04 §8）。
           有沒有被能力替換，要**等換手完成後**問舞台的 modeFallback，
           不能拿 setMode 之前的 state.mode 去比——那個值是舊的，
           會把「正常切換」誤判成「沒有 WebGL 已降級」（實測就是這樣）。 */
        Promise.resolve(handle.setMode(wanted, { lock: true })).then(function () {
          var state = handle.getState ? handle.getState() : null;
          if (state) syncFromState(state);
          var fb = state && state.modeFallback;
          if (fb && fb.requested === wanted && fb.applied !== wanted) {
            say(
              '這台裝置沒有 WebGL，「' +
                (MODE_LABEL[wanted] || wanted) +
                '」已改用' +
                (MODE_LABEL[fb.applied] || fb.applied)
            );
          } else {
            /* 成功切模式不再寫「已鎖定模式：莫內」：下拉框與按鈕上顯示的名稱就是
               回饋，控制列只留「使用者需要知道才能行動」的話（降級、錯誤）。 */
          }
        });
      });
    }
    if (sfBg) {
      sfBg.addEventListener('change', function () {
        if (!handle) return;
        handle.setBackground(sfBg.value);
        var latest = handle.getState ? handle.getState() : null;
        var fellBack = latest && latest.background && latest.background !== sfBg.value;
        if (fellBack) {
          say(
            '這台裝置沒有 WebGL，「' +
              (BG_LABEL[sfBg.value] || sfBg.value) +
              '」已改用' +
              (BG_LABEL[latest.background] || latest.background)
          );
          sfBg.value = latest.background;
        }
        /* 成功換背景就不再寫一行「背景：莫內」：下拉框本身就是回饋，
           控制列下方只留错误与降級這類使用者真的需要读的话。 */
        if (latest) syncFromState(latest);
      });
    }
    if (sfTheme) {
      /* 手動選主題＝鎖定主題（與既有語意一致）：遲到的 AI 精修不得覆蓋。
         「跟隨歌曲」等於交還給本地自動主題——不必按恢復自動也能回到自動主題。 */
      sfTheme.addEventListener('change', function () {
        if (!handle) return;
        var id = sfTheme.value;
        if (!id) {
          /* 回到本地自動主題：不鎖，交還給歌曲自身 */
          if (lastLocalTheme && lastLocalTheme.theme) {
            handle.applyTheme(lastLocalTheme.theme, { source: 'local' });
            var lb = lastLocalTheme.theme.background;
            if (lb && handle.backgroundIds && handle.backgroundIds.indexOf(lb) !== -1) {
              handle.setBackground(lb);
            }
          }
          var s0 = handle.getState ? handle.getState() : null;
          if (s0) syncFromState(s0);
          /* 摘要來源換回本地自動主題，否則摘要會停在剛剛那個手動主題上
             （實測：切回「跟隨歌曲」後摘要仍寫「手動選擇（懷舊），已鎖定」）。 */
          if (lastLocalTheme) setStatusSource(lastLocalTheme.theme, statusSegments);
          say(
            '已交還給歌曲：主題跟隨本地' +
              (lastLocalTheme && lastLocalTheme.origin === 'preset' ? '人工預設' : '封面派生規則')
          );
          return;
        }
        var t = themes();
        var preset = t && t.presetById ? t.presetById(id) : null;
        if (!preset || !t.themeFromPreset) {
          say('這個主題尚未載入，維持目前設定');
          return;
        }
        var manualTheme = t.themeFromPreset(preset, activeSongId);
        handle.applyTheme(manualTheme, { source: 'manual' });
        if (preset.background && handle.backgroundIds.indexOf(preset.background) !== -1) {
          handle.setBackground(preset.background);
        }
        var latest = handle.getState ? handle.getState() : null;
        if (latest) syncFromState(latest);
        /* 摘要來源跟著換成手動的那一份主題：不同步的話摘要會繼續報歌曲預設的名字，
           於是同一行裡出現「訊息說憂傷、摘要說懷舊」的自我矛盾（實測踩過）。 */
        setStatusSource(manualTheme, statusSegments);
        /* 成功選主題也不寫確認語：下拉框顯示的就是目前值。
           要交還給自動的人需要知道「按恢復自動」，但那顆按鈕就在旁邊、本身有標籤，
           不必再用一行字重複講。 */
      });
    }
    if (sfIntensity) {
      sfIntensity.addEventListener('change', function () {
        if (!handle) return;
        /* 只改動效強度，**不動主題顏色、也不鎖主題**。
           舊版借用 applyTheme 的 manual 通道，會把主題一起鎖死：
           使用者調過一次強度之後，再按「恢復自動」也回不到 AI／封面主題。 */
        handle.setIntensity(sfIntensity.value, { lock: true });
        /* 同樣不寫確認語：強度下拉框本身就是回饋。
           （「已鎖定強度、按恢復自動交還」屬操作說明，不是狀態；
           按鈕標籤已寫「恢復自動」，重複講只會讓控制列變吵。） */
        var latest = handle.getState ? handle.getState() : null;
        if (latest) syncFromState(latest);
      });
    }
    if (sfAuto) {
      sfAuto.addEventListener('click', function () {
        if (!handle || typeof handle.resumeAuto !== 'function') return;
        /* 恢復自動：走舞台真正的解鎖入口——清三把鎖、還原自動主題與推薦模式、
           並依**當前播放時間**重算段落後重套（所以不必從頭播放）。
           這裡不再用 setMode(..., {lock:true}) 冒充解鎖：那其實是再加一次鎖。 */
        sfAuto.setAttribute('aria-busy', 'true');
        Promise.resolve(handle.resumeAuto())
          .then(function (state) {
            if (state) syncFromState(state);
            /* 選單回到「跟隨歌曲」＝值為空字串，反映「由歌曲決定」這件事。
               不要設成 lastLocalTheme.presetId：那會讓選單停在「激昂」，
               看起來像使用者手動選了激昂（實際是自動的），與 aria-pressed=true 矛盾。 */
            if (sfTheme) {
              sfTheme.value = '';
            }
            var parts = [];
            parts.push(
              state &&
                state.locks &&
                (state.locks.mode || state.locks.theme || state.locks.intensity)
                ? '已恢復自動（部分手動設定仍保留）'
                : '已恢復自動：回到歌曲的本地主題與段落規則'
            );
            parts.push('段落仍會依播放時間調整動效強度與光影');
            say(parts.join('；'));
          })
          .catch(function (err) {
            say('恢復自動失敗：' + ((err && err.message) || '未知'));
          })
          .then(function () {
            sfAuto.removeAttribute('aria-busy');
          });
      });
    }
    /* Esc 只關最上層：舞台開著時先關舞台（檔案與抽屜留著）。
       Tab／Shift+Tab 一律在舞台內循環，背景已 inert，鍵盤不會走進看不見的內容。
       為什麼要在事件上做記號：舞台、歌曲檔案、抽屜三支監聽器都掛在**同一個
       document 的捕獲階段**，stopPropagation() 擋不住同節點的其他監聽器，而它們
       依註冊順序執行——舞台這支先跑、先把舞台關掉；檔案那支接著跑時舞台已經
       不是開著的了，於是任何「你上面還有彈層嗎」的判斷都失效，第二次關閉跟著發生。
       把「這一下按鍵已經被最上層用掉」寫在同一個事件物件上，下層就能明確讓路。 */
    document.addEventListener(
      'keydown',
      function (e) {
        if (!isOpen()) return;
        if (e.key === 'Tab') {
          /* Tab／Shift+Tab 離開這個控件時把清單**立刻**收乾淨（原生 select 也是
             一按 Tab 就收，不做淡出）：清單是可捲動區域，留著會影響這一下 Tab
             的落點。收完就讓下面的焦點圍籬照原樣處理，不動 Tab 的走向。 */
          if (modeMenuOpen) closeModeMenu(true);
          trapStageFocus(e);
          return;
        }
        if (e.key !== 'Escape') return;
        /* Esc 分層：模式清單開著時，這一下只收清單，不關舞台。
           這支監聽器掛在 document 的捕獲階段、註冊得比按鈕上的處理早，所以
           「先看到 Esc」的責任在它身上；在按鈕上再處理一次是為了不依賴註冊順序
           （那時 modeMenuOpen 已經 false，不會重複動作）。

           為什麼還要 stopImmediatePropagation()：**同一個 document 節點上還有
           第二支會關舞台的 Esc 監聽器**（js/app.js 的那支，它只問 stageOnTop()、
           不讀 __jcModalConsumed 記號），而 stopPropagation() 對同節點的其他監聽器
           無效——只寫記號的話，那支照樣會把舞台關掉，實測就是「Esc 直接把舞台收掉、
           清單跟舞台一起消失」。這裡是清單在吃這一下按鍵，用 stopImmediatePropagation
           才是真的「這一下已經用掉」。舞台的關閉路徑不受影響：Esc 只被攔在
           「清單開著」這一種情況下。 */
        if (modeMenuOpen) {
          closeModeMenu();
          e.preventDefault();
          e.stopImmediatePropagation();
          try {
            e.__jcModalConsumed = true;
          } catch {
            /* 事件不可擴充時只影響下層的讓路判斷，不影響收起清單本身 */
          }
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        try {
          e.__jcModalConsumed = true;
        } catch {
          /* 事件不可擴充時只影響下層的讓路判斷，不影響關閉本身 */
        }
        close();
      },
      true
    );
  }

  window.JCLyricStage = {
    open: open,
    follow: follow,
    close: close,
    isOpen: isOpen,
    activeRef: function () {
      return activeRef;
    },
    activeSongId: function () {
      return activeSongId;
    },
    available: available,
    moduleUrl: function () {
      return stageUrl(MODULE_FILE);
    },
    labels: { mode: MODE_LABEL, background: BG_LABEL }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
