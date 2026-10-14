/* ============================================================================
   landing.js · 聲之年輪入口頁（立體唱片架）
   Renders the artist shelf from window.DISCOGRAPHY and converts its own copy
   with the same OpenCC tables embedded in data.js. Kept deliberately small:
   app.js 的 localize 屬於歌手頁的 IIFE，這裡不引入整個渲染器。

   資料與狀態的唯一來源：歌手清單順序取自 DISCOGRAPHY.order，
   選擇以最小環形位移決定舞台位置，切換只更新狀態、不重建 DOM。
   ========================================================================= */
(function () {
  'use strict';

  var D = window.DISCOGRAPHY;
  var shelf = document.getElementById('ldShelf');
  var emptyEl = document.getElementById('ldEmpty');

  /* 0 位歌手：顯示可讀空狀態，收起整個唱片架 */
  if (!D || !D.order || !D.order.length) {
    if (shelf) shelf.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var ATTRS = ['aria-label'];
  var STORE_KEY = 'discography-selected-artist';
  var N = D.order.length;

  var lang = 's';
  try {
    lang = localStorage.getItem('jc-lang') || 's';
  } catch {
    lang = 's';
  }

  /* 動效偏好：入場與歌手過場都由 CSS 承擔，這裡只決定要不要排隊等待 */
  var reduceMotion = !!(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  function conv(text) {
    return lang === 's' ? D.toSimplified(text) : text;
  }

  /* 原文快取以節點為鍵。動態寫入一律走 setText / setAttr：
     切換歌手後又切語言時，才不會把上一位歌手的原文還原回來。 */
  var orig = new WeakMap();

  function setText(node, traditional) {
    orig.set(node, traditional);
    node.nodeValue = conv(traditional);
  }

  function setAttr(el, name, traditional) {
    var store = orig.get(el) || {};
    store[name] = traditional;
    orig.set(el, store);
    el.setAttribute(name, conv(traditional));
  }

  function localizeNode(node) {
    if (node.nodeType !== 3) return;
    if (orig.has(node)) {
      node.nodeValue = conv(orig.get(node));
      return;
    }
    var text = node.nodeValue;
    if (!text || !text.trim()) return;
    orig.set(node, text);
    node.nodeValue = conv(text);
  }

  function walk(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) localizeNode(walker.currentNode);
    Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function (el) {
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var store = orig.get(el);
        if (store && store[a] !== undefined) {
          el.setAttribute(a, conv(store[a]));
          return;
        }
        var v = el.getAttribute(a);
        if (!v || !v.trim()) return;
        store = store || {};
        store[a] = v;
        orig.set(el, store);
        el.setAttribute(a, conv(v));
      });
    });
  }

  /* ---------- 節點 ---------- */
  var hero = $('.ld-hero');
  var stage = $('#ldStage');
  var groupsHost = $('#ldGroups');
  var tabsHost = $('#ldTabs');
  var enEl = $('#ldEn');
  var nameEl = $('#ldName');
  var statsEl = $('#ldStats');
  var spanEl = $('#ldSpan');
  var noteEl = $('#ldNote');
  var estEl = $('.ld-est');
  var ctaEl = $('#ldCta');
  var liveEl = $('#ldLive');
  var langBtn = $('#ldLang');

  var groups = [];
  var tabs = [];
  var curIndex = 0;

  var enNode = document.createTextNode('');
  var nameNode = document.createTextNode('');
  var statsNode = document.createTextNode('');
  var noteNode = document.createTextNode('');
  var estNode = document.createTextNode('');
  var ctaNode = document.createTextNode('');
  enEl.appendChild(enNode);
  nameEl.appendChild(nameNode);
  statsEl.appendChild(statsNode);
  if (noteEl) noteEl.appendChild(noteNode);
  if (estEl) estEl.appendChild(estNode);
  /* 年代區間的兩個年份節點：中間那條細線由 CSS 畫，節點本身留空 */
  var spanNodes = [];
  if (spanEl) {
    Array.prototype.slice.call(spanEl.querySelectorAll('.ld-sp-y')).forEach(function (y) {
      var yNode = document.createTextNode('');
      y.appendChild(yNode);
      spanNodes.push(yNode);
    });
  }
  /* 文字型按鈕：文案是第一個子節點，箭頭 span 留在 HTML 裡不動 */
  ctaEl.insertBefore(ctaNode, ctaEl.firstChild);

  /* 展品標籤的資訊：統計行改為拉丁式（「9 ALBUMS · 131 WORKS」），
     數字一律取自資料的 stats，不寫死；年代區間改由兩個年份節點夾一條 CSS 細線，
     JS 只填年分，線的長短與樣式歸 CSS。 */
  function statsText(a) {
    return a.stats.albums + ' ALBUMS · ' + a.stats.tracks + ' WORKS';
  }

  /* 一句簡介：只取資料裡 intro 的最後一句（以「。」斷句，去掉空白）。
     這裡不得自創文案，intro 是唯一來源；資料缺 intro 時留白。 */
  function noteText(a) {
    var parts = String(a.intro || '').split('。');
    for (var i = parts.length - 1; i >= 0; i--) {
      var s = parts[i].trim();
      if (s) return s;
    }
    return '';
  }

  /* 環境光色：當前歌手首張封面所屬專輯的平均色（構建期算好的 sourceAvg），
     找不到該專輯或色值不合法時退回歌手強調色。輸出格式固定為 "r, g, b"，
     讓 CSS 端能以 rgba(var(--amb), α) 取用；兩者皆無則不寫，交還 CSS 預設值。 */
  function toRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return '';
    var v = parseInt(m[1], 16);
    return (v >> 16) + ', ' + ((v >> 8) & 255) + ', ' + (v & 255);
  }

  function ambientOf(a) {
    var covers = a.covers || [];
    var id = covers.length ? covers[0].id : '';
    var albums = a.albums || [];
    var avg = '';
    for (var i = 0; i < albums.length; i++) {
      if (albums[i].id === id) {
        avg = albums[i].sourceAvg;
        break;
      }
    }
    return toRgb(avg) || toRgb(a.theme && a.theme.accent);
  }

  /* ---------- 建構：每位歌手一組封面、一顆封面鈕與一顆姓名鈕 ---------- */
  groupsHost.setAttribute('role', 'list');

  D.order.forEach(function (id, i) {
    var a = D.artists[id];
    var covers = (a.covers || []).slice(0, 3);

    var li = document.createElement('li');
    li.className = 'ld-group';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ld-gbtn';
    setAttr(btn, 'aria-label', a.name);
    var stack = document.createElement('span');
    stack.className = 'ld-gstack';
    stack.setAttribute('aria-hidden', 'true');
    if (covers.length) {
      covers.forEach(function (c, k) {
        var img = document.createElement('img');
        img.src = c.cover;
        img.alt = '';
        img.draggable = false;
        img.decoding = 'async';
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.style.setProperty('--k', String(k));
        stack.appendChild(img);
      });
    } else {
      var ph = document.createElement('span');
      ph.className = 'ld-gph';
      stack.appendChild(ph);
    }
    btn.appendChild(stack);
    li.appendChild(btn);
    groupsHost.appendChild(li);
    groups.push({ li: li, btn: btn });

    var tli = document.createElement('li');
    var tbtn = document.createElement('button');
    tbtn.type = 'button';
    tbtn.className = 'ld-tab';
    tbtn.setAttribute('aria-pressed', 'false');
    var tnode = document.createTextNode('');
    setText(tnode, a.name);
    tbtn.appendChild(tnode);
    tbtn.addEventListener('click', function () {
      select(i, true);
    });
    tli.appendChild(tbtn);
    tabsHost.appendChild(tli);
    tabs.push({ btn: tbtn, id: id });
  });

  /* ---------- 狀態 ---------- */
  /* 最小環形位移：舞台上只留 |off| <= 2 的組，其餘收進 hidden 不佔焦點 */
  function offsetOf(i) {
    var off = (((i - curIndex) % N) + N) % N;
    if (off * 2 > N) off -= N;
    return off;
  }

  function remember() {
    try {
      sessionStorage.setItem(STORE_KEY, D.order[curIndex]);
    } catch {
      /* 隱私模式下寫入會拋錯，忽略；不阻止瀏覽 */
    }
  }

  function restore() {
    var saved = null;
    try {
      saved = sessionStorage.getItem(STORE_KEY);
    } catch {
      saved = null;
    }
    var at = saved ? D.order.indexOf(saved) : -1;
    return at >= 0 ? at : 0;
  }

  function announce() {
    var a = D.artists[D.order[curIndex]];
    if (liveEl) {
      liveEl.textContent = conv(
        '已選 ' + a.name + '，第 ' + (curIndex + 1) + ' 位，共 ' + N + ' 位'
      );
    }
  }

  function paint(withAnnounce) {
    var a = D.artists[D.order[curIndex]];

    groups.forEach(function (g, i) {
      var off = offsetOf(i);
      var far = Math.abs(off) > 2;
      g.li.setAttribute('data-off', String(off));
      g.li.hidden = far;
      g.btn.setAttribute('aria-pressed', String(i === curIndex));
      /* 中央封面是「進入」，其餘是「選中」：無障礙名稱要跟著當前角色走 */
      setAttr(
        g.btn,
        'aria-label',
        i === curIndex ? D.artists[D.order[i]].name + '，進入專輯' : D.artists[D.order[i]].name
      );
    });

    tabs.forEach(function (t, i) {
      var on = i === curIndex;
      t.btn.setAttribute('aria-pressed', String(on));
      t.btn.classList.toggle('is-on', on);
    });

    setText(enNode, a.en || '');
    enEl.hidden = !a.en || a.en === a.name;
    setText(nameNode, a.name);
    setText(statsNode, statsText(a));
    /* 年份以字串寫入：setText 的原文快取會經過 localize()，數字要先轉字串 */
    if (spanNodes.length >= 2) {
      setText(spanNodes[0], String(a.stats.from));
      setText(spanNodes[1], String(a.stats.to));
    }
    if (noteEl) setText(noteNode, noteText(a));
    setText(ctaNode, '進入檔案');
    setAttr(ctaEl, 'aria-label', '進入 ' + a.name + ' 的唱片目錄');
    ctaEl.setAttribute('href', 'artist.html?a=' + encodeURIComponent(a.id));

    if (hero) {
      hero.style.setProperty('--accent', (a.theme && a.theme.accent) || '');
      hero.style.setProperty('--accent-on', (a.theme && a.theme.accentOn) || '');
      var amb = ambientOf(a);
      if (amb) hero.style.setProperty('--amb', amb);
      else hero.style.removeProperty('--amb');
    }

    if (withAnnounce) announce();
  }

  /* 換歌手的過場：真正切位時在 .ld-hero 上閃一次 is-switching，動畫交給 CSS。
     reduced-motion 下不加；連續切換時重設計時器，
     免得前一次收尾把後一次剛開始的過場提前關掉。 */
  var SWITCH_MS = 400;
  var switchTimer = 0;

  function flashSwitch() {
    if (!hero || reduceMotion) return;
    hero.classList.add('is-switching');
    if (switchTimer) clearTimeout(switchTimer);
    switchTimer = setTimeout(function () {
      switchTimer = 0;
      hero.classList.remove('is-switching');
    }, SWITCH_MS);
  }

  function select(i, withAnnounce) {
    i = ((i % N) + N) % N;
    var changed = i !== curIndex;
    curIndex = i;
    paint(withAnnounce && changed);
    if (changed) {
      remember();
      flashSwitch();
    }
  }

  function step(d) {
    select(curIndex + d, true);
  }

  /* ---------- 操作 ----------
     切換只有三條路：點封面選中該歌手、點舞台空白處進退一位、拖曳或滑動。
     先前另有左右箭頭與「01 / 07」計數，維護者要求去掉，改為只靠點封面；
     step() 仍保留給拖曳與鍵盤使用。

     中央那張（已選中的歌手）再點一次＝直接進他的專輯頁，與「進入專輯」同一去處：
     兩側封面負責切換，中央封面負責進入，少一次「先選中再按按鈕」。 */
  var dragEndAt = 0;
  groups.forEach(function (g, i) {
    g.btn.addEventListener('click', function () {
      /* 一次手勢不該又誤選其他封面 */
      if (performance.now() - dragEndAt < 350) return;
      if (i === curIndex) {
        location.href = 'artist.html?a=' + encodeURIComponent(D.order[i]);
        return;
      }
      select(i, true);
    });
  });

  /* 鍵盤：只掛在唱片架容器上，不在整份文件攔截方向鍵 */
  shelf.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      select(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(N - 1, true);
    }
  });

  /* 拖曳與滑動：熱路徑只讀指標座標，不讀版面 */
  var dragging = false;
  var captured = false;
  var pointerId = -1;
  var startX = 0;
  var startY = 0;
  var dx = 0;
  var dy = 0;

  /* 抓取要「延後到確認是拖曳」才做。
     先前在 pointerdown 就 setPointerCapture，指標一被 stage 捕獲，
     瀏覽器就把 click 派發給 stage 而不是底下的封面鈕——於是點封面永遠不會選中
     （實測 click 的 target 是 ld-stage，封面鈕的處理器從未執行）。
     現在改成位移超過門檻才抓取：純點擊不抓，拖曳即時接管。 */
  var CAPTURE_AT = 8;

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    captured = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dy = 0;
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    if (!captured && Math.abs(dx) >= CAPTURE_AT && Math.abs(dx) > Math.abs(dy)) {
      try {
        stage.setPointerCapture(pointerId);
        captured = true;
      } catch {
        /* 不支援指標捕獲時仍可拖曳 */
      }
    }
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    /* 已超過抓取門檻＝這是一次拖曳，不是點擊。
       後續的 click 必須抑制：否則 30px 這種「拖了但沒到切換門檻」的手勢
       會落進舞台的空白點擊處理，反而退了一位（實測 0 跳到 6）。 */
    var wasDrag = captured;
    if (captured) {
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* 已釋放或未捕獲 */
      }
      captured = false;
    }
    if (wasDrag) dragEndAt = performance.now();
    var ax = Math.abs(dx);
    var ay = Math.abs(dy);
    if (ax >= 40 && ax > ay * 1.3) {
      dragEndAt = performance.now();
      step(dx < 0 ? 1 : -1);
    }
    dx = 0;
    dy = 0;
  }

  stage.addEventListener('pointerup', endDrag);
  /* 沒有捕獲時指標可能在舞台外放開，補一層保險（endDrag 自帶重入守衛） */
  window.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', function () {
    dragging = false;
    captured = false;
    dx = 0;
    dy = 0;
  });

  /* 點封面以外的空白處：左半退一位、右半進一位。
     封面本身是 <button>，由各自的 click 處理器負責選中，這裡不搶。 */
  stage.addEventListener('click', function (e) {
    if (performance.now() - dragEndAt < 350) return;
    if (e.target.closest && e.target.closest('button')) return;
    var r = stage.getBoundingClientRect();
    step(e.clientX < r.left + r.width / 2 ? -1 : 1);
  });

  /* ---------- 繁簡 ---------- */
  function paintLang() {
    if (!langBtn) return;
    Array.prototype.slice.call(langBtn.querySelectorAll('.lang-opt')).forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-opt') === lang);
    });
  }

  function toggle() {
    lang = lang === 's' ? 't' : 's';
    try {
      localStorage.setItem('jc-lang', lang);
    } catch {
      /* 隱私模式下寫入會拋錯，忽略 */
    }
    document.documentElement.setAttribute('data-lang', lang);
    walk(document.body);
    paintLang();
  }

  if (langBtn) langBtn.addEventListener('click', toggle);

  /* ---------- 起點 ---------- */
  /* 銘牌上的起始年不得寫死：取全站最早的統計年份（當前資料為 1997） */
  var estYear = 0;
  D.order.forEach(function (id) {
    var from = (D.artists[id].stats || {}).from;
    if (from && (!estYear || from < estYear)) estYear = from;
  });
  setText(estNode, estYear ? 'EST. ' + estYear : 'EST.');

  curIndex = restore();
  document.documentElement.setAttribute('data-lang', lang);
  paint(false);
  paintLang();
  walk(document.body);

  /* 入口的三階段入場（品牌 → 唱片架 → 資訊區）由 CSS 以 animation-delay 排程，
     JS 只切類：序列跑完才移除 ld-booting、加上 is-ready，讓基礎態接管。
     先前用雙 rAF 立刻 settle，等於把整段動畫截斷在起點；
     reduced-motion 直接收斂，不讓使用者等。 */
  var BOOT_MS = 3400;
  var settle = function () {
    document.documentElement.classList.remove('ld-booting');
    document.documentElement.classList.add('is-ready');
  };
  if (reduceMotion) settle();
  else setTimeout(settle, BOOT_MS);
})();
