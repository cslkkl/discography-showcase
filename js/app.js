/* ============================================================================
   app.js · 声之年轮
   Vanilla, no dependencies. Everything renders in traditional Chinese first and
   is converted at the DOM level by localize(), so the 繁 / 简 switch never needs
   a second copy of the markup or the data.
   ========================================================================= */
(function () {
  'use strict';

  /* 多歌手：本頁只負責一位歌手。?a=<id> 決定是誰；
     沒有參數或 id 不存在時，回到入口的選歌手頁。 */
  var DISCOGRAPHY = window.DISCOGRAPHY;
  var artistId = new URLSearchParams(location.search).get('a');
  var JC = DISCOGRAPHY && artistId ? DISCOGRAPHY.artists[artistId] : null;
  if (!JC) {
    location.replace('index.html');
    return;
  }
  var ALBUMS = JC.albums;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v;
  };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* 主視覺容器：入場、環境光與換片都要在它身上掛狀態類，先取一次共用 */
  var heroArt = document.getElementById('heroArt');

  /* ── language layer ─────────────────────────────────────────────────── */
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'content'];
  var textOrig = new WeakMap();
  var attrOrig = new WeakMap();
  var lang = 's';

  function walkText(root, cb) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    var list = [],
      i;
    while (w.nextNode()) list.push(w.currentNode);
    for (i = 0; i < list.length; i++) cb(list[i]);
  }

  function walkEl(root, cb) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        return SKIP[n.nodeName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    cb(root);
    while (w.nextNode()) cb(w.currentNode);
  }

  function localize(root, next) {
    next = next || lang;
    walkText(root, function (n) {
      if (!textOrig.has(n)) textOrig.set(n, n.nodeValue);
      var o = textOrig.get(n);
      n.nodeValue = next === 's' ? JC.toSimplified(o) : o;
    });
    walkEl(root, function (el) {
      var store = attrOrig.get(el),
        i,
        a,
        o;
      for (i = 0; i < ATTRS.length; i++) {
        a = ATTRS[i];
        if (!el.hasAttribute || !el.hasAttribute(a)) continue;
        if (!store) {
          store = {};
          attrOrig.set(el, store);
        }
        if (!(a in store)) store[a] = el.getAttribute(a);
        o = store[a];
        if (o == null) continue;
        el.setAttribute(a, next === 's' ? JC.toSimplified(o) : o);
      }
    });
  }

  /* 寫入動態屬性前先清掉首次快取，否則 localize() 會把它當原始值還原 */
  function dropAttr(el, name) {
    var store = attrOrig.get(el);
    if (store) delete store[name];
  }

  function setLang(next) {
    lang = next;
    document.documentElement.lang = next === 's' ? 'zh-Hans' : 'zh-Hant';
    document.documentElement.setAttribute('data-lang', next);
    var amState = $('#amLangState');
    if (amState) amState.textContent = next === 's' ? '簡' : '繁';
    var toggle = $('#langToggle');
    if (toggle) {
      // localize() caches each attribute's first-seen value, so drop the cache
      // for these two before writing: otherwise it restores the stale label.
      var store = attrOrig.get(toggle);
      if (store) {
        delete store['aria-label'];
        delete store['aria-pressed'];
      }
      // describe the action, not just the control, so it reads correctly aloud
      toggle.setAttribute(
        'aria-label',
        next === 's' ? '目前為簡體中文，切換為繁體' : '目前為繁體中文，切換為簡體'
      );
      toggle.setAttribute('aria-pressed', String(next === 't'));
    }
    localize(document.documentElement, next);
    $$('.lang-opt').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-opt') === next);
    });
    try {
      localStorage.setItem('jc-lang', next);
    } catch {
      /* 隐私模式下写入会抛错，忽略 */
    }
  }

  /* ── build helpers ──────────────────────────────────────────────────── */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /* Three widths per sleeve (480 / 960 / the 1200px original) so a phone never
     pulls the full-resolution plate down. */
  function srcset(a) {
    var b = 'assets/covers/responsive/' + a.id;
    return b + '-480.jpg 480w, ' + b + '-960.jpg 960w, ' + a.cover + ' 1200w';
  }
  function frag() {
    return document.createDocumentFragment();
  }

  /* ── playback icons ─────────────────────────────────────────────────────
     Phosphor "regular" paths, inlined. A row button carries both glyphs and
     CSS decides which one shows, so no re-render is needed on state change. */
  var P_PLAY =
    '<path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/>';
  var P_PAUSE =
    '<path d="M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z"/>';
  /* 指向专辑的箭头，用于年轮读数的「查看專輯」入口 */
  var P_ARROW =
    '<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>';
  function iconPaths() {
    return (
      '<svg class="ico pl-ico pl-ico--play" viewBox="0 0 256 256" aria-hidden="true">' +
      P_PLAY +
      '</svg>' +
      '<svg class="ico pl-ico pl-ico--pause" viewBox="0 0 256 256" aria-hidden="true">' +
      P_PAUSE +
      '</svg>'
    );
  }

  /* 音源型別決定文案：自有音檔播的是整首，官方目錄只有 30 秒片段。
     兩邊都不能假裝成另一邊，故動作詞與說明都由此處統一產生。 */
  function playWords(t) {
    var local = !!(t && t.local);
    return {
      local: local,
      verb: local ? '播放' : '試聽',
      idle: local ? '整首播放' : '試聽 30 秒',
      mode: local ? '本機音檔' : '官方 30 秒試聽',
      tail: local ? '，本機音檔，整首播放' : '，官方 30 秒片段'
    };
  }

  /* 隨機入口的用詞自適應：本機態有自有音檔，隨機播的是「隨機播放」；
     公開態只有 30 秒片段，則是「隨機試聽」。字串由 playWords() 產生，
     打包成公開態時文字自然跟著變，不必另外維護一份判斷。 */
  function randomWords() {
    var t = null,
      i;
    for (i = 0; i < JC.tracks.length; i++) {
      if (JC.tracks[i].local) return playWords(JC.tracks[i]);
      if (!t && JC.tracks[i].audio) t = JC.tracks[i];
    }
    return playWords(t);
  }

  /* Play control for one track row. `numClass` keeps the catalogue and the
     album sheet using their own numeral styling. */
  function playBtn(albumId, t, numClass) {
    var off = t.audio ? '' : ' disabled';
    var num = String(t.n).padStart(2, '0');
    var w = playWords(t);
    return (
      '<button class="ct-play" type="button" data-play="' +
      albumId +
      ':' +
      t.n +
      '"' +
      ' data-track="' +
      esc(t.zh) +
      '"' +
      ' data-verb="' +
      w.verb +
      '"' +
      ' aria-label="' +
      w.verb +
      ' ' +
      esc(t.zh) +
      '"' +
      off +
      '>' +
      '<span class="' +
      numClass +
      '">' +
      num +
      '</span>' +
      iconPaths() +
      '</button>'
    );
  }

  /* 歌曲列的動作：靜置只呈現事實（編號／歌名／年份／時長），
     滑鼠移上或鍵盤聚焦才淡入這三個動作。
     它們是**指標捷徑**，不是第二組控制項：真正進得了鍵盤與讀屏的是編號欄的
     播放鈕、歌名鈕與檔案裡的兩顆入口鈕。所以這裡用 span + aria-hidden，
     既不製造重複的無障礙節點，也不讓 175 列多出幾百個 Tab 停點。
     沒有音源的曲目就不放「播放」這一項，免得按下去只換來一句沒有試聽。 */
  function trackActions(a, t) {
    var w = playWords(t);
    return (
      '<span class="tr-acts" aria-hidden="true">' +
      (t.audio
        ? '<span class="ta" data-play="' + a.id + ':' + t.n + '">▶ ' + w.verb + '</span>'
        : '') +
      '<span class="ta" data-archive-lyrics="' +
      a.id +
      ':' +
      t.n +
      '">◎ 閱讀歌詞</span>' +
      '<span class="ta" data-archive="' +
      a.id +
      ':' +
      t.n +
      '">→ 查看檔案</span>' +
      '</span>'
    );
  }

  /* 歌名是這一列的主要入口：點下去進歌曲檔案（Song Archive），
     不是展開清單、也不是直接播放。播放留在編號欄那顆鈕上。 */
  function trackNameButton(a, t, cls) {
    return (
      '<button class="' +
      cls +
      '" type="button" data-archive="' +
      a.id +
      ':' +
      t.n +
      '"' +
      ' aria-label="開啟歌曲檔案，' +
      esc(t.zh) +
      '">' +
      esc(t.zh) +
      '</button>'
    );
  }

  /* ── boot ───────────────────────────────────────────────────────────── */
  var bootEl = $('#boot'),
    bootYear = $('#bootYear'),
    bootBar = $('#bootBar');

  function finishBoot() {
    bootEl.classList.add('is-done');
    document.body.classList.add('is-ready');
    document.documentElement.classList.add('is-ready');
    document.documentElement.classList.remove('is-booting');
    try {
      /* 记一笔：同一会话里再进歌手页（切歌手）直接呈现内容，不再走开场 */
      sessionStorage.setItem('jc-booted', '1');
    } catch {
      /* 隐私模式下写入会抛错，忽略 */
    }
    setTimeout(function () {
      bootEl.style.display = 'none';
    }, 800);
  }

  /* 是否跳过开场：同会话内已经看过一次就跳过（首次进入仍保留短开场） */
  function bootSeen() {
    try {
      return sessionStorage.getItem('jc-booted') === '1';
    } catch {
      return false;
    }
  }

  function runBoot() {
    if (REDUCED.matches || bootSeen()) {
      bootYear.textContent = String(JC.stats.to);
      bootBar.style.width = '100%';
      bootEl.classList.add('is-done');
      bootEl.style.display = 'none';
      document.body.classList.add('is-ready');
      document.documentElement.classList.add('is-ready');
      document.documentElement.classList.remove('is-booting');
      try {
        sessionStorage.setItem('jc-booted', '1');
      } catch {
        /* 忽略 */
      }
      return;
    }
    var from = JC.stats.from,
      to = JC.stats.to,
      dur = 900,
      t0 = performance.now();
    (function step(t) {
      var p = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      bootYear.textContent = String(Math.round(from + (to - from) * e));
      bootBar.style.width = p * 100 + '%';
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(finishBoot, 180);
    })(t0);
  }

  /* ── hero fan ───────────────────────────────────────────────────────── */
  /* 主視覺是一台可以左右翻的專輯輪播：中央那張是「當前專輯」，
     點兩側的封面把它翻到中間，點中央那張則打開該張專輯的抽屜。
     先前這裡只放 `JC.covers` 精選的五張、且 aria-hidden，純裝飾、不可操作；
     維護者要求「旁邊的專輯也該能左右翻」，於是改成走完 ALBUMS 的環形輪播。

  /* 位置表按「相對當前專輯的位移」給，與入口頁唱片架的資料模型一致：
     |off| <= 2 留在台上，其餘不掛圖、不收焦點。

     x 是「卡片自身寬度的百分比」；r 是 rotateY 角度，符號與入口頁一致
     （右側那張負角、左側正角，等於往後倒向同一個消失點）；
     tz 是 translateZ 的像素值（負數＝往後退），配合 .fan 的 preserve-3d 與
     .hero-art 的 1400px 透視，讓遠近由「真的退到後面」表達，而不是只把同一
     平面上的圖縮小。透視會把退後的卡片再收縮一次（tz=-170 時
     1400/(1400+170) ≈ 0.89），x 的位移也一併被往中心收，扇形因此比先前略窄，
     這正是縱深感的來源。z 仍是層級用的 z-index，兩者不可混用。

     位移上限是實測反解出來的，不是抄入口頁也不是算 cos 投影：
     3D 透視會把往後轉的外側封面再放大一點，投影寬比 cos 估算更大。
     以「與左欄標題間隙 ≥ 40px」為準，far 收到 58%（約 216px）、near 42%；
     先前試過 ±70%（實測間隙只剩 5px）與 ±112%（越界 151px）都太開。

     角度也是折中值：rotateY 越大越有縱深，但投影寬度按 cos 收縮，
     27° 時外側那張只剩一條邊（截圖可辨識度不足）。
     18°／14° 保留縱深又能看清封面。 */
  var FAN_SPEC = {
    '-2': { r: 18, x: -58, y: 8, s: 0.72, tz: -170, z: 1, o: 0.48 },
    '-1': { r: 14, x: -42, y: 3, s: 0.84, tz: -78, z: 2, o: 0.82 },
    0: { r: 0, x: 0, y: 0, s: 1, tz: 0, z: 6, o: 1 },
    1: { r: -14, x: 42, y: 3, s: 0.84, tz: -78, z: 2, o: 0.82 },
    2: { r: -18, x: 58, y: 8, s: 0.72, tz: -170, z: 1, o: 0.48 }
  };
  var fanIdx = 0;
  var fanCards = [];
  var fanEl = null;

  function fanOffset(i) {
    var n = ALBUMS.length;
    var off = (((i - fanIdx) % n) + n) % n;
    if (off * 2 > n) off -= n;
    return off;
  }

  function fanPaint() {
    fanCards.forEach(function (card, i) {
      var off = fanOffset(i);
      var sp = FAN_SPEC[String(off)];
      var on = !!sp;
      var a = ALBUMS[i];
      card.hidden = !on;
      card.tabIndex = on ? 0 : -1;
      /* 換位時清掉上一次的懸停避讓：class 會被下面那行整體覆寫，
         但行內的 --hx 不會，留著會讓卡片停在讓開後的位置 */
      card.style.removeProperty('--hx');
      if (!on) {
        /* 台上的圖才需要下載：十六張專輯全掛 src 會一次抓完 */
        card.querySelector('img').removeAttribute('src');
        card.querySelector('img').removeAttribute('srcset');
        return;
      }
      var img = card.querySelector('img');
      if (!img.getAttribute('src')) {
        img.src = a.cover;
        img.srcset = srcset(a);
      }
      card.style.setProperty('--fx', sp.x + '%');
      card.style.setProperty('--fy', sp.y + '%');
      card.style.setProperty('--fz', sp.tz + 'px');
      card.style.setProperty('--fr', sp.r + 'deg');
      card.style.setProperty('--fs', sp.s);
      card.style.setProperty('--fo', sp.o);
      card.style.setProperty('--z', sp.z);
      var center = off === 0;
      card.className = 'fan-card' + (center ? ' is-live' : '');
      dropAttr(card, 'aria-label');
      card.setAttribute('aria-label', center ? a.title + '，開啟專輯' : a.title + '，' + a.year);
      /* 中央那張要進專輯，其餘是把它翻過來 */
      card.setAttribute('aria-current', center ? 'true' : 'false');
    });
    setAmbient(ALBUMS[fanIdx] && ALBUMS[fanIdx].sourceAvg);
  }

  /* 封面的平均色 → "r, g, b"：--amb 的消費端一律是 rgba(var(--amb), α)。
     歌手頁的打光與歌曲檔案（Song Archive）的打光共用這一個出口，
     免得同一個色值有兩份解析。 */
  function ambTriple(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return ((v >> 16) & 255) + ', ' + ((v >> 8) & 255) + ', ' + (v & 255);
  }

  /* 動態環境光：當前專輯封面的平均色寫進 --amb，CSS 以 rgba(var(--amb), α) 疊光。
     背景不再是固定的一層紅，而是隨唱片換色——Apple Music 的年鑑就是這個做法。
     只寫一個自訂屬性，不動版面、不讀版面。 */
  function setAmbient(hex) {
    var amb = ambTriple(hex);
    if (!amb) return;
    var hero = $('#hero');
    if (hero) hero.style.setProperty('--amb', amb);
  }

  /* 換片：舊片先退場，短暫過渡，新片再放大出現、光線增強一次。
     直接改索引只會得到一次橫向滑動，看不到「闔上再翻開」的分段。
     全程 340 + 620ms，鍵盤連按不會掉步（delta 先累積在 pending）。
     路徑：.is-shifting（整台微暗微縮）→ 換位 → .is-arriving ＋ --amb 換色 ＋
     .hero-art.is-lit（環境光補亮）。 */
  var fanPending = 0;
  var fanShiftBusy = false;
  var fanShiftTimer = 0;
  var fanArriveTimer = 0;
  var FAN_OUT = 340;
  var FAN_IN = 620;

  function fanGo(delta) {
    var n = ALBUMS.length;
    if (!n) return;
    if (REDUCED.matches || !fanEl) {
      fanIdx = (((fanIdx + delta) % n) + n) % n;
      fanPaint();
      return;
    }
    fanPending += delta;
    if (fanShiftBusy) return;
    fanShiftBusy = true;
    fanEl.classList.remove('is-arriving');
    fanEl.classList.add('is-shifting');
    fanShiftTimer = setTimeout(function () {
      fanIdx = (((fanIdx + fanPending) % n) + n) % n;
      fanPending = 0;
      fanPaint();
      fanEl.classList.remove('is-shifting');
      /* 這行只為「連按」時重播進場動畫：remove 與 add 分屬不同任務，
         中間一定經過一次樣式重算，不必再強制回流。 */
      fanEl.classList.add('is-arriving');
      heroArt.classList.add('is-lit');
      fanArriveTimer = setTimeout(function () {
        fanShiftBusy = false;
        fanEl.classList.remove('is-arriving');
        heroArt.classList.remove('is-lit');
      }, FAN_IN);
    }, FAN_OUT);
  }

  /* 換歌手時把換片狀態機一起收乾淨。這兩個計時器句柄之所以要留著（而不是
     直接 setTimeout 不接），就是為了在這裡清掉：上一位歌手留下的計時器
     會在新資料上補跑一次 fanPaint()，把新歌手的輪播多推一格；
     留在 .hero-art 上的 is-lit 也會讓新歌手的環境光一直亮著。 */
  function resetFanShift() {
    if (fanShiftTimer) clearTimeout(fanShiftTimer);
    if (fanArriveTimer) clearTimeout(fanArriveTimer);
    fanShiftTimer = 0;
    fanArriveTimer = 0;
    fanPending = 0;
    fanShiftBusy = false;
    if (heroArt) heroArt.classList.remove('is-lit');
  }

  /* 懸停避讓：指到的那張跳出來，其餘往外讓開，讓這張完整可見。
     方向必須按**視覺**位移算，不能用 CSS 姊妹選擇器：輪播是環形的，
     DOM 順序與視覺左右不一致（最後幾張視覺上在左邊），
     用 `~` 會把左邊那兩張也往右推。距離越遠讓開越多。 */
  function fanHover(i) {
    var hovered = i >= 0 ? fanOffset(i) : null;
    fanCards.forEach(function (card, j) {
      if (i < 0 || j === i || card.hidden) {
        card.classList.remove('is-hover', 'is-yield');
        card.style.removeProperty('--hx');
        if (i >= 0 && j === i) card.classList.add('is-hover');
        return;
      }
      card.classList.remove('is-hover');
      card.classList.add('is-yield');
      var d = fanOffset(j) - hovered;
      var push = 10 + Math.min(Math.abs(d), 2) * 5;
      card.style.setProperty('--hx', (d > 0 ? push : -push) + '%');
    });
  }

  function renderFan() {
    var host = heroArt || $('#heroArt');
    if (!host) return;
    var fan = el('div', 'fan');
    fan.setAttribute('role', 'group');
    fan.setAttribute('aria-label', '專輯封面，左右翻閱，點中央開啟');
    ALBUMS.forEach(function (a, i) {
      var card = el('button', 'fan-card');
      card.type = 'button';
      card.style.setProperty('--i', i);
      var img = el('img');
      img.alt = '';
      img.decoding = 'async';
      img.loading = i === 0 ? 'eager' : 'lazy';
      card.appendChild(img);
      /* 表面高光掃過的載體。放在按鈕內、圖片之上，靠 CSS 的斜向漸層
         與 transform 掠過；用獨立節點而不是偽元素，是因為 ::before 已經
         是壓暗／描邊、::after 是邊緣亮線，兩者都被佔用。 */
      var sheen = el('span', 'fan-sheen');
      sheen.setAttribute('aria-hidden', 'true');
      card.appendChild(sheen);
      card.addEventListener('click', function () {
        var off = fanOffset(i);
        if (off === 0) openSheet(a.id);
        else fanGo(off);
      });
      /* 滑鼠停在封面或鍵盤聚焦：那張跳出來，其餘照視覺方向讓開 */
      card.addEventListener('pointerenter', function () {
        fanHover(i);
      });
      card.addEventListener('pointerleave', function () {
        fanHover(-1);
      });
      card.addEventListener('focus', function () {
        fanHover(i);
      });
      card.addEventListener('blur', function () {
        fanHover(-1);
      });
      fan.appendChild(card);
      fanCards.push(card);
    });
    host.appendChild(fan);
    fanEl = fan;
    host.removeAttribute('aria-hidden');
    fanIdx = 0;
    fanPaint();

    /* 鍵盤：方向鍵翻，Home／End 到首尾；事件只掛在這一組上，不在整份文件攔截 */
    fan.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        fanGo(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        fanGo(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        fanIdx = 0;
        fanPaint();
      } else if (e.key === 'End') {
        e.preventDefault();
        fanIdx = ALBUMS.length - 1;
        fanPaint();
      }
    });

    /* 主視覺的滑鼠視差已移除。它是整頁最貴的一段：隔離實測（CDP 主線程，
       同一頁、同樣指標事件數）滑鼠掠過主視覺 5.3 秒會吃掉樣式重算 1798.7ms／1246 次、
       主線程 3159ms；把視差停掉只剩 259.1ms／405 次／823ms（降 73%）。
       代價來自 .hero-art 的 1500px 透視 + .fan 的 preserve-3d：
       改一次 transform 就要為整棵子樹重算 3D 矩陣（單次 1.44ms，每秒上百次）。
       效果上它只是輕微傾斜，卻讓懸停避讓整體發澀；維護者選擇只保留避讓。 */
  }

  /* ── figures band ───────────────────────────────────────────────────── */
  function renderFigures() {
    var host = $('#figuresRow');
    if (!host) return;
    var hours = JC.stats.seconds / 3600;
    var rows = [
      { n: String(JC.stats.albums), unit: '張', label: '錄音室專輯' },
      { n: String(JC.stats.tracks), unit: '首', label: '收錄曲目' },
      { n: hours.toFixed(1), unit: '小時', label: '總錄音時長' },
      { n: String(JC.stats.span), unit: '年', label: '作品跨度' }
    ];
    rows.forEach(function (r, i) {
      var d = el('div', 'fig rv');
      d.style.setProperty('--d', i * 90 + 'ms');
      d.appendChild(el('dt', null, esc(r.label)));
      d.appendChild(el('dd', null, esc(r.n) + '<small>' + esc(r.unit) + '</small>'));
      host.appendChild(d);
    });
  }

  /* ── the single marquee ─────────────────────────────────────────────── */
  /* 跑馬燈內容取自這位歌手的代表曲，跨專輯均勻抽樣到約三十筆。
     不是任何一位歌手的固定清單：換歌手就換名字。 */
  function marqueeSongs() {
    var all = (JC.signature || []).map(function (s) {
      return s.zh;
    });
    if (!all.length)
      all = JC.tracks.slice(0, 30).map(function (t) {
        return t.zh;
      });
    var cap = 30;
    if (all.length <= cap) return all;
    var out = [];
    for (var i = 0; i < cap; i++) out.push(all[Math.round((i * (all.length - 1)) / (cap - 1))]);
    return out;
  }
  /* Two copies of the list: enough track to stay filled while it pans. */
  function renderMarquee() {
    var host = $('#marqueeTrack');
    if (!host) return;
    var songs = marqueeSongs();
    var f = frag();
    for (var pass = 0; pass < 2; pass++) {
      songs.forEach(function (s) {
        f.appendChild(el('span', null, esc(s)));
        f.appendChild(el('i'));
      });
    }
    host.appendChild(f);
    marqueeEl = $('.marquee');
    marqueeTrack = host;
    marqueeRoom = 0;
    /* 滑鼠在帶子上左右移動時把整條往該側推：指標靠右就往右、
       靠左就往左，最大位移 MARQ_PAN。觸控裝置沒有 hover，不接。 */
    var hoverable = !window.matchMedia('(hover: none)').matches;
    if (marqueeEl && hoverable) {
      marqueeEl.addEventListener('pointermove', function (e) {
        if (REDUCED.matches) return;
        var r = marqueeEl.getBoundingClientRect();
        marqueeHoverNTarget = clamp(((e.clientX - r.left) / (r.width || 1) - 0.5) * 2, -1, 1);
        if (!marqueeRaf) marqueeRaf = requestAnimationFrame(marqueeHoverTick);
      });
      marqueeEl.addEventListener('pointerleave', function () {
        marqueeHoverNTarget = 0;
        if (!marqueeRaf) marqueeRaf = requestAnimationFrame(marqueeHoverTick);
      });
    }
  }

  /* The band drifts as the page scrolls: a slow parallax response rather than a
     timed loop, so nothing animates unattended and no pause control is needed.
     指標位置也決定方向：指帶子右側整條往右推、指左側往左推，像用手撥。
     帶子左緣沒有空白可露，所以基準先向左墊一個幅度，指到最右時剛好回到起點。 */
  var marqueeEl,
    marqueeTrack,
    marqueeRoom = 0;
  var MARQ_PAN = 150;
  var marqueeHoverN = 0; /* 平滑後的指標位置，-1（最左）到 1（最右） */
  var marqueeHoverNTarget = 0;
  var marqueeRaf = 0;

  function marqueeAmp() {
    /* 幅度取內容可位移量的一部分，窄清單不會被一次推到底 */
    return Math.min(MARQ_PAN, marqueeRoom * 0.34);
  }

  function marqueePan() {
    if (!marqueeTrack || REDUCED.matches) return;
    if (!marqueeRoom) {
      marqueeRoom = Math.max(0, marqueeTrack.scrollWidth - document.documentElement.clientWidth);
      if (!marqueeRoom) return;
    }
    var r = marqueeEl.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    // ~1.15x the scroll delta, so it reads as depth rather than a race
    var travel = Math.min((vh + r.height) * 1.15, marqueeRoom);
    var amp = marqueeAmp();
    var x = clamp(amp + p * travel - marqueeHoverN * amp, 0, marqueeRoom);
    marqueeTrack.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
  }

  /* 指標平移要平滑，否則會跟著每一則 pointermove 抖；用 rAF 收斂到目標值 */
  function marqueeHoverTick() {
    marqueeHoverN += (marqueeHoverNTarget - marqueeHoverN) * 0.14;
    if (Math.abs(marqueeHoverNTarget - marqueeHoverN) > 0.004)
      marqueeRaf = requestAnimationFrame(marqueeHoverTick);
    else {
      marqueeHoverN = marqueeHoverNTarget;
      marqueeRaf = 0;
    }
    marqueePan();
  }

  /* ── album rack ─────────────────────────────────────────────────────── */
  var rackTrack, rackBar, rackNow, rackHint, rackViewport, rackPrev, rackNext;
  var cards = [];

  function renderRack() {
    rackTrack = $('#rackTrack');
    rackBar = $('#rackBar');
    rackNow = $('#rackNow');
    rackHint = $('#rackHint');
    rackViewport = $('#rackViewport');
    rackPrev = $('#rackPrev');
    rackNext = $('#rackNext');
    if (!rackTrack) return;
    var f = frag();
    ALBUMS.forEach(function (a) {
      var card = el('div', 'album-card');
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-id', a.id);
      var alt = a.alt ? '<span class="album-alt">' + esc(a.alt) + '</span>' : '';
      var first = firstPlayable(a);
      var w = playWords(first);
      card.innerHTML =
        '<button class="album-hit" type="button" data-open="' +
        a.id +
        '" aria-label="查看專輯 ' +
        esc(a.title) +
        '，' +
        a.year +
        '">' +
        '<span class="album-top"><span class="album-no">' +
        a.no +
        '</span><span class="album-year">' +
        a.year +
        '</span></span>' +
        '<span class="album-plate"><img src="' +
        a.cover +
        '" srcset="' +
        srcset(a) +
        '" sizes="(max-width: 860px) 74vw, 24vw" alt="' +
        esc(a.title) +
        ' 專輯封面" loading="lazy" decoding="async"></span>' +
        '<span class="album-body">' +
        '<span class="album-name">' +
        esc(a.title) +
        '</span>' +
        alt +
        '<span class="album-en">' +
        esc(a.en) +
        '</span>' +
        '</span>' +
        '</button>' +
        /* 浏览与播放分开：点封面看专辑，点这一颗直接播放 */
        (first
          ? '<button class="album-play" type="button" data-play="' +
            a.id +
            ':' +
            first.n +
            '" data-track="' +
            esc(a.title + ' 的 ' + first.zh + w.tail) +
            '" data-verb="' +
            w.verb +
            '" data-idle="' +
            w.idle +
            '" data-playing="暫停播放"' +
            ' aria-label="' +
            w.verb +
            ' ' +
            esc(a.title) +
            ' 的 ' +
            esc(first.zh) +
            w.tail +
            '">' +
            iconPaths() +
            '<span class="pl-label">' +
            w.idle +
            '</span></button>'
          : '');
      f.appendChild(card);
    });
    rackTrack.appendChild(f);
    cards = $$('.album-card', rackTrack);
    measureRack();
  }

  function measureRack() {
    if (!rackTrack) return;
    /* 展櫃不再劫持縱向捲動。先前桌面版把整段做成「釘住 + 捲動換橫向位移」，
       十張專輯要一萬多像素的捲動預算才走得完，維護者反映「一定要把所有專輯
       翻完才能看下面的內容」。現在改成原生橫向捲動：頁面照常往下走，
       專輯要看再自己拖；手機版本來就是這個做法，桌面現在與它一致。 */
    if (rackHint) rackHint.style.display = '';
    paintRackFromScroll();
  }

  function rackOffset() {
    if (!rackViewport) return 0;
    /* 可捲的是 .rack-viewport（overflow-x: auto），不是內層的 .rack-track：
       對 track 讀寫 scrollLeft 恆為 0，箭頭與 HUD 都會裝死 */
    return -rackViewport.scrollLeft;
  }

  function paintRackFromScroll() {
    if (!rackTrack || !rackViewport) return;
    var max = rackViewport.scrollWidth - rackViewport.clientWidth;
    if (rackBar) rackBar.style.width = (max > 0 ? (rackViewport.scrollLeft / max) * 100 : 0) + '%';
    var x = rackOffset();
    var center = rackViewport.clientWidth / 2,
      best = 0,
      bestD = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var cx = c.offsetLeft + x + c.offsetWidth / 2;
      var d = Math.abs(cx - center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    for (var j = 0; j < cards.length; j++) cards[j].classList.toggle('is-live', j === best);
    if (rackNow) rackNow.textContent = ALBUMS[best] ? ALBUMS[best].no : '01';
    if (rackPrev) rackPrev.disabled = rackViewport.scrollLeft <= 2;
    if (rackNext) rackNext.disabled = rackViewport.scrollLeft >= max - 2;
  }

  /* 一次捲一張卡：把該卡的左緣對到視窗左緣，鍵盤與箭頭都用這條 */
  function rackStepBy(dir) {
    if (!rackTrack || !rackViewport || !cards.length) return;
    var step = cards[0].offsetWidth + 24;
    var max = rackViewport.scrollWidth - rackViewport.clientWidth;
    rackScrollTo(clamp(rackViewport.scrollLeft + dir * step, 0, max), true);
  }

  function rackScrollTo(left, smooth) {
    if (!rackViewport) return;
    if (smooth) rackViewport.scrollTo({ left: left, behavior: 'smooth' });
    else rackViewport.scrollLeft = left;
  }

  /* 第一首可试听的曲目：卡片上的「试听 30 秒」按钮用它 */
  function firstPlayable(a) {
    for (var i = 0; i < a.tracks.length; i++) if (a.tracks[i].audio) return a.tracks[i];
    return null;
  }

  /* ── chronology ─────────────────────────────────────────────────────── */
  function renderChrono() {
    var host = $('#chronoList');
    if (!host) return;
    var f = frag();
    ALBUMS.forEach(function (a, i) {
      var li = el('li', 'rv');
      li.style.setProperty('--d', Math.min(i * 45, 400) + 'ms');
      var alt = a.alt ? '<span class="cr-alt">' + esc(a.alt) + '</span>' : '';
      li.innerHTML =
        '<button class="chrono-row" type="button" data-open="' +
        a.id +
        '">' +
        '<span class="cr-no">' +
        a.no +
        '</span>' +
        '<span class="cr-year">' +
        a.year +
        '</span>' +
        '<span class="cr-main"><span class="cr-title">' +
        esc(a.title) +
        '</span>' +
        alt +
        '</span>' +
        '<span class="cr-en">' +
        esc(a.en) +
        '</span>' +
        '<span class="cr-count">' +
        a.trackCount +
        ' 首</span>' +
        '<span class="cr-go"><svg class="ico" viewBox="0 0 256 256" aria-hidden="true"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg></span>' +
        '</button>';
      f.appendChild(li);
    });
    host.appendChild(f);
  }

  /* ── year rings ─────────────────────────────────────────────────────── */
  var ringNodes = [],
    legendNodes = [],
    /* -1：初值必须是「未选中」，否则首次 setRingLive(0) 会被去重守卫挡掉，
       读数（封面/年份/专辑名/入口）就永远不会填充 */
    ringsLive = -1;

  /* cover averages can be quite dark; lift them toward paper so a ring keeps
     a readable edge against the ink base without inventing a new accent */
  function lift(hex, t) {
    var h = String(hex).replace('#', '');
    if (h.length !== 6) return '#8A867E';
    var to = [0xf3, 0xf0, 0xea];
    var out = [0, 1, 2].map(function (i) {
      var v = parseInt(h.substr(i * 2, 2), 16);
      return Math.round(v + (to[i] - v) * t);
    });
    return (
      '#' +
      out
        .map(function (v) {
          return ('0' + v.toString(16)).slice(-2);
        })
        .join('')
    );
  }

  function setRingLive(i) {
    if (i === ringsLive && ringNodes.length) return;
    ringsLive = i;
    var a = ALBUMS[i];
    ringNodes.forEach(function (n, k) {
      n.classList.toggle('is-live', k === i);
      n.classList.toggle('is-dim', k !== i);
    });
    legendNodes.forEach(function (n, k) {
      n.classList.toggle('is-live', k === i);
    });
    var ro = $('#ringsReadout');
    if (ro && a) {
      /* 读数与所选那圈同步：封面、年份、专辑名、曲目数，并给出进入专辑的入口 */
      ro.innerHTML =
        '<span class="rr-cover"><img src="' +
        a.cover +
        '" srcset="' +
        srcset(a) +
        '" sizes="76px" alt=""></span>' +
        '<span class="rr-year">' +
        a.year +
        '</span>' +
        '<span class="rr-title">' +
        esc(a.title) +
        '</span>' +
        '<span class="rr-meta">' +
        a.trackCount +
        ' 首 · ' +
        esc(a.runtime) +
        '</span>' +
        '<button class="rr-open" type="button" data-open-album="' +
        a.id +
        '">查看專輯' +
        '<svg class="ico" viewBox="0 0 256 256" aria-hidden="true">' +
        P_ARROW +
        '</svg></button>';
      localize(ro);
    }
  }

  function renderRings() {
    var stage = $('#ringsStage'),
      legend = $('#ringsLegend');
    if (!stage || !legend) return;
    var CX = 500,
      CY = 500,
      R0 = 88,
      STEP = 27;
    var parts = [
      '<svg viewBox="0 0 1000 1000" role="presentation">',
      '<g transform="rotate(-90 500 500)">'
    ];
    ALBUMS.forEach(function (a, i) {
      var r = R0 + i * STEP;
      var c = (2 * Math.PI * r).toFixed(1);
      var w = (7 + (a.trackCount - 10) * 2).toFixed(1);
      parts.push(
        '<circle class="ring-path" data-ring="' +
          i +
          '" data-id="' +
          a.id +
          '"' +
          ' cx="' +
          CX +
          '" cy="' +
          CY +
          '" r="' +
          r +
          '" stroke="' +
          lift(a.sourceAvg, 0.22) +
          '"' +
          ' stroke-width="' +
          w +
          '" style="--c:' +
          c +
          'px;--i:' +
          i +
          '"></circle>'
      );
    });
    parts.push('</g></svg>');
    stage.innerHTML = parts.join('');
    ringNodes = $$('.ring-path', stage);

    var f = frag();
    var isTouch = window.matchMedia('(hover: none)').matches;
    ALBUMS.forEach(function (a, i) {
      var li = el('li');
      li.innerHTML =
        '<button class="rl-row" type="button" data-ring="' +
        i +
        '" data-id="' +
        a.id +
        '"' +
        ' aria-label="查看專輯 ' +
        esc(a.title) +
        '，' +
        a.year +
        '，' +
        a.trackCount +
        ' 首">' +
        '<span class="rl-swatch" style="background:' +
        lift(a.sourceAvg, 0.22) +
        '"></span>' +
        '<span class="rl-year">' +
        a.year +
        '</span>' +
        '<span class="rl-title">' +
        esc(a.title) +
        '</span>' +
        '<span class="rl-n">' +
        String(a.trackCount).padStart(2, '0') +
        '</span></button>';
      f.appendChild(li);
    });
    legend.appendChild(f);
    legendNodes = $$('.rl-row', legend);

    setRingLive(0);

    // rings draw in once the figure is on screen
    var svgEl = stage.querySelector('svg');
    var settleTimer = 0;
    var settle = function () {
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = 0;
      }
      if (!svgEl) return;
      svgEl.classList.add('is-settled');
    };
    var draw = function () {
      if (!svgEl || svgEl.classList.contains('is-drawn')) return;
      svgEl.classList.add('is-drawn');
      /* 错峰 delay 只服务于入场；入场走完就清零，否则悬停要等「序号 × 55ms」 */
      settleTimer = setTimeout(settle, 55 * Math.max(0, ringNodes.length - 1) + 1150);
    };

    /* 交互接线一律先做：年轮的选择、读数与「查看專輯」入口与入场动画无关，
       放在降级分支之后会被 reduced-motion 与无 IntersectionObserver 的环境整段跳过 */
    // pointer only on non-touch: on touch, hover never fires
    if (!isTouch) {
      ringNodes.forEach(function (n) {
        n.addEventListener('pointerenter', function () {
          /* 用户已经在交互：立刻结束错峰，别让悬停等入场延迟 */
          settle();
          setRingLive(+n.dataset.ring);
        });
      });
      legendNodes.forEach(function (n) {
        n.addEventListener('pointerenter', function () {
          settle();
          setRingLive(+n.dataset.ring);
        });
      });
    }
    legend.addEventListener('focusin', function (e) {
      var b = e.target.closest ? e.target.closest('[data-ring]') : null;
      if (b) setRingLive(+b.getAttribute('data-ring'));
    });
    // the legend lives outside the figure, so listen on the whole section
    var section = $('#rings');
    if (section) {
      section.addEventListener('click', function (e) {
        /* 读数的「查看專輯」按钮才进入专辑；点圈或图例只切换选中，
           避免探索年轮时误触跳走 */
        var open = e.target.closest ? e.target.closest('[data-open-album]') : null;
        if (open) {
          openSheet(open.getAttribute('data-open-album'));
          return;
        }
        var n = e.target.closest ? e.target.closest('[data-ring]') : null;
        if (n) setRingLive(+n.getAttribute('data-ring'));
      });
    }

    if (REDUCED.matches || !('IntersectionObserver' in window)) {
      draw();
      settle();
      return;
    }
    var ro = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            draw();
            ro.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    ro.observe(stage);
  }

  /* ── era chapters ───────────────────────────────────────────────────── */
  function renderEras() {
    var host = $('#erasList');
    if (!host) return;
    JC.eras.forEach(function (e, i) {
      var wrap = el('article', 'era rv');
      wrap.style.setProperty('--d', i * 80 + 'ms');
      var covers = e.covers
        .map(function (c) {
          return (
            '<button type="button" data-open="' +
            c.id +
            '" aria-label="查看專輯 ' +
            esc(c.title) +
            '">' +
            '<img src="assets/covers/responsive/' +
            c.id +
            '-480.jpg" alt="' +
            esc(c.title) +
            ' 專輯封面" loading="lazy" decoding="async"></button>'
          );
        })
        .join('');
      wrap.innerHTML =
        '<div class="era-copy">' +
        '<span class="era-no">第 ' +
        e.no +
        ' 階段</span>' +
        '<h3 class="era-title">' +
        esc(e.title) +
        '</h3>' +
        '<span class="era-range">' +
        e.from +
        ' 至 ' +
        e.to +
        ' · ' +
        e.en +
        '</span>' +
        '<p class="era-note">' +
        esc(e.note) +
        '</p>' +
        '<p class="era-meta">' +
        e.count +
        ' 張專輯 · ' +
        e.tracks +
        ' 首 · 總長 ' +
        esc(e.runtime) +
        '</p>' +
        '</div>' +
        '<div class="era-covers">' +
        covers +
        '</div>';
      host.appendChild(wrap);
    });
  }

  /* ── cover wall ─────────────────────────────────────────────────────── */
  function renderWall() {
    var host = $('#wallGrid');
    if (!host) return;
    var f = frag();
    ALBUMS.forEach(function (a) {
      var first = firstPlayable(a);
      var w = playWords(first);
      var wrap = el('div', 'wall-cell rv');
      wrap.innerHTML =
        '<button class="wall-tile" type="button" data-open="' +
        a.id +
        '" aria-label="查看專輯 ' +
        esc(a.title) +
        '，' +
        a.year +
        '">' +
        '<span class="wt-plate"><img src="assets/covers/responsive/' +
        a.id +
        '-480.jpg" srcset="' +
        'assets/covers/responsive/' +
        a.id +
        '-480.jpg 480w, ' +
        a.cover +
        ' 1200w" sizes="(max-width: 860px) 46vw, 23vw" ' +
        'alt="' +
        esc(a.title) +
        ' 專輯封面" loading="lazy" decoding="async"></span>' +
        '<span class="wt-cap"><span class="wt-title">' +
        esc(a.title) +
        '</span>' +
        '<span class="wt-year">' +
        a.year +
        '</span></span>' +
        '</button>' +
        (first
          ? '<button class="wt-play" type="button" data-play="' +
            a.id +
            ':' +
            first.n +
            '" data-track="' +
            esc(a.title + ' 的 ' + first.zh + w.tail) +
            '" data-verb="' +
            w.verb +
            '" aria-label="' +
            w.verb +
            ' ' +
            esc(a.title) +
            ' 的 ' +
            esc(first.zh) +
            w.tail +
            '">' +
            iconPaths() +
            '</button>'
          : '');
      f.appendChild(wrap);
    });
    host.appendChild(f);
  }

  /* ── data views ─────────────────────────────────────────────────────── */
  function renderGrowth() {
    var host = $('#growthChart');
    if (!host) return;
    var W = 900,
      H = 300,
      PL = 46,
      PR = 18,
      PT = 18,
      PB = 34;
    var g = JC.growth;
    var t0 = new Date(g[0].dateISO).getTime();
    var t1 = new Date(g[g.length - 1].dateISO).getTime();
    var maxY = g[g.length - 1].total;
    var X = function (iso) {
      return PL + ((new Date(iso).getTime() - t0) / (t1 - t0)) * (W - PL - PR);
    };
    var Y = function (v) {
      return H - PB - (v / maxY) * (H - PT - PB);
    };
    var s = [
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="累積曲目數隨時間的成長曲線">'
    ];
    [0, 50, 100, 150].forEach(function (v) {
      s.push(
        '<line class="rule" x1="' +
          PL +
          '" y1="' +
          Y(v).toFixed(1) +
          '" x2="' +
          (W - PR) +
          '" y2="' +
          Y(v).toFixed(1) +
          '"/>'
      );
      s.push(
        '<text x="' +
          (PL - 10) +
          '" y="' +
          (Y(v) + 4).toFixed(1) +
          '" text-anchor="end">' +
          v +
          '</text>'
      );
    });
    var pts = g.map(function (r) {
      return [X(r.dateISO), Y(r.total)];
    });
    var line =
      'M' +
      PL +
      ',' +
      Y(0).toFixed(1) +
      ' ' +
      pts
        .map(function (p) {
          return 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1);
        })
        .join(' ');
    s.push(
      '<path class="area" d="' +
        line +
        ' L' +
        pts[pts.length - 1][0].toFixed(1) +
        ',' +
        Y(0).toFixed(1) +
        ' Z"/>'
    );
    s.push('<path class="line" d="' + line + '"/>');
    pts.forEach(function (p, i) {
      s.push(
        '<circle class="dot" cx="' +
          p[0].toFixed(1) +
          '" cy="' +
          p[1].toFixed(1) +
          '" r="3.4"><title>' +
          esc(g[i].year + ' ' + g[i].title + '：累計 ' + g[i].total + ' 首') +
          '</title></circle>'
      );
      if (i % 4 === 0 || i === pts.length - 1) {
        s.push(
          '<text x="' +
            p[0].toFixed(1) +
            '" y="' +
            (H - 12) +
            '" text-anchor="middle">' +
            g[i].year +
            '</text>'
        );
      }
    });
    s.push(
      '<text x="' +
        (W - PR) +
        '" y="' +
        (Y(maxY) - 12).toFixed(1) +
        '" text-anchor="end">' +
        JC.stats.tracks +
        '</text>'
    );
    s.push('</svg>');
    host.innerHTML = s.join('');
  }

  function renderGaps() {
    var host = $('#gapChart');
    if (!host) return;
    var gp = JC.gaps,
      max = JC.distribution.gapMax;
    var s = ['<div class="gaplist">'];
    gp.forEach(function (g) {
      var pct = (g.months / max) * 100;
      var peak = g.months === max ? ' is-peak' : '';
      s.push(
        '<div class="gaprow' +
          peak +
          '" data-open="' +
          g.to +
          '" role="button" tabindex="0"' +
          ' aria-label="第 ' +
          g.fromNo +
          ' 張到第 ' +
          g.toNo +
          ' 張，相隔 ' +
          g.label +
          '">' +
          '<span class="gn">' +
          g.fromNo +
          '→' +
          g.toNo +
          '</span>' +
          '<span class="gtrack"><i style="width:' +
          pct.toFixed(1) +
          '%"></i></span>' +
          '<span class="gv">' +
          esc(g.label) +
          '</span></div>'
      );
    });
    s.push('</div>');
    host.innerHTML = s.join('');
  }

  function renderBars() {
    var host = $('#barsChart');
    if (!host) return;
    var d = JC.distribution;
    var s = ['<div class="bars">'];
    d.trackCounts.forEach(function (t, i) {
      var r = d.runtimes[i];
      var tw = ((t.n - d.trackMin + 1) / (d.trackMax - d.trackMin + 1)) * 100;
      var rw = ((r.sec - d.runtimeMin + 60) / (d.runtimeMax - d.runtimeMin + 60)) * 100;
      s.push(
        '<div class="brow" data-open="' +
          t.id +
          '" role="button" tabindex="0"' +
          ' aria-label="查看專輯 ' +
          esc(t.title) +
          '，' +
          t.n +
          ' 首，總長 ' +
          esc(r.label) +
          '">' +
          '<span class="bn">' +
          t.no +
          '</span>' +
          '<span class="bt">' +
          esc(t.title) +
          '</span>' +
          '<span class="btrack"><i style="width:' +
          Math.max(tw, 8).toFixed(1) +
          '%"></i></span>' +
          '<span class="bv">' +
          t.n +
          '</span>' +
          '<span class="btrack btrack--alt"><i style="width:' +
          Math.max(rw, 8).toFixed(1) +
          '%"></i></span>' +
          '<span class="bv">' +
          esc(r.label) +
          '</span></div>'
      );
    });
    s.push('</div>');
    host.innerHTML = s.join('');
  }

  function renderFacts() {
    var host = $('#dataFacts');
    if (!host) return;
    var d = JC.distribution;
    var hours = Math.floor(JC.stats.seconds / 3600);
    var mins = Math.round((JC.stats.seconds % 3600) / 60);
    var rows = [
      { n: String(JC.stats.tracks), unit: '首', label: '曲目總數' },
      { n: hours + ':' + String(mins).padStart(2, '0'), unit: '小時', label: '總錄音時長' },
      { n: String(d.gapMedian), unit: '個月', label: '發行間隔中位數' },
      { n: (d.gapMax / 12).toFixed(1), unit: '年', label: '最長的一次間隔' }
    ];
    rows.forEach(function (r) {
      var w = el('div', 'df');
      w.appendChild(el('dt', null, esc(r.label)));
      w.appendChild(el('dd', null, esc(r.n) + '<small>' + esc(r.unit) + '</small>'));
      host.appendChild(w);
    });
    var peak = $('#gapPeak');
    if (peak) peak.textContent = d.longestGap.label;
  }

  /* ── long and short ─────────────────────────────────────────────────── */
  function rankRow(t, i, digits) {
    return (
      '<li><button class="rank-row" type="button" data-open="' +
      t.album +
      '"' +
      ' aria-label="' +
      esc(t.zh) +
      '，' +
      esc(t.albumTitle) +
      '，' +
      esc(t.len) +
      '">' +
      '<span class="rk-n">' +
      String(i + 1).padStart(digits, '0') +
      '</span>' +
      '<span class="rk-title">' +
      esc(t.zh) +
      '</span>' +
      '<span class="rk-album">' +
      t.year +
      ' · ' +
      esc(t.albumTitle) +
      '</span>' +
      '<span class="rk-len">' +
      esc(t.len) +
      '</span></button></li>'
    );
  }

  function renderRanks() {
    var l = $('#longList'),
      s = $('#shortList');
    if (l)
      l.innerHTML = JC.longest
        .map(function (t, i) {
          return rankRow(t, i, 2);
        })
        .join('');
    if (s)
      s.innerHTML = JC.shortest
        .map(function (t, i) {
          return rankRow(t, i, 2);
        })
        .join('');
  }

  /* ── collaborators ──────────────────────────────────────────────────── */
  function renderCollab() {
    var host = $('#collabList');
    if (!host) return;
    JC.collaborators.forEach(function (c) {
      var card = el('div', 'collab-card rv');
      var rows = c.tracks
        .map(function (t) {
          return (
            '<div class="cc-track" data-open="' +
            t.album +
            '" role="button" tabindex="0"' +
            ' aria-label="' +
            esc(t.zh) +
            '，收錄於 ' +
            esc(t.albumTitle) +
            '">' +
            '<span class="cc-title">' +
            esc(t.short) +
            '</span>' +
            '<span class="cc-album">' +
            t.year +
            ' · ' +
            esc(t.albumTitle) +
            '</span></div>'
          );
        })
        .join('');
      card.innerHTML =
        '<div class="cc-head"><span class="cc-name">' +
        esc(c.name) +
        '</span>' +
        '<span class="cc-count">' +
        c.count +
        ' 首</span></div>' +
        rows;
      host.appendChild(card);
    });
    var tot = $('#collabTotal');
    if (tot) tot.textContent = String(JC.collaborators.length);
  }

  /* ── signature picks ────────────────────────────────────────────────── */
  function renderPicks() {
    var host = $('#picksList');
    if (!host) return;
    var f = frag();
    JC.signature.forEach(function (t) {
      var b = el('button', 'pick');
      b.type = 'button';
      /* 代表曲也是「歌」：點下去進歌曲檔案，與曲目總表同一條路徑 */
      b.setAttribute('data-archive', t.album + ':' + t.n);
      b.setAttribute('aria-label', '開啟歌曲檔案，' + t.zh + '，' + t.albumTitle + '，' + t.len);
      b.innerHTML =
        '<span class="pk-title">' +
        esc(t.zh) +
        '</span>' +
        '<span class="pk-album">' +
        t.year +
        '</span>';
      f.appendChild(b);
    });
    host.appendChild(f);
    var tot = $('#picksTotal');
    if (tot) tot.textContent = String(JC.signature.length);
  }

  /* ── full catalogue ─────────────────────────────────────────────────── */
  var catList, catEmpty, searchInput, searchStatus, searchClear, catTotal;
  var index = [];

  function buildIndex() {
    /* 就地換歌手會再跑一次：index 是模組級陣列，必須先清空，
       否則會把上一位歌手的曲目一併留在索引裡（實測 126→301→427 一路疊上去） */
    index = [];
    ALBUMS.forEach(function (a) {
      var albumHay = [a.title, a.alt, a.en, String(a.year), a.no, a.publisher]
        .join(' ')
        .toLowerCase();
      a.tracks.forEach(function (t) {
        index.push({
          album: a,
          track: t,
          hay:
            albumHay +
            ' ' +
            t.zh.toLowerCase() +
            '\u0001' +
            JC.toSimplified(albumHay + ' ' + t.zh.toLowerCase())
        });
      });
    });
  }

  function renderCat(query) {
    if (!catList) return;
    var q = (query || '').trim().toLowerCase();
    var qs = q ? JC.toSimplified(q) : '';
    var hits = !q
      ? index
      : index.filter(function (r) {
          return r.hay.indexOf(q) !== -1 || (qs && r.hay.indexOf(qs) !== -1);
        });

    // group by album, preserving release order
    var groups = [],
      byId = {};
    hits.forEach(function (r) {
      var g = byId[r.album.id];
      if (!g) {
        g = byId[r.album.id] = { album: r.album, tracks: [] };
        groups.push(g);
      }
      g.tracks.push(r.track);
    });
    groups.sort(function (a, b) {
      return a.album.idx - b.album.idx;
    });

    var f = frag();
    groups.forEach(function (g) {
      var a = g.album;
      var wrap = el('section', 'cat-group rv');
      var alt = a.alt ? '<span class="cg-alt">' + esc(a.alt) + '</span>' : '';
      wrap.innerHTML =
        '<header class="cat-group-head">' +
        '<span class="cg-no">' +
        a.no +
        '</span>' +
        '<h3 class="cg-title"><button type="button" data-open="' +
        a.id +
        '" style="text-align:left">' +
        esc(a.title) +
        '</button></h3>' +
        alt +
        '<span class="cg-meta">' +
        a.year +
        ' · ' +
        g.tracks.length +
        ' 首</span>' +
        '</header>';
      var ol = el('ol', 'cat-tracks');
      g.tracks.forEach(function (t) {
        var li = el('li', 'cat-track' + (t.sig ? ' is-sig' : ''));
        /* 檔案式條目：編號 → 歌名 → 年份 → 時長，一行一筆。
           年份與時長都是既有資料（專輯年份、曲目時長），不新增欄位 */
        li.innerHTML =
          playBtn(g.album.id, t, 'ct-num') +
          trackNameButton(g.album, t, 'ct-name') +
          '<span class="ct-year">' +
          g.album.year +
          '</span>' +
          '<span class="ct-len">' +
          t.len +
          '</span>' +
          trackActions(g.album, t);
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
      f.appendChild(wrap);
    });
    catList.innerHTML = '';
    catList.appendChild(f);

    if (catEmpty) catEmpty.hidden = hits.length !== 0;
    if (searchStatus) {
      searchStatus.innerHTML = q
        ? '找到 <b>' + hits.length + '</b> 首，來自 <b>' + groups.length + '</b> 張專輯'
        : '依專輯分組，共 <b>' + index.length + '</b> 首';
    }
    if (searchClear) searchClear.hidden = !q;
    if (catTotal) catTotal.textContent = String(JC.stats.tracks);

    localize(catList);
    localize(searchStatus);
    observeReveals(catList);
    syncPlayingRows();
  }

  function renderCatBase() {
    catList = $('#catList');
    catEmpty = $('#catEmpty');
    searchInput = $('#searchInput');
    searchStatus = $('#searchStatus');
    searchClear = $('#searchClear');
    catTotal = $('#catTotal');
    buildIndex();
    renderCat('');
  }

  /* ── reveal on scroll ───────────────────────────────────────────────── */
  var io = null;
  function observeReveals(root) {
    var nodes = $$('.rv', root || document).filter(function (n) {
      return !n.classList.contains('is-in');
    });
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) {
        n.classList.add('is-in');
      });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
      );
    }
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  /* ── album sheet ────────────────────────────────────────────────────── */
  var sheet,
    sheetPanel,
    sheetScroll,
    lastFocus = null,
    currentId = null,
    hintShown = false;
  var sheetCloseTimer = 0;

  function albumById(id) {
    return ALBUMS.filter(function (a) {
      return a.id === id;
    })[0];
  }

  /* 官方入口：平台清單由 meta.mjs 宣告（哪些平台確實有貨是人工判斷）。
     Apple 用目錄自帶的專輯 id 直達該張專輯；其餘為搜尋連結，
     搜尋不保證有貨，只是把使用者送到正確的結果頁。 */
  var LISTEN_LABEL = {
    apple: 'Apple Music',
    qq: 'QQ 音樂',
    netease: '網易雲音樂',
    spotify: 'Spotify',
    youtube: 'YouTube'
  };

  function listenRow(a) {
    var ids = JC.listen || [];
    if (!ids.length) return '';
    /* 同名专辑（如 Taylor Swift 的首张）会让关键词重复，去掉冗余 */
    var term = encodeURIComponent(a.title === JC.name ? a.title : a.title + ' ' + JC.name);
    var urls = {
      apple: a.collectionId
        ? 'https://music.apple.com/tw/album/' + a.collectionId
        : 'https://music.apple.com/tw/search?term=' + term,
      qq: 'https://y.qq.com/n/ryqq/search?w=' + term,
      netease: 'https://music.163.com/#/search/m/?s=' + term + '&type=1',
      spotify: 'https://open.spotify.com/search/' + term,
      youtube: 'https://www.youtube.com/results?search_query=' + term
    };
    var links = ids
      .filter(function (id) {
        return urls[id] && LISTEN_LABEL[id];
      })
      .map(function (id) {
        return (
          '<a class="sl-link" href="' +
          esc(urls[id]) +
          '" target="_blank" rel="noopener noreferrer">' +
          LISTEN_LABEL[id] +
          '</a>'
        );
      })
      .join('');
    if (!links) return '';
    return (
      '<div class="sheet-listen">' +
      '<span class="sl-label">整張在官方平台聽</span>' +
      links +
      (JC.listenNote ? '<span class="sl-note">' + esc(JC.listenNote) + '</span>' : '') +
      '</div>'
    );
  }

  function sheetHTML(a) {
    var facts =
      '<dl class="sheet-facts">' +
      '<dt>發行日期</dt><dd>' +
      esc(a.date) +
      '</dd>' +
      '<dt>曲目數</dt><dd>' +
      a.trackCount +
      ' 首</dd>' +
      '<dt>總長</dt><dd>' +
      esc(a.runtime) +
      '</dd>' +
      '<dt>編號</dt><dd>' +
      a.no +
      ' / ' +
      ALBUMS.length +
      '</dd>' +
      '<dt>發行</dt><dd>' +
      esc(a.publisher) +
      '</dd>' +
      '</dl>';
    var rows = a.tracks
      .map(function (t) {
        return (
          '<li class="sheet-track' +
          (t.sig ? ' is-sig' : '') +
          '">' +
          playBtn(a.id, t, 'st-num') +
          trackNameButton(a, t, 'st-name') +
          '<span class="st-year">' +
          a.year +
          '</span>' +
          '<span class="st-len">' +
          t.len +
          '</span>' +
          trackActions(a, t) +
          '</li>'
        );
      })
      .join('');
    return (
      '' +
      '<div class="sheet-inner">' +
      /* 封面 + 标题并排：窄屏也不会让大封面把试听入口推到下方 */
      '<div class="sheet-head">' +
      '<div class="sheet-cover"><img src="' +
      a.cover +
      '" srcset="' +
      srcset(a) +
      '" sizes="(max-width: 860px) 34vw, 34vw" alt="' +
      esc(a.title) +
      ' 專輯封面"></div>' +
      '<div class="sheet-headtext">' +
      '<p class="sheet-no">' +
      a.no +
      ' / ' +
      ALBUMS.length +
      '</p>' +
      '<h2 class="sheet-title" id="sheetTitle">' +
      esc(a.title) +
      '</h2>' +
      (a.alt ? '<p class="sheet-alt">' + esc(a.alt) + '</p>' : '') +
      '<p class="sheet-en">' +
      esc(a.en) +
      ' · ' +
      a.year +
      '</p>' +
      '<button class="sheet-playall" type="button" data-playall="' +
      a.id +
      '">' +
      '<svg class="ico pl-ico" viewBox="0 0 256 256" aria-hidden="true">' +
      P_PLAY +
      '</svg>' +
      '<span>' +
      (playWords(firstPlayable(a)).local ? '播放整張' : '試聽整張 · 30 秒') +
      '</span></button>' +
      listenRow(a) +
      '</div>' +
      '</div>' +
      '<div class="sheet-body">' +
      '<p class="sheet-sect">曲目列表</p>' +
      '<ol class="sheet-tracks">' +
      rows +
      '</ol>' +
      /* 编辑文字与发行资料放在曲目之后：先能被听到，再被读到 */
      '<p class="sheet-blurb">' +
      esc(a.blurb) +
      '</p>' +
      facts +
      '</div>' +
      '</div>'
    );
  }

  function openSheet(id, silent) {
    var a = albumById(id);
    if (!a) return;
    currentId = id;
    if (!sheet) {
      sheet = $('#sheet');
      sheetPanel = $('.sheet-panel', sheet);
      sheetScroll = $('#sheetScroll');
    }
    lastFocus = document.activeElement;
    // a pending teardown from a just-closed sheet must not wipe the new content
    if (sheetCloseTimer) {
      clearTimeout(sheetCloseTimer);
      sheetCloseTimer = 0;
    }
    sheetPanel.style.setProperty('--tint', a.tint.join(', '));
    /* 专辑层主题：抽屉打开即进入这张唱片的色彩世界 */
    if (a.theme) {
      sheetPanel.style.setProperty('--accent', a.theme.accent);
      sheetPanel.style.setProperty('--accent-on', a.theme.accentOn);
    }
    sheetScroll.innerHTML = sheetHTML(a);
    localize(sheetScroll);
    sheet.hidden = false;
    sheetScroll.scrollTop = 0;
    requestAnimationFrame(function () {
      sheet.classList.add('is-open');
    });
    document.body.classList.add('is-locked');
    sheetPanel.focus({ preventScroll: true });
    if (!silent && !hintShown) {
      hintShown = true;
      setTimeout(function () {
        toast('按 Esc 關閉，左右方向鍵切換專輯');
      }, 700);
    }
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    currentId = null;
    clearTimeout(sheetCloseTimer);
    sheetCloseTimer = setTimeout(function () {
      sheetCloseTimer = 0;
      sheet.hidden = true;
      sheetScroll.innerHTML = '';
    }, 620);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function stepSheet(dir) {
    if (!currentId) return;
    var i = ALBUMS.indexOf(albumById(currentId));
    var n = (i + dir + ALBUMS.length) % ALBUMS.length;
    openSheet(ALBUMS[n].id, true);
  }

  function trapFocus(e) {
    if (e.key !== 'Tab' || !sheet || sheet.hidden) return;
    var items = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', sheetPanel).filter(
      function (n) {
        return n.offsetParent !== null;
      }
    );
    if (!items.length) return;
    var first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ── song archive ──────────────────────────────────────────────────────
     一首歌的獨立檔案空間（Song Archive）。過去點一首歌只有兩個結果：播放，
     或展開一份清單；這裡讓「歌」本身成為一份可以讀的檔案——頂部是檔案編號
     與題名（歌名／歌手／專輯／年份／時長），中間是唱片視覺，底部是歌詞與
     完整檔案兩個入口，再下面是從既有資料算出來的創作資訊。

     兩層模態的關係：檔案疊在專輯抽屜之上（抽屜仍開著，回來時還在原位），
     歌詞舞台再疊在檔案之上。三者都是 aria-modal，所以檔案開著時把底下的
     抽屜標成 aria-hidden，免得讀屏同時念到兩份內容。

     顏色：歌手層的 --accent 不動；檔案是「一張唱片」的表面，強調色取該張
     專輯派生的色（與抽屜面板同一條規則），封面的平均色另走 --amb 打光。 */
  var sarch, saPanel, saScroll, saCount, saNote, saPrevBtn, saNextBtn;
  var saRef = null; /* 檔案當前指向的那一首：{ album, n } */
  var saLastFocus = null;
  var saCloseTimer = 0;
  /* 收場的序號：關檔案的收尾要等淡出跑完（900ms），這期間可能又被打開。
     守衛**不能**用 saOpen()——那時 hidden 還是 false（正是等收尾才要設的），
     它會恆為真，於是收尾永遠提早 return、檔案再也收不掉。 */
  var saSeq = 0;

  function saOpen() {
    return !!sarch && !sarch.hidden;
  }

  /* 動態寫入的文字要先清掉 localize() 的原文快取，否則切換語言時會還原成
     上一首的歌名（與 syncPlayingRows 對 .pl-label 的做法同一條理由） */
  function setLive(node, text) {
    if (!node) return;
    var tn = node.firstChild;
    if (tn && tn.nodeType === 3) textOrig.delete(tn);
    node.textContent = text;
    localize(node);
  }

  /* 檔案編號：把整位歌手的目錄當成一冊卷宗，這首是第幾筆。
     song 紀錄已經帶了同一個數字（build.mjs 依全目錄順序編號），有就直接用；
     舊版資料沒有 song 時才自己數一遍，兩條路徑得到相同的值。 */
  function archiveNo(a, t) {
    if (t.song && t.song.no) return t.song.no;
    for (var i = 0; i < JC.tracks.length; i++) {
      var x = JC.tracks[i];
      if (x.album === a.id && String(x.n) === String(t.n)) return i + 1;
    }
    return 0;
  }

  /* 一首歌的檔案紀錄。新版資料每首歌自帶一份 song（欄位見 docs/ARCHITECTURE.md
     的契約節）；舊版 data.js 沒有這個欄位，所以缺什麼就從曲目與專輯就地補出
     同樣的形狀——HTML 更新而 JS 還是舊版（或反過來）時，畫面與從前一致，
     不會因為多讀一個不存在的欄位而整塊空白。 */
  function songOf(a, t) {
    if (t.song) return t.song;
    return {
      id: a.id + '-' + t.n,
      no: archiveNo(a, t),
      title: t.zh,
      artist: JC.name,
      album: a.title,
      albumId: a.id,
      year: a.year,
      duration: t.len,
      durationSec: t.sec,
      cover: a.cover
    };
  }

  /* 這首歌落在那個年代分期裡（分期由 meta.mjs 手寫、build.mjs 依年份歸戶） */
  function eraOfYear(y) {
    var list = JC.eras || [];
    for (var i = 0; i < list.length; i++) {
      if (y >= list[i].from && y <= list[i].to) return list[i];
    }
    return null;
  }

  /* 署名的顯示順序：四個規範角色在前（資料模型固定的欄位），
     其餘（混音／母帶／吉他…）依原樣接在後面 */
  var CREDIT_ROLES = [
    ['lyricist', '作詞'],
    ['composer', '作曲'],
    ['arranger', '編曲'],
    ['producer', '製作人']
  ];

  function creditRowsHTML(s) {
    var out = '';
    CREDIT_ROLES.forEach(function (r) {
      if (s[r[0]]) out += '<dt>' + r[1] + '</dt><dd>' + esc(s[r[0]]) + '</dd>';
    });
    /* 一首都沒有時仍留一列：署名是資料模型的一部分，空著要說清楚是「未收錄」 */
    return out || '<dt>署名</dt><dd>未收錄</dd>';
  }

  /* 其他署名（混音／母帶／吉他／OP…）整理成一行文字。
     這些值常帶著錄音室與城市（實測「Randy Merrill at Sterling Sound (New York, NY)」），
     塞進只有兩百多像素寬的署名欄會折成三四行，把底部兩個入口頂出首屏
     （實測 `.sa-acts` 底緣 845 → 1049）；所以它們走入口之後的補充區，
     那裡是整段寬度，最壞 8 條也只佔一段。 */
  function extraCreditsText(s) {
    return (s.credits || [])
      .map(function (c) {
        return c && c.role && c.name ? c.role + ' ' + c.name : '';
      })
      .filter(Boolean)
      .join('、');
  }

  /* 段落：標籤在上、本文在下（沿用專輯說明那套 .sa-blurb-tag） */
  function proseHTML(tag, text) {
    if (!text) return '';
    return '<p class="sa-prose"><span class="sa-blurb-tag">' + tag + '</span>' + esc(text) + '</p>';
  }

  /* 歌名裡的合唱標註：檔案已經在歌手欄寫了本尊，合作者另立一列 */
  function trackCollab(t) {
    var m = /\((?:feat\.|with)\s*([^)]+)\)/i.exec(t.zh || '');
    return m ? m[1].trim() : '';
  }

  function archiveHTML(a, t) {
    var pos = 1;
    a.tracks.forEach(function (x, i) {
      if (String(x.n) === String(t.n)) pos = i + 1;
    });
    var acc = archiveNo(a, t);
    var w = playWords(t);
    /* 這首在該專輯裡的長度位置：全部由曲目時長直接算，沒有估算值 */
    var sum = 0;
    a.tracks.forEach(function (x) {
      sum += x.sec || 0;
    });
    var avg = a.tracks.length ? Math.round(sum / a.tracks.length) : 0;
    var diff = avg && t.sec ? Math.round(t.sec - avg) : 0;
    var lenNote = !diff
      ? '與本輯平均相同'
      : diff > 0
        ? '比本輯平均長 ' + diff + ' 秒'
        : '比本輯平均短 ' + Math.abs(diff) + ' 秒';
    var collab = trackCollab(t);
    /* 歌曲的檔案紀錄：署名、逐曲文案與年代都在這裡。全部走 songOf() 的 fallback，
       缺欄位時（舊資料、未收錄）就少一列、少一段，不留空殼。 */
    var song = songOf(a, t);
    var era = song.year ? eraOfYear(song.year) : null;
    var story =
      proseHTML('其他署名', extraCreditsText(song)) +
      proseHTML('歌曲介紹', song.description) +
      proseHTML('創作背景', song.story) +
      (era ? proseHTML('時代背景 · ' + era.title + (era.en ? ' ' + era.en : ''), era.note) : '');
    return (
      '<div class="sa-inner">' +
      '<header class="sa-head">' +
      '<p class="sa-kicker">SONG ARCHIVE</p>' +
      '<p class="sa-access">NO. ' +
      String(acc ? acc : 0).padStart(3, '0') +
      ' / ' +
      JC.stats.tracks +
      ' · ' +
      esc(JC.en) +
      '</p>' +
      '<h2 class="sa-title" id="saTitle">' +
      esc(t.zh) +
      '</h2>' +
      '<p class="sa-by">' +
      esc(JC.name) +
      '</p>' +
      '<dl class="sa-key">' +
      '<div><dt>專輯</dt><dd>《' +
      esc(a.title) +
      (a.alt ? ' · ' + esc(a.alt) : '') +
      '》</dd></div>' +
      '<div><dt>年份</dt><dd>' +
      a.year +
      '</dd></div>' +
      '<div><dt>時長</dt><dd>' +
      esc(t.len) +
      '</dd></div>' +
      '</dl>' +
      '</header>' +
      /* 中間的視覺區：封面是實體，光影與唱片是氛圍。
         整區 aria-hidden，因為同樣的資訊在上面那張說明牌已經唸過一次。
         專輯說明跟著唱片走：它填的是唱片底下那塊空白，而左欄因此短一截，
         兩個入口才進得了首屏（實測 1440×900 下 1036 → 832 以內） */
      '<div class="sa-art">' +
      '<div class="sa-stage" aria-hidden="true">' +
      '<span class="sa-glow"></span>' +
      '<span class="sa-disc"></span>' +
      '<span class="sa-plate"><img src="assets/covers/responsive/' +
      a.id +
      '-480.jpg" srcset="' +
      srcset(a) +
      '" sizes="(max-width: 860px) 74vw, 30vw" alt="" decoding="async"></span>' +
      '</div>' +
      '<p class="sa-blurb"><span class="sa-blurb-tag">專輯說明</span>' +
      esc(a.blurb) +
      '</p>' +
      '</div>' +
      /* 創作資訊分兩欄：左邊是這首歌的事實（曲序、發行、出版…），
         右邊是署名（作詞、作曲、編曲、製作人與其他）。兩欄並排而不是接成一長串，
         才不會把底部的兩個入口推到折線以下（實測左欄已是較高的那一欄）。 */
      '<section class="sa-craft">' +
      '<h3 class="sa-h">創作資訊</h3>' +
      '<div class="sa-notes">' +
      '<dl class="sa-facts">' +
      '<dt>曲序</dt><dd>第 ' +
      pos +
      ' / ' +
      a.tracks.length +
      ' 首' +
      (t.disc > 1 ? '（第 ' + t.disc + ' 碟）' : '') +
      '</dd>' +
      '<dt>發行</dt><dd>' +
      esc(a.date) +
      '</dd>' +
      '<dt>出版</dt><dd>' +
      esc(a.publisher) +
      '</dd>' +
      '<dt>長度</dt><dd>' +
      esc(t.len) +
      ' · ' +
      lenNote +
      '</dd>' +
      '<dt>音源</dt><dd>' +
      w.mode +
      '</dd>' +
      '<dt>歌詞</dt><dd>' +
      (t.lyrics ? '已收錄本機歌詞' : '未收錄本機歌詞') +
      '</dd>' +
      (collab ? '<dt>合作</dt><dd>' + esc(collab) + '</dd>' : '') +
      (t.sig ? '<dt>選錄</dt><dd>本輯代表曲</dd>' : '') +
      '</dl>' +
      '<dl class="sa-credits">' +
      '<dt class="sa-credits-h">署名</dt>' +
      creditRowsHTML(song) +
      '</dl>' +
      '</div>' +
      '</section>' +
      /* 底部的入口：歌詞與完整檔案。文字型按鈕，不做彩色色塊 */
      '<div class="sa-acts">' +
      (t.audio
        ? '<button class="sa-act" type="button" data-sa-play>' +
          '<span class="sa-sym" aria-hidden="true">▶</span>' +
          w.verb +
          '</button>'
        : '') +
      '<button class="sa-act" type="button" data-sa-lyrics>閱讀歌詞' +
      '<span class="sa-sym" aria-hidden="true">→</span></button>' +
      '<button class="sa-act" type="button" data-sa-open>查看完整檔案' +
      '<span class="sa-sym" aria-hidden="true">→</span></button>' +
      '<p class="sa-note" id="saNote" role="status" aria-live="polite"></p>' +
      '</div>' +
      /* 讀物放在兩個入口之後：逐曲文案與時代背景是「往下讀」的內容，
         長度不可預期；放在入口之前，一填上文案就會把入口推下折線。 */
      (story ? '<section class="sa-story">' + story + '</section>' : '') +
      '</div>'
    );
  }

  /* 就地說明（不開空舞台、不彈 toast 蓋住檔案）。
     說明行在檔案底部，播放列一起來就會把它壓到折線下——說了等於沒說，
     所以寫入後把底部帶進視野（減少動效時直接跳，不做平滑捲動）。 */
  function saSay(msg) {
    setLive(saNote, msg || '');
    if (msg && saScroll) {
      saScroll.scrollTo({
        top: saScroll.scrollHeight,
        behavior: REDUCED.matches ? 'auto' : 'smooth'
      });
    }
  }

  function saPaintNav(hit) {
    var a = hit.album;
    var pos = 1;
    a.tracks.forEach(function (x, i) {
      if (String(x.n) === String(hit.track.n)) pos = i + 1;
    });
    setLive(saCount, '第 ' + pos + ' / ' + a.tracks.length + ' 首 · ' + a.title);
    if (saPrevBtn) saPrevBtn.disabled = pos <= 1;
    if (saNextBtn) saNextBtn.disabled = pos >= a.tracks.length;
  }

  /* silent：換首時不要把焦點從上一首／下一首鈕上搶走 */
  function openArchive(albumId, n, opts) {
    var hit = trackOf(albumId, n);
    if (!hit) return false;
    opts = opts || {};
    if (!sarch) {
      sarch = $('#sarch');
      if (!sarch) return false;
      saPanel = $('#saPanel', sarch);
      saScroll = $('#saScroll', sarch);
      saCount = $('#saCount', sarch);
      saNote = null;
    }
    if (saCloseTimer) {
      clearTimeout(saCloseTimer);
      saCloseTimer = 0;
    }
    /* 作廢上一次的收尾（它可能在淡出途中） */
    saSeq++;
    /* 回焦的目標只在「檔案本來不可見」時更新：換首（已可見）不該改動它，
       但淡出途中從另一列重開時要跟著換成新的那一列 */
    var wasHidden = sarch.hidden;
    var wasShown = sarch.classList.contains('is-open');
    if (!wasShown) saLastFocus = document.activeElement;
    saRef = { album: hit.album.id, n: hit.track.n };
    if (hit.album.theme) {
      saPanel.style.setProperty('--accent', hit.album.theme.accent);
      saPanel.style.setProperty('--accent-on', hit.album.theme.accentOn);
    }
    var amb = ambTriple(hit.album.sourceAvg);
    if (amb) saPanel.style.setProperty('--amb', amb);
    saScroll.innerHTML = archiveHTML(hit.album, hit.track);
    saNote = $('#saNote', saScroll);
    saPaintNav(hit);
    localize(saScroll);
    saScroll.scrollTop = 0;
    sarch.hidden = false;
    if (wasHidden) {
      /* 剛從 hidden 出來：先讓瀏覽器畫出起始態再上類別，
         否則起始與結束在同一幀，transition 會被合併掉直接跳到終態 */
      requestAnimationFrame(function () {
        sarch.classList.add('is-open');
      });
    } else if (!wasShown) {
      /* 淡出途中重開：過場本來就還在跑，直接補回類別就是「淡回來」。
         少了這一步，內容會換好卻停在透明態（最難察覺的一種壞法） */
      sarch.classList.add('is-open');
    }
    document.body.classList.add('is-locked');
    /* 底下那層抽屜還在：兩個 aria-modal 疊著會讓讀屏同時念到兩份內容 */
    if (sheet && !sheet.hidden) sheet.setAttribute('aria-hidden', 'true');
    if (!opts.silent) saPanel.focus({ preventScroll: true });
    return true;
  }

  /* instant：給「從檔案打開專輯」用——兩層模態直接換手，不要隔著一層淡出 */
  function closeArchive(opts) {
    if (!saOpen()) return;
    opts = opts || {};
    clearTimeout(saCloseTimer);
    saCloseTimer = 0;
    var token = ++saSeq;
    /* 收尾前先記住去處：saRef 馬上要清掉 */
    var back = saRef;
    sarch.classList.remove('is-open');
    saRef = null;
    /* 歌詞舞台待開的請求一起作廢：檔案關了就不該再自己彈回來 */
    if (window.JCLyrics) window.JCLyrics.cancel();
    if (sheet && !sheet.hidden) sheet.removeAttribute('aria-hidden');
    if (opts.instant) {
      sarch.hidden = true;
      saScroll.innerHTML = '';
    } else {
      saCloseTimer = setTimeout(function () {
        saCloseTimer = 0;
        if (token !== saSeq) return; /* 淡出期間又開過：這一輪作廢 */
        sarch.hidden = true;
        saScroll.innerHTML = '';
      }, 900);
    }
    /* 捲動鎖留給還在底下的抽屜 */
    if (!sheet || sheet.hidden) document.body.classList.remove('is-locked');
    if (opts.keepFocus) return;
    var target = saLastFocus;
    /* 從列的滑鼠捷徑進來時 activeElement 是 body（那三個動作不是可聚焦節點），
       這時把焦點還給同一列的歌名鈕，鍵盤使用者才不會被丟回頁首 */
    if ((!target || target === document.body) && back) {
      var key = back.album + ':' + back.n;
      target = $('[data-archive="' + key + '"]') || target;
    }
    if (target && target.focus) target.focus({ preventScroll: true });
  }

  /* 上一首／下一首只在這張專輯內走，走到頭就停（兩顆鈕各自 disabled） */
  function stepArchive(d) {
    if (!saRef) return;
    var a = albumById(saRef.album);
    if (!a) return;
    var i = -1;
    a.tracks.forEach(function (x, k) {
      if (String(x.n) === String(saRef.n)) i = k;
    });
    var k2 = i + d;
    if (k2 < 0 || k2 >= a.tracks.length) return;
    openArchive(a.id, a.tracks[k2].n, { silent: true });
  }

  /* 檔案的歌詞入口：先把這一首載進播放列（歌詞要跟著音訊走）再開舞台。
     沒有歌詞檔就地說明，不開一個空舞台。已在播的那一首不動播放狀態——
     plSelect 對同一首是「切換播放／暫停」，從檔案進來不該把歌停掉。 */
  function openLyricsFor(albumId, n, note) {
    var hit = trackOf(albumId, n);
    var say = note || toast;
    if (!hit || !hit.track.audio) {
      say('這首沒有可用的試聽片段');
      return false;
    }
    var same = plState.album === albumId && String(plState.n) === String(n);
    if (!same) plSelect(albumId, n);
    if (!window.JCLyrics) {
      say('歌詞舞台不在這一頁');
      return false;
    }
    return window.JCLyrics.openFor(hit.album.title, hit.track, say);
  }

  function bindArchive() {
    if (!sarch) sarch = $('#sarch');
    if (!sarch) return;
    saPanel = $('#saPanel', sarch);
    saScroll = $('#saScroll', sarch);
    saCount = $('#saCount', sarch);
    saPrevBtn = $('#saPrev', sarch);
    saNextBtn = $('#saNext', sarch);
    if (saPrevBtn)
      saPrevBtn.addEventListener('click', function () {
        stepArchive(-1);
      });
    if (saNextBtn)
      saNextBtn.addEventListener('click', function () {
        stepArchive(1);
      });

    /* 唱片的動態光影：與展櫃封面同一套做法（--px／--py 聚光位置），
       熱路徑只讀一次 getBoundingClientRect */
    var saRaf = 0,
      saEvt = null;
    saScroll.addEventListener(
      'pointermove',
      function (e) {
        if (REDUCED.matches || e.pointerType === 'touch') return;
        saEvt = e;
        if (saRaf) return;
        saRaf = requestAnimationFrame(function () {
          saRaf = 0;
          var ev = saEvt;
          if (!ev) return;
          var plate = $('.sa-plate', saScroll);
          if (!plate) return;
          var r = plate.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var fx = (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + '%';
          var fy = (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + '%';
          plate.style.setProperty('--px', fx);
          plate.style.setProperty('--py', fy);
        });
      },
      { passive: true }
    );

    /* 檔案是模態層：Esc 與方向鍵先給它，別讓底下的抽屜同時反應。
       這一支必須比歌詞舞台那一支先註冊（見 init 的呼叫順序），
       且舞台開著時整支讓路——鍵盤那時歸舞台（它自己處理 Esc）。
       capture 階段 stopPropagation 正好擋掉抽屜的冒泡處理器。 */
    document.addEventListener(
      'keydown',
      function (e) {
        if (!saOpen()) return;
        if (window.JCLyrics && window.JCLyrics.isOpen()) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          closeArchive();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          stepArchive(e.key === 'ArrowLeft' ? -1 : 1);
          return;
        }
        if (e.key === 'Tab') {
          e.stopPropagation();
          trapArchiveFocus(e);
        }
      },
      true
    );
  }

  function trapArchiveFocus(e) {
    var sel = 'button, [href], input, [tabindex]:not([tabindex="-1"])';
    var items = $$(sel, saPanel).filter(function (n) {
      return n.offsetParent !== null && !n.disabled;
    });
    if (!items.length) return;
    var first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* A small pull toward the cursor. Desktop pointers only, capped in px, and it
     never moves the element's layout box. The reference rect is cached on enter:
     measuring it per move would let the button chase its own translation and
     collapse the effect to nothing. */
  function magnetize(node, strength) {
    if (!node) return;
    if (window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return;
    var raf = 0,
      tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      rect = null;
    function step() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      node.style.setProperty('--mgx', cx.toFixed(2) + 'px');
      node.style.setProperty('--mgy', cy.toFixed(2) + 'px');
      raf = Math.abs(tx - cx) > 0.08 || Math.abs(ty - cy) > 0.08 ? requestAnimationFrame(step) : 0;
    }
    node.addEventListener('pointerenter', function () {
      rect = node.getBoundingClientRect();
    });
    window.addEventListener(
      'scroll',
      function () {
        rect = null;
      },
      { passive: true }
    );
    node.addEventListener('pointermove', function (e) {
      if (!rect) rect = node.getBoundingClientRect();
      tx = clamp(
        ((e.clientX - (rect.left + rect.width / 2)) / rect.width) * strength,
        -strength,
        strength
      );
      ty = clamp(
        ((e.clientY - (rect.top + rect.height / 2)) / rect.height) * strength,
        -strength,
        strength
      );
      if (!raf) raf = requestAnimationFrame(step);
    });
    node.addEventListener('pointerleave', function () {
      rect = null;
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(step);
    });
  }

  /* ── playback ────────────────────────────────────────────────────────────
     The audio is Apple's official 30 second preview clip, delivered in the
     same catalogue response as the rest of the metadata. No recording is
     copied into this project and nothing is scraped. If a clip cannot be
     fetched the controls simply stay disabled, so the page is unchanged
     offline. Local full-length files, if the listener owns them, take
     precedence via _data/local-audio.json and the preview becomes fallback. */
  var plAudio = null,
    plBar = null;
  var plState = { album: null, n: null, queue: [], qi: -1, loop: false, scrubbing: false };

  function clock(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  }
  function trackOf(albumId, n) {
    var a = albumById(albumId);
    if (!a) return null;
    for (var i = 0; i < a.tracks.length; i++) {
      if (String(a.tracks[i].n) === String(n)) return { album: a, track: a.tracks[i], pos: i };
    }
    return null;
  }
  function plKey() {
    return plState.album ? plState.album + ':' + plState.n : null;
  }

  /* Mirror play state onto every row control, including rows re-rendered by a
     search, and keep each label describing the action it will perform. */
  function syncPlayingRows() {
    var key = plKey();
    var playing = !!(plAudio && plAudio.src && !plAudio.paused && !plAudio.ended);
    $$('[data-play]').forEach(function (b) {
      var match = !!key && b.getAttribute('data-play') === key;
      var on = match && playing;
      b.classList.toggle('is-current', match);
      b.classList.toggle('is-playing', on);
      var row = b.closest ? b.closest('.cat-track, .sheet-track') : null;
      if (row) row.classList.toggle('is-current', match);
      /* 标签只留文字名：属性缓存由 localize() 首次见到时建立，
         这里若直接写繁体，切换语言会把它当原文还原，故写后清缓存并重新本地化 */
      var label = b.getAttribute('data-track') || '';
      /* 動作詞跟著音源型別：本機整首是「播放」，官方片段是「試聽」 */
      var verb = b.getAttribute('data-verb') || '試聽';
      dropAttr(b, 'aria-label');
      b.setAttribute('aria-label', (on ? '暫停 ' : verb + ' ') + label);
      localize(b);
      var text = b.querySelector('.pl-label');
      if (text && b.hasAttribute('data-idle')) {
        var want = on ? b.getAttribute('data-playing') : b.getAttribute('data-idle');
        if (text.textContent !== want) {
          var tn = text.firstChild;
          if (tn && tn.nodeType === 3) textOrig.delete(tn);
          text.textContent = want;
          localize(text);
        }
      }
    });
  }

  function plPaint(a, t) {
    var cov = $('#plCover');
    if (cov) {
      cov.src = 'assets/covers/responsive/' + a.id + '-480.jpg';
      cov.alt = a.title + ' 專輯封面';
    }
    var ti = $('#plTitle');
    if (ti) ti.textContent = t.zh;
    var idx = 0;
    a.tracks.forEach(function (x, i) {
      if (String(x.n) === String(t.n)) idx = i + 1;
    });
    var meta = $('#plMeta');
    if (meta) {
      meta.innerHTML = '<b>' + esc(a.title) + '</b> · 第 ' + idx + ' 首 · ' + playWords(t).mode;
      localize(meta);
    }
    ['#plRange', '#plPrev', '#plNext', '#plToggle'].forEach(function (s) {
      var el2 = $(s);
      if (el2) el2.disabled = false;
    });
  }

  function plShow() {
    if (!plBar) return;
    plBar.classList.add('is-up');
    document.body.classList.add('has-player');
  }

  function plPlay() {
    if (!plAudio || !plAudio.src) return;
    var p = plAudio.play();
    if (p && p.catch)
      p.catch(function () {
        /* refused or unreachable: stay paused */
      });
  }

  function plToggle() {
    if (!plAudio || !plAudio.src) return;
    if (plAudio.paused) plPlay();
    else plAudio.pause();
  }

  function plLoad(ref, autoplay) {
    if (!plAudio) return;
    var hit = trackOf(ref.albumId, ref.n);
    if (!hit || !hit.track.audio) {
      toast('這首沒有可用的試聽片段');
      return;
    }
    plState.album = ref.albumId;
    plState.n = ref.n;
    plAudio.src = hit.track.audio;
    plPaint(hit.album, hit.track);
    plShow();
    /* 歌詞隨曲目預載；舞台開著時載完會自動接上（見 js/lyrics.js） */
    if (window.JCLyrics) window.JCLyrics.loadFor(hit.album.title, hit.track);
    if (autoplay !== false) plPlay();
    syncPlayingRows();
    setMediaSession(hit.album, hit.track);
  }

  function plQueueFor(albumId) {
    var a = albumById(albumId);
    if (!a) return [];
    return a.tracks
      .filter(function (t) {
        return !!t.audio;
      })
      .map(function (t) {
        return { albumId: albumId, n: t.n };
      });
  }

  function plSelect(albumId, n) {
    var q = plQueueFor(albumId);
    var qi = -1;
    for (var i = 0; i < q.length; i++) {
      if (String(q[i].n) === String(n)) {
        qi = i;
        break;
      }
    }
    if (qi < 0) {
      toast('這首沒有可用的試聽片段');
      return;
    }
    var same = plState.album === albumId && String(plState.n) === String(n);
    plState.queue = q;
    plState.qi = qi;
    if (same && plAudio && plAudio.src) {
      plToggle();
      return;
    }
    plLoad(q[qi], true);
  }

  function plStep(d) {
    if (!plState.queue.length || !plAudio) return;
    var qi = plState.qi + d;
    if (qi < 0) {
      if (!plState.loop) {
        plAudio.currentTime = 0;
        plPlay();
        return;
      }
      qi = plState.queue.length - 1;
    }
    if (qi >= plState.queue.length) {
      if (!plState.loop) {
        plAudio.pause();
        plAudio.currentTime = 0;
        return;
      }
      qi = 0;
    }
    plState.qi = qi;
    plLoad(plState.queue[qi], true);
  }

  function plClose() {
    if (plAudio) {
      plAudio.pause();
      plAudio.removeAttribute('src');
      plAudio.load();
    }
    if (plBar) plBar.classList.remove('is-up', 'is-looping');
    document.body.classList.remove('has-player');
    /* 播放列關掉就沒有音源了，歌詞舞台一起收，否則會停在最後一句 */
    if (window.JCLyrics && window.JCLyrics.isOpen()) window.JCLyrics.close();
    plState = { album: null, n: null, queue: [], qi: -1, loop: false, scrubbing: false };
    ['#plRange', '#plPrev', '#plNext', '#plToggle'].forEach(function (s) {
      var el2 = $(s);
      if (el2) el2.disabled = true;
    });
    syncPlayingRows();
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
      } catch {
        /* 忽略 */
      }
    }
  }

  function setMediaSession(a, t) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.zh,
        artist: JC.name,
        album: a.title,
        artwork: [
          { src: new URL(a.cover, location.href).href, sizes: '1200x1200', type: 'image/jpeg' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', plPlay);
      navigator.mediaSession.setActionHandler('pause', function () {
        plAudio.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', function () {
        plStep(-1);
      });
      navigator.mediaSession.setActionHandler('nexttrack', function () {
        plStep(1);
      });
    } catch {
      /* 该浏览器不支持这个 action，忽略 */
    }
  }

  function initAudio() {
    plAudio = $('#plAudio');
    plBar = $('#player');
    if (!plAudio || !plBar) return;
    plAudio.preload = 'none';

    plAudio.addEventListener('play', function () {
      plBar.classList.add('is-playing');
      updateToggle();
      syncPlayingRows();
    });
    plAudio.addEventListener('pause', function () {
      plBar.classList.remove('is-playing');
      updateToggle();
      syncPlayingRows();
    });
    plAudio.addEventListener('ended', function () {
      plBar.classList.remove('is-playing');
      updateToggle();
      plStep(1);
    });
    plAudio.addEventListener('loadedmetadata', function () {
      var d = plAudio.duration;
      if (isFinite(d) && d > 0) {
        // clip lengths come back like 30.000998; round so the fill percentage
        // and the printed clock can never disagree by a fraction of a second
        d = Math.max(1, Math.round(d));
        var r = $('#plRange');
        if (r) {
          r.max = d;
          r.value = Math.min(plAudio.currentTime, d);
        }
        var dd = $('#plDur');
        if (dd) dd.textContent = clock(d);
        syncRangeFill();
      }
    });
    plAudio.addEventListener('timeupdate', function () {
      if (plState.scrubbing) return;
      var c = plAudio.currentTime || 0;
      var r = $('#plRange');
      if (r) {
        r.value = c;
      }
      syncRangeFill();
      var cur = $('#plCur');
      if (cur) cur.textContent = clock(c);
    });
    plAudio.addEventListener('error', function () {
      var hit = plState.album ? trackOf(plState.album, plState.n) : null;
      // a missing local file falls back to the preview before giving up
      if (
        hit &&
        hit.track.local &&
        hit.track.preview &&
        plAudio.src.indexOf(hit.track.preview) === -1
      ) {
        plAudio.src = hit.track.preview;
        plPlay();
        var m = $('#plMeta');
        if (m) {
          m.innerHTML = '<b>' + esc(hit.album.title) + '</b> · 本機檔案無法載入，已改用官方試聽';
          localize(m);
        }
        return;
      }
      var meta = $('#plMeta');
      if (meta) {
        meta.textContent = '這段試聽載入失敗，請檢查網路連線';
        localize(meta);
      }
      ['#plRange', '#plPrev', '#plNext', '#plToggle'].forEach(function (s) {
        var el2 = $(s);
        if (el2) el2.disabled = true;
      });
      syncPlayingRows();
    });

    function updateToggle() {
      var b = $('#plToggle');
      if (!b) return;
      var playing = !plAudio.paused && !!plAudio.src;
      b.setAttribute('aria-label', playing ? '暫停' : '播放');
      b.setAttribute('aria-pressed', String(playing));
    }
    initAudio.updateToggle = updateToggle;

    /* One place computes the fill, from the range's own max, so the painted
       progress can never drift from the printed clock. */
    function syncRangeFill() {
      var r = $('#plRange');
      if (!r) return;
      var max = parseFloat(r.max) || 30;
      var v = Math.min(Math.max(parseFloat(r.value) || 0, 0), max);
      r.style.setProperty('--p', ((v / max) * 100).toFixed(2) + '%');
    }
    initAudio.syncRangeFill = syncRangeFill;

    $('#plToggle').addEventListener('click', plToggle);
    $('#plPrev').addEventListener('click', function () {
      plStep(-1);
    });
    $('#plNext').addEventListener('click', function () {
      plStep(1);
    });
    $('#plLoop').addEventListener('click', function () {
      plState.loop = !plState.loop;
      this.setAttribute('aria-pressed', String(plState.loop));
      plBar.classList.toggle('is-looping', plState.loop);
    });
    $('#plClose').addEventListener('click', plClose);

    /* 全屏歌詞：開關按鈕與舞台本身都在 js/lyrics.js 里 */
    var lyricBtn = $('#plLyrics');
    if (lyricBtn && window.JCLyrics) {
      lyricBtn.addEventListener('click', function () {
        var on = window.JCLyrics.isOpen();
        if (on) window.JCLyrics.close();
        else {
          var hit = plState.album ? trackOf(plState.album, plState.n) : null;
          window.JCLyrics.open(hit ? hit.album.title : '', hit ? hit.track.zh : '');
        }
        lyricBtn.setAttribute('aria-pressed', String(!on));
        lyricBtn.setAttribute('aria-expanded', String(!on));
      });
      /* 舞台是模態層：Esc 先給它，避免同時把抽屜或歌手選單也關掉 */
      document.addEventListener(
        'keydown',
        function (e) {
          if (e.key !== 'Escape' || !window.JCLyrics.isOpen()) return;
          e.stopPropagation();
          e.preventDefault();
          window.JCLyrics.close();
          lyricBtn.setAttribute('aria-pressed', 'false');
          lyricBtn.setAttribute('aria-expanded', 'false');
        },
        true
      );
    }

    var range = $('#plRange');
    range.addEventListener('input', function () {
      plState.scrubbing = true;
      if (plAudio) plAudio.currentTime = parseFloat(range.value);
      var cur = $('#plCur');
      if (cur) cur.textContent = clock(parseFloat(range.value));
      syncRangeFill();
    });
    ['change', 'pointerup', 'keyup', 'blur'].forEach(function (ev) {
      range.addEventListener(ev, function () {
        plState.scrubbing = false;
        syncRangeFill();
      });
    });
    syncRangeFill();

    // a local file may only exist for some tracks: reflect that up front
    $$('[data-play]').forEach(function (b) {
      var parts = b.getAttribute('data-play').split(':');
      var hit = trackOf(parts[0], parts[1]);
      if (!hit || !hit.track.audio) b.disabled = true;
    });
  }

  /* ── toast ──────────────────────────────────────────────────────────── */ var toastEl,
    toastTimer;
  function toast(msg) {
    if (!toastEl) toastEl = $('#toast');
    toastEl.textContent = msg;
    toastEl.hidden = false;
    localize(toastEl);
    requestAnimationFrame(function () {
      toastEl.classList.add('is-on');
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on');
      setTimeout(function () {
        toastEl.hidden = true;
      }, 450);
    }, 3200);
  }

  /* ── artist chrome: fill every artist-specific slot from the data ─────
     The markup carries Jay Chou only as a fallback; everything visible that
     names the artist comes from the editorial layer, so a new artist needs
     no HTML edit. */
  function applyArtistChrome() {
    /* 主题令牌：歌手强调色覆盖页面默认值；母题与歌手 id 挂在根元素上，
       供 css/motifs.css 按值选用专属装饰。 */
    var rootStyle = document.documentElement.style;
    if (JC.theme) {
      if (JC.theme.accent) rootStyle.setProperty('--accent', JC.theme.accent);
      if (JC.theme.accentOn) rootStyle.setProperty('--accent-on', JC.theme.accentOn);
      document.documentElement.setAttribute('data-motif', JC.theme.motif || '');
    }
    document.documentElement.setAttribute('data-artist', JC.id);

    /* 拉丁名与中文类别之间补一个空格，避免「Taylor Swift录音室」这类粘连 */
    var nameGap = /[A-Za-z0-9]$/.test(JC.name) ? ' ' : '';
    document.title = '聲之年輪 · ' + JC.name + nameGap + JC.tagline;
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', JC.intro);

    /* 主视觉题名逐字渲染。题名是歌手本名，不自创名号 */
    var titleLine = $('#heroTitleLine');
    if (titleLine) {
      var title = (JC.theme && JC.theme.heroTitle) || JC.name;
      titleLine.textContent = '';
      title.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.textContent = ch;
        titleLine.appendChild(s);
      });
      /* 长题名与拉丁题名走小一号的字号档，避免溢出 */
      var titleHost = titleLine.parentElement;
      if (titleHost)
        titleHost.setAttribute('data-len', title.replace(/\s/g, '').length > 4 ? 'long' : 'short');
    }

    $$('.seal-char').forEach(function (t) {
      t.textContent = JC.seal;
    });

    var brandEn = $('#brandEn');
    if (brandEn) brandEn.textContent = JC.en + ' · ' + JC.taglineEn;

    var curName = $('#artistCurName');
    if (curName) curName.textContent = JC.name;

    /* 題名已是歌手名，副題不再重複它。拉丁名改由底下的檔案層（.ha-en）
       以銘牌字體呈現，這裡只留類別——否則同一個拉丁名會在首屏出現兩次 */
    var eyebrow = $('#heroEyebrow');
    if (eyebrow) eyebrow.textContent = JC.tagline;

    var line = $('#heroLine');
    if (line)
      line.textContent =
        '從 ' + JC.stats.from + ' 到 ' + JC.stats.to + '，' + JC.stats.albums + ' 張錄音室專輯。';

    /* ── 歌手檔案：說明牌的資訊層 ─────────────────────────────────────────
       名字底下原本只有副題與兩顆按鈕，其後是一片空白。按博物館說明牌的順序
       補上：拉丁名 → 年代與作品數 → 一句簡介。
       全部取自既有資料，不新增手寫欄位：
         en     meta.mjs 的拉丁名
         stats  構建期由曲目資料算出（張數、曲數、起訖年）
         intro  meta.mjs 的介紹，**只取末句**當那句簡介——intro 原本只餵
                meta description，頁面上看不見，這裡是既有文案的再利用。 */
    function lastSentence(text) {
      var parts = String(text || '').split('。');
      for (var i = parts.length - 1; i >= 0; i--) {
        var seg = parts[i].trim();
        if (seg) return seg;
      }
      return '';
    }

    var haEn = $('#haEn');
    if (haEn) haEn.textContent = JC.en || JC.name;
    var haMeta = $('#haMeta');
    if (haMeta)
      haMeta.textContent =
        JC.stats.from +
        ' 至 ' +
        JC.stats.to +
        ' · ' +
        JC.stats.albums +
        ' ALBUMS · ' +
        JC.stats.tracks +
        ' WORKS';
    var haNote = $('#haNote');
    if (haNote) haNote.textContent = lastSentence(JC.intro);

    /* 作品年表軸：把整個目錄壓成一把尺——橫向細軌、每張專輯一道刻痕、
       每個階段起點一顆圓點與年份。位置 = (year − from) / (to − from)，
       由這裡算好寫進 --p，CSS 只負責畫（不在樣式表裡做年份運算）。
       首尾兩段的標籤要往內收才不會溢出軸外，由 is-first／is-last 標記。
       刻痕與圓點對讀屏是噪音，整條軸用 aria-label 交代。 */
    var axis = $('#heroAxis');
    if (axis) {
      var from = JC.stats.from;
      var to = JC.stats.to;
      var spanY = Math.max(1, to - from);
      var at = function (y) {
        return (((y - from) / spanY) * 100).toFixed(2) + '%';
      };
      var axisHTML = '';
      ALBUMS.forEach(function (a) {
        axisHTML += '<li class="ha-alb" style="--p:' + at(a.year) + '" aria-hidden="true"></li>';
      });
      JC.eras.forEach(function (e, i) {
        var cls = i === 0 ? ' is-first' : '';
        axisHTML +=
          '<li class="ha-era' +
          cls +
          '" style="--p:' +
          at(e.from) +
          '">' +
          '<span class="ha-dot" aria-hidden="true"></span>' +
          '<span class="ha-year">' +
          e.from +
          '</span>' +
          '<span class="ha-title">' +
          esc(e.title) +
          '</span></li>';
      });
      /* 最後一個階段的結束年：只有當它與該階段起點不同年時才另立一個標記，
         否則會與該階段自己的標籤疊在同一個位置上 */
      var lastEra = JC.eras[JC.eras.length - 1];
      if (lastEra && lastEra.to > lastEra.from) {
        axisHTML +=
          '<li class="ha-era is-last" style="--p:100%">' +
          '<span class="ha-dot" aria-hidden="true"></span>' +
          '<span class="ha-year">' +
          lastEra.to +
          '</span></li>';
      }
      axis.innerHTML = axisHTML;
      axis.setAttribute(
        'aria-label',
        '作品年表軸：' +
          from +
          ' 至 ' +
          to +
          '，' +
          ALBUMS.length +
          ' 張專輯分為 ' +
          JC.eras.length +
          ' 個階段'
      );
    }

    var ogTitle = $('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', document.title);

    /* 页面上每一处写出「这位歌手有几个数字」的静态槽位都在这里从数据填，
       否则别的歌手页会残留上一位歌手的专辑数、曲目数与年份 */
    function fill(sel, text) {
      var node = $(sel);
      if (node) node.textContent = text;
    }
    var albumsN = JC.stats.albums;
    var spanN = JC.stats.to - JC.stats.from + 1;
    var years = JC.stats.from + ' 至 ' + JC.stats.to;

    var ogDesc = $('#ogDescription');
    if (ogDesc)
      ogDesc.setAttribute(
        'content',
        albumsN + ' 張錄音室專輯，' + JC.stats.tracks + ' 首作品，' + years + '。'
      );
    fill('#rackSub', albumsN + ' 張，按發行順序排列');
    fill('#rackTotal', String(albumsN));
    fill('#chronoSub', years);
    fill('#erasSub', albumsN + ' 張專輯分成 ' + JC.eras.length + ' 個階段，看不同時期的取捨');
    fill('#wallSub', albumsN + ' 張封面一次排開，點任一張進入專輯');
    fill('#growthNote', '每發一張專輯往上疊，' + spanN + ' 年的總量曲線');
    fill('#footTag', albumsN + ' 張錄音室專輯 · ' + JC.stats.tracks + ' 首作品 · ' + years);

    var legendEl = $('#ringsLegend');
    if (legendEl) legendEl.setAttribute('aria-label', '年輪對照：' + albumsN + ' 張專輯');

    /* the switcher lists every artist, current one marked */
    var menu = $('#artistMenu');
    if (!menu) return;
    var html = DISCOGRAPHY.order.map(function (id) {
      var a = DISCOGRAPHY.artists[id];
      var cur = id === JC.id;
      return (
        '<a class="am-item' +
        (cur ? ' is-cur' : '') +
        '" role="menuitemradio" aria-checked="' +
        cur +
        '"' +
        ' href="artist.html?a=' +
        encodeURIComponent(id) +
        '">' +
        '<span class="am-seal" aria-hidden="true">' +
        a.seal +
        '</span>' +
        '<span class="am-name">' +
        esc(a.name) +
        '</span>' +
        '<span class="am-meta">' +
        a.stats.albums +
        ' 張 · ' +
        a.stats.from +
        '–' +
        a.stats.to +
        '</span>' +
        (cur
          ? '<svg class="ico" viewBox="0 0 256 256" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>'
          : '') +
        '</a>'
      );
    });
    html.push(
      '<a class="am-item am-all" role="menuitem" href="index.html">' +
        '<span class="am-seal" aria-hidden="true">聲</span>' +
        '<span class="am-name">所有歌手</span>' +
        '<span class="am-meta">回到入口</span></a>'
    );
    /* 窄屏专用工具项：顶栏放不下时，简繁与随机入口落在选单里 */
    var rw = randomWords();
    var rbtn = $('#randomBtn');
    if (rbtn) {
      dropAttr(rbtn, 'aria-label');
      rbtn.setAttribute('aria-label', '隨機' + rw.verb + '一首曲目');
    }
    fill('#randomLabel', '隨機' + rw.verb);
    html.push(
      '<button class="am-item am-tool" type="button" role="menuitem" data-tool="lang">' +
        '<span class="am-seal" aria-hidden="true">文</span>' +
        '<span class="am-name">切換繁簡</span>' +
        '<span class="am-meta" id="amLangState">' +
        (lang === 's' ? '簡' : '繁') +
        '</span></button>' +
        '<button class="am-item am-tool" type="button" role="menuitem" data-tool="random">' +
        '<span class="am-seal" aria-hidden="true">隨</span>' +
        '<span class="am-name">隨機' +
        rw.verb +
        '</span>' +
        '<span class="am-meta">' +
        (rw.local ? '整首' : '30 秒') +
        '</span></button>'
    );
    menu.innerHTML = html.join('');
  }

  function bindArtistSwitch() {
    var btn = $('#artistBtn'),
      wrap = $('#artistSwitch'),
      menu = $('#artistMenu');
    if (!btn || !menu) return;
    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      if (open) {
        var first = $('.am-item', menu);
        if (first) first.focus();
      } else if (document.activeElement && menu.contains(document.activeElement)) {
        btn.focus();
      }
    }
    btn.addEventListener('click', function () {
      setOpen(menu.hidden);
    });
    document.addEventListener('click', function (e) {
      if (menu.hidden) return;
      if (wrap && wrap.contains(e.target)) return;
      setOpen(false);
    });
    /* 窄屏工具项：与顶栏按钮同一套动作，不复制逻辑 */
    menu.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tool]') : null;
      if (!t) return;
      var act = t.getAttribute('data-tool');
      setOpen(false);
      if (act === 'lang') setLang(lang === 's' ? 't' : 's');
      else if (act === 'random') pickRandom();
    });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.am-item') : null;
      if (!item) return;
      var href = item.getAttribute('href') || '';
      /* 歌手項目改為就地切換：不整頁重載，正在播的歌因此不中斷。
         「所有歌手」是回入口頁，維持原本的導航。 */
      var m = /artist\.html\?a=([^&]+)/.exec(href);
      if (m) {
        e.preventDefault();
        setOpen(false);
        applyArtist(decodeURIComponent(m[1]));
        return;
      }
      setOpen(false);
    });
    /* 上一頁／下一頁也要跟著換歌手（不重載） */
    window.addEventListener('popstate', function (e) {
      var id = (e.state && e.state.a) || new URLSearchParams(location.search).get('a');
      if (id && DISCOGRAPHY.artists[id] && id !== JC.id) applyArtist(id, { silent: true });
    });
  }

  /* ── chrome: scroll bar, topbar, nav state ──────────────────────────── */
  /* ── catalog views: 展櫃／封面牆／年表看同一批專輯 ────────────────────── */
  var CAT_VIEWS = ['rack', 'wall', 'chrono'];
  function setCatView(name, silent) {
    if (CAT_VIEWS.indexOf(name) < 0) name = 'rack';
    CAT_VIEWS.forEach(function (v) {
      var panel = document.getElementById('view-' + v);
      if (panel) panel.hidden = v !== name;
      var btn = $('.cv-btn[data-view="' + v + '"]');
      if (btn) btn.setAttribute('aria-selected', String(v === name));
    });
    try {
      localStorage.setItem('jc-view', name);
    } catch {
      /* 隐私模式下写入会抛错，忽略 */
    }
    /* 展櫃依赖宽度测量；切回来时重量一次 */
    if (name === 'rack' && !silent) {
      requestAnimationFrame(function () {
        measureRack();
        marqueeRoom = 0;
      });
    }
  }

  function bindCatViews() {
    var host = $('#catViews');
    if (!host) return;
    host.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-view]') : null;
      if (b) setCatView(b.getAttribute('data-view'));
    });
    /* 键盘左右键在视图间移动 */
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var btns = $$('.cv-btn');
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      next.focus();
      setCatView(next.getAttribute('data-view'));
    });
    var saved = 'rack';
    try {
      saved = localStorage.getItem('jc-view') || 'rack';
    } catch {
      saved = 'rack';
    }
    setCatView(saved, true);
  }

  /* 把某一首帶進頂欄與播放列之間的可見區域；總表列存在時定位到列本身，
     否則退回整個總表 */
  function revealTrack(albumId, n) {
    var row = $('.cat-track [data-play="' + albumId + ':' + n + '"]');
    var li = row && row.closest ? row.closest('.cat-track') : null;
    var target = li || $('#tracks');
    if (!target) return;
    target.scrollIntoView({
      behavior: REDUCED.matches ? 'auto' : 'smooth',
      block: li ? 'center' : 'start'
    });
  }

  /* ── random: 顶栏按钮与窄屏选单共用 ─────────────────────────────────── */
  function pickRandom() {
    var pool = JC.tracks.filter(function (t) {
      return !!t.audio;
    });
    if (!pool.length) {
      toast('這位歌手目前沒有可試聽的曲目');
      return;
    }
    var t = pool[Math.floor(Math.random() * pool.length)];
    /* 播放并定位到曲目总表那一行，而不是弹抽屉挡在前面；
       目录视图保持用户当前的选择——随机试听的目标是曲目总表，
       它不在三视图内，切视图只会打断用户的浏览位置 */
    plSelect(t.album, t.n);
    /* 搜尋條件可能把這一首篩掉了：先還原完整清單，否則定位不到那一行，
       播放位置會被留在被篩選隱藏的地方 */
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      renderCat('');
    }
    revealTrack(t.album, t.n);
    toast('隨機' + playWords(t).verb + '：' + t.zh + '（' + t.albumTitle + '）');
  }

  /* ── chapters: 窄屏的章节跳转（桌面導覽在 <=860px 隱藏） ─────────────── */
  function renderChapters() {
    var host = $('#chapters');
    if (!host) return;
    var links = $$('.nav a');
    if (!links.length) return;
    var f = frag();
    links.forEach(function (a) {
      var b = el('button', 'ch-btn', esc(a.textContent));
      b.type = 'button';
      b.setAttribute('data-chapter', a.getAttribute('data-nav'));
      f.appendChild(b);
    });
    host.appendChild(f);
    host.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-chapter]') : null;
      if (!t) return;
      var target = document.getElementById(t.getAttribute('data-chapter'));
      if (target)
        target.scrollIntoView({ behavior: REDUCED.matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function paintChapters(id) {
    $$('.ch-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-chapter') === id);
      b.setAttribute('aria-current', b.getAttribute('data-chapter') === id ? 'true' : 'false');
    });
  }

  function bindChrome() {
    var bar = $('#scrollBar'),
      topbar = $('#topbar');
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
        bar.style.transform = 'scaleX(' + p + ')';
        topbar.classList.toggle('is-stuck', window.scrollY > 24);
        paintRackFromScroll();
        marqueePan();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window) {
      var links = $$('.nav a');
      var so = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var id = e.target.id;
            links.forEach(function (l) {
              l.classList.toggle('is-active', l.getAttribute('data-nav') === id);
            });
            paintChapters(id);
          });
        },
        { rootMargin: '-45% 0px -50% 0px' }
      );
      ['rings', 'albums', 'eras', 'data', 'tracks'].forEach(function (id) {
        var s = document.getElementById(id);
        if (s) so.observe(s);
      });
    }
  }

  /* ── wiring ─────────────────────────────────────────────────────────── */
  function bind() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      /* 歌曲檔案（Song Archive）的內部件先判：它疊在頁面之上，
         底下的 data-open／data-play 都不該被同一點擊順手觸發 */
      if (e.target.closest('[data-sa-close]')) {
        closeArchive();
        return;
      }
      var saPlay = e.target.closest('[data-sa-play]');
      if (saPlay && saRef) {
        plSelect(saRef.album, saRef.n);
        return;
      }
      var saLy = e.target.closest('[data-sa-lyrics]');
      if (saLy && saRef) {
        openLyricsFor(saRef.album, saRef.n, saSay);
        return;
      }
      var saAlbum = e.target.closest('[data-sa-open]');
      if (saAlbum && saRef) {
        var saGo = saRef.album;
        /* 兩層模態直接換手：檔案的墨幕退掉與抽屜的進場同時發生，
           否則淡出那 900ms 會蓋在剛開好的抽屜上 */
        closeArchive({ instant: true });
        openSheet(saGo);
        return;
      }
      // playback takes precedence: the row controls live inside list rows
      var play = e.target.closest('[data-play]');
      if (play) {
        if (play.disabled) return;
        var parts = play.getAttribute('data-play').split(':');
        plSelect(parts[0], parts[1]);
        return;
      }
      /* 歌名列：進歌曲檔案。列上的 hover 動作是同一個出口的指標捷徑 */
      var arch = e.target.closest('[data-archive]');
      if (arch) {
        var ap = arch.getAttribute('data-archive').split(':');
        openArchive(ap[0], ap[1]);
        return;
      }
      var archLy = e.target.closest('[data-archive-lyrics]');
      if (archLy) {
        var al = archLy.getAttribute('data-archive-lyrics').split(':');
        openLyricsFor(al[0], al[1]);
        return;
      }
      var all = e.target.closest('[data-playall]');
      if (all) {
        var id = all.getAttribute('data-playall');
        var q = plQueueFor(id);
        if (!q.length) {
          toast('這張沒有可用的試聽片段');
          return;
        }
        plState.queue = q;
        plState.qi = 0;
        plLoad(q[0], true);
        return;
      }
      var opener = e.target.closest('[data-open]');
      if (opener) {
        openSheet(opener.getAttribute('data-open'));
        return;
      }
      if (e.target.closest('[data-close]')) closeSheet();
    });

    // Space toggles playback, unless the listener is typing or on a button
    // (where Space already means "activate").
    document.addEventListener('keydown', function (e) {
      if (e.code !== 'Space' && e.key !== ' ') return;
      var t = e.target;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'BUTTON' ||
          t.tagName === 'A' ||
          t.isContentEditable)
      )
        return;
      if (!plAudio || !plAudio.src) return;
      e.preventDefault();
      plToggle();
    });

    // Enter activates the rows that are role="button" rather than a real
    // <button>: the chart bars, the gap rows and the collaborator rows.
    // (Space is reserved for play/pause, handled above.)
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var t = e.target;
      if (
        !t ||
        !t.getAttribute ||
        t.tagName === 'BUTTON' ||
        t.tagName === 'A' ||
        t.tagName === 'INPUT'
      )
        return;
      var opener = t.closest ? t.closest('[data-open]') : null;
      if (!opener) return;
      e.preventDefault();
      openSheet(opener.getAttribute('data-open'));
    });

    if (sheet) {
      $('#sheetPrev').addEventListener('click', function () {
        stepSheet(-1);
      });
      $('#sheetNext').addEventListener('click', function () {
        stepSheet(1);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!sheet || sheet.hidden) return;
      if (e.key === 'Escape') {
        closeSheet();
      } else if (e.key === 'ArrowLeft') {
        stepSheet(-1);
      } else if (e.key === 'ArrowRight') {
        stepSheet(1);
      } else trapFocus(e);
    });

    // language
    $('#langToggle').addEventListener('click', function () {
      setLang(lang === 's' ? 't' : 's');
    });

    // random track -> opens its album
    $('#randomBtn').addEventListener('click', pickRandom);

    // search
    var t0 = 0;
    searchInput.addEventListener('input', function () {
      clearTimeout(t0);
      var v = searchInput.value;
      t0 = setTimeout(function () {
        renderCat(v);
      }, 90);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        renderCat('');
      }
    });
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      renderCat('');
      searchInput.focus();
    });
    $('#emptyReset').addEventListener('click', function () {
      searchInput.value = '';
      renderCat('');
      searchInput.focus();
    });

    // rack: native horizontal scroll — page scroll is never hijacked
    /* 整段包在守衛內：HTML 更新而 JS 還是被快取的舊版時（見 AGENTS 的活躍坑），
       少一顆節點不該讓後面的初始化全部中斷 */
    if (rackViewport && rackTrack) {
      var rackRaf = 0;
      rackViewport.addEventListener(
        'scroll',
        function () {
          if (rackRaf) return;
          rackRaf = requestAnimationFrame(function () {
            rackRaf = 0;
            paintRackFromScroll();
          });
        },
        { passive: true }
      );
      if (rackPrev)
        rackPrev.addEventListener('click', function () {
          rackStepBy(-1);
        });
      if (rackNext)
        rackNext.addEventListener('click', function () {
          rackStepBy(1);
        });
      rackViewport.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          rackStepBy(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          rackStepBy(1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          rackScrollTo(0, true);
        } else if (e.key === 'End') {
          e.preventDefault();
          rackScrollTo(rackViewport.scrollWidth - rackViewport.clientWidth, true);
        }
      });

      /* 滑鼠拖曳：桌機使用者沒有觸控，這是除了箭頭以外最直覺的橫向瀏覽。
         位移門檻 6px 之後才進入拖曳，避免單純點封面也被當成拖動。
         指標在視窗外放開時不會有 click，所以不能用「拖過的布林旗標」吞點擊；
         改成比對按下點與放開點的實際位移（見下方 click 守衛）。 */
      var rackDragging = false,
        rackDragX = 0,
        rackDragLeft = 0,
        rackDragMax = 0,
        rackDragMoved = false,
        rackDragRaf = 0,
        rackDragTo = 0;
      function applyRackDrag() {
        rackDragRaf = 0;
        /* 拖曳中夾在同一個 max 內：這裡只寫不讀版面，符合熱路徑約定 */
        rackViewport.scrollLeft = clamp(rackDragLeft - rackDragTo, 0, rackDragMax);
      }
      rackViewport.addEventListener('pointerdown', function (e) {
        /* 不論滑鼠或觸控都先清掉上一次的拖曳殘留，否則那個旗標會吞掉下一次點擊 */
        rackDragMoved = false;
        if (e.pointerType === 'touch' || e.button !== 0) return;
        rackDragging = true;
        rackDragX = e.clientX;
        rackDragLeft = rackViewport.scrollLeft;
        rackDragMax = rackViewport.scrollWidth - rackViewport.clientWidth;
      });
      rackViewport.addEventListener(
        'pointermove',
        function (e) {
          if (!rackDragging) return;
          var d = e.clientX - rackDragX;
          if (!rackDragMoved && Math.abs(d) < 6) return;
          if (!rackDragMoved) {
            rackDragMoved = true;
            rackViewport.classList.add('is-dragging');
            try {
              rackViewport.setPointerCapture(e.pointerId);
            } catch {
              /* 不支援指標捕獲時仍可拖曳 */
            }
          }
          e.preventDefault();
          rackDragTo = d;
          if (!rackDragRaf) rackDragRaf = requestAnimationFrame(applyRackDrag);
        },
        { passive: false }
      );
      function rackDragEnd(e) {
        if (!rackDragging) return;
        rackDragging = false;
        rackViewport.classList.remove('is-dragging');
        if (rackDragMoved) {
          try {
            rackViewport.releasePointerCapture(e.pointerId);
          } catch {
            /* 已釋放或未捕獲 */
          }
        }
      }
      rackViewport.addEventListener('pointerup', rackDragEnd);
      rackViewport.addEventListener('pointercancel', rackDragEnd);
      /* 拖曳結束後緊接的那次 click 不該被當成「點封面開抽屜」：
         只有在「真的移動超過門檻」且是滑鼠產生（detail > 0）時才攔下 */
      rackViewport.addEventListener(
        'click',
        function (e) {
          if (!rackDragMoved || e.detail === 0) return;
          if (Math.abs(e.clientX - rackDragX) < 6) return;
          e.preventDefault();
          e.stopPropagation();
          rackDragMoved = false;
        },
        true
      );
    }

    /* Pointer-tracked sheen on the sleeves, and a 6px magnetic pull on the
       primary CTA. Both write custom properties inside a rAF so no layout is
       read on the hot path.

       封面懸停：同一條 rAF 兼管展櫃（.album-hit）與封面牆（.wall-tile），
       一次只會有一處被掠過，所以共用一個排程與一組座標即可。
       寫入三個自訂屬性：
         --px / --py 聚光位置（既有契約，兩處封面共用）
         --rx / --ry 微傾角度，上限 2.2deg——再大就從「拿起唱片」變成「翻牌」
       角度用「指標偏向哪一側，那一側就往前抬」的規則：
       游標在左半（fx < .5）時卡片右緣往後退，等於左緣朝觀者抬起。
       熱路徑只讀一次 getBoundingClientRect，其餘都是算術。 */
    var spotRaf = 0,
      spotEvt = null,
      TILT = 2.2;
    function bindSleeve(host) {
      if (!host) return;
      host.addEventListener(
        'pointermove',
        function (e) {
          if (REDUCED.matches || e.pointerType === 'touch') return;
          spotEvt = e;
          if (spotRaf) return;
          spotRaf = requestAnimationFrame(function () {
            spotRaf = 0;
            var ev = spotEvt;
            if (!ev) return;
            var t = ev.target;
            var tile = t && t.closest ? t.closest('.album-hit, .wall-tile') : null;
            if (!tile) return;
            var plate = $('.album-plate', tile) || $('.wt-plate', tile);
            if (!plate) return;
            var r = plate.getBoundingClientRect();
            if (!r.width || !r.height) return;
            var fx = (ev.clientX - r.left) / r.width;
            var fy = (ev.clientY - r.top) / r.height;
            plate.style.setProperty('--px', (fx * 100).toFixed(1) + '%');
            plate.style.setProperty('--py', (fy * 100).toFixed(1) + '%');
            plate.style.setProperty('--ry', ((0.5 - fx) * 2 * TILT).toFixed(2) + 'deg');
            plate.style.setProperty('--rx', ((fy - 0.5) * 2 * TILT).toFixed(2) + 'deg');
          });
        },
        { passive: true }
      );
      /* 離開整片區域要回正：不清自訂屬性，卡片會停在最後那個角度 */
      host.addEventListener('pointerleave', function () {
        $$('.album-plate, .wt-plate', host).forEach(function (p) {
          p.style.removeProperty('--rx');
          p.style.removeProperty('--ry');
        });
      });
    }
    bindSleeve(rackTrack);
    bindSleeve($('#wallGrid'));

    magnetize($('.hero-cta .btn-accent'), 6);

    // resizing
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        measureRack();
        marqueeRoom = 0;
        marqueePan();
      }, 140);
    });

    var mq = window.matchMedia('(min-width: 861px) and (prefers-reduced-motion: no-preference)');
    var onMq = function () {
      measureRack();
    };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else mq.addListener(onMq);
  }

  /* ── go ─────────────────────────────────────────────────────────────── */
  function init() {
    try {
      lang = localStorage.getItem('jc-lang') || 's';
    } catch {
      lang = 's';
    }

    renderAll();
    /* 模態層的 Esc 有先後：歌曲檔案的處理器要在歌詞舞台之前註冊，
       舞台開著時檔案讓路（見 bindArchive）。舞台那一支在 initAudio 裡。 */
    bindArchive();
    initAudio();

    // sheet nodes must exist before bind()
    sheet = $('#sheet');
    sheetPanel = $('.sheet-panel', sheet);
    sheetScroll = $('#sheetScroll');
    toastEl = $('#toast');

    bind();
    bindChrome();
    bindCatViews();
    bindArtistSwitch();
    applyArtistChrome();
    setLang(lang);
    observeReveals(document);

    var stamp = $('#buildStamp');
    if (stamp) stamp.textContent = new Date().toISOString().slice(0, 10);

    runBoot();
    window.addEventListener('load', function () {
      measureRack();
      marqueeRoom = 0; // webfonts change the band width
      marqueePan();
    });
  }

  /* 一位歌手的全部展示面。init() 與就地換歌手（applyArtist）共用同一條路徑，
     避免兩份渲染清單走樣。呼叫前必須先清掉 appendChild 型宿主（見 resetHosts）。 */
  function renderAll() {
    renderFan();
    renderFigures();
    renderMarquee();
    renderRings();
    renderRack();
    renderChrono();
    renderEras();
    renderWall();
    renderGrowth();
    renderGaps();
    renderBars();
    renderFacts();
    renderRanks();
    renderCollab();
    /* 这位歌手的曲目不用 feat./with 标注时没有合作者可列：整段收起；
       換到有合作者的歌手時要重新展開，否則會停在上一位的收起狀態 */
    var collab = $('#collab');
    if (collab) collab.hidden = !JC.collaborators.length;
    renderPicks();
    renderCatBase();
    renderChapters();
  }

  /* 這些宿主是 appendChild 型（不清空就重跑會愈疊愈多）。實測第一次換歌手後
     曲目表 126→301、卷宗 10→26、年表 10→26、年代 3→7、精選 35→73，都是同一原因。
     其餘渲染器用 innerHTML= 自己覆蓋，不必也不該先清。 */
  var APPEND_HOSTS = [
    'heroArt',
    'figuresRow',
    'marqueeTrack',
    'dataFacts',
    'gapPeak',
    'chapters',
    'catList',
    'rackTrack',
    'chronoList',
    'erasList',
    'wallGrid',
    'picksList',
    'ringsLegend'
  ];
  function resetHosts() {
    APPEND_HOSTS.forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.textContent = '';
    });
    fanCards = [];
    cards = [];
    ringNodes = [];
    legendNodes = [];
    ringsLive = -1; /* 讓 setRingLive(0) 不被去重守衛擋掉 */
    marqueeRoom = 0;
    /* 換片狀態機也要收：見 resetFanShift 的說明 */
    resetFanShift();
  }

  /* 就地換歌手：只換資料與畫面，**不動 <audio>**，所以換歌手時正在播的歌不會中斷。
     先前是 location.href 整頁重載，播放當然停。 */
  function applyArtist(id, opts) {
    var next = DISCOGRAPHY && DISCOGRAPHY.artists[id];
    if (!next || next === JC) return false;
    opts = opts || {};
    /* 檔案是「某一位歌手的某一首歌」：換歌手時就地收起，
       免得它指著上一份目錄（還開著的話，內容與播放列會分屬兩位歌手） */
    if (saOpen()) closeArchive({ instant: true, keepFocus: true });
    JC = next;
    ALBUMS = JC.albums;
    resetHosts();
    renderAll();
    applyArtistChrome();
    setLang(lang);
    observeReveals(document);
    measureRack();
    marqueePan();
    /* 曲目表重建後，正在播的那一列要重新標成播放中；播放列的資訊保留
       （那是正在播的歌，不因切歌手而清空） */
    syncPlayingRows();
    if (!opts.silent) {
      try {
        history.pushState({ a: id }, '', 'artist.html?a=' + encodeURIComponent(id));
      } catch {
        /* file:// 下部分瀏覽器會拒絕 pushState：忽略，畫面已切換 */
      }
    }
    return true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
