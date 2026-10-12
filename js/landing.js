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
  var posEl = $('#ldPos');
  var totalEl = $('#ldTotal');
  var enEl = $('#ldEn');
  var nameEl = $('#ldName');
  var statsEl = $('#ldStats');
  var ctaEl = $('#ldCta');
  var liveEl = $('#ldLive');
  var prevBtn = $('#ldPrev');
  var nextBtn = $('#ldNext');
  var langBtn = $('#ldLang');

  var groups = [];
  var tabs = [];
  var curIndex = 0;

  var enNode = document.createTextNode('');
  var nameNode = document.createTextNode('');
  var statsNode = document.createTextNode('');
  var ctaNode = document.createTextNode('');
  enEl.appendChild(enNode);
  nameEl.appendChild(nameNode);
  statsEl.appendChild(statsNode);
  ctaEl.appendChild(ctaNode);

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function statsText(a) {
    return (
      a.stats.from +
      ' 至 ' +
      a.stats.to +
      ' · ' +
      a.stats.albums +
      ' 張專輯 · ' +
      a.stats.tracks +
      ' 首作品'
    );
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
    });

    tabs.forEach(function (t, i) {
      var on = i === curIndex;
      t.btn.setAttribute('aria-pressed', String(on));
      t.btn.classList.toggle('is-on', on);
    });

    posEl.textContent = pad(curIndex + 1);
    totalEl.textContent = pad(N);

    setText(enNode, a.en || '');
    enEl.hidden = !a.en || a.en === a.name;
    setText(nameNode, a.name);
    setText(statsNode, statsText(a));
    setText(ctaNode, '進入專輯');
    setAttr(ctaEl, 'aria-label', '進入 ' + a.name + ' 的唱片目錄');
    ctaEl.setAttribute('href', 'artist.html?a=' + encodeURIComponent(a.id));

    if (hero) {
      hero.style.setProperty('--accent', (a.theme && a.theme.accent) || '');
      hero.style.setProperty('--accent-on', (a.theme && a.theme.accentOn) || '');
    }

    if (withAnnounce) announce();
  }

  function select(i, withAnnounce) {
    i = ((i % N) + N) % N;
    var changed = i !== curIndex;
    curIndex = i;
    paint(withAnnounce && changed);
    if (changed) remember();
  }

  function step(d) {
    select(curIndex + d, true);
  }

  /* ---------- 操作 ---------- */
  prevBtn.addEventListener('click', function () {
    step(-1);
  });
  nextBtn.addEventListener('click', function () {
    step(1);
  });
  if (N < 2) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  var dragEndAt = 0;
  groups.forEach(function (g, i) {
    g.btn.addEventListener('click', function () {
      /* 一次手勢不該又誤選其他封面 */
      if (performance.now() - dragEndAt < 350) return;
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
  var startX = 0;
  var startY = 0;
  var dx = 0;
  var dy = 0;

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dy = 0;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* 不支援指標捕獲時仍可拖曳 */
    }
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      /* 已釋放或未捕獲 */
    }
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
  stage.addEventListener('pointercancel', function () {
    dragging = false;
    dx = 0;
    dy = 0;
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
  curIndex = restore();
  document.documentElement.setAttribute('data-lang', lang);
  paint(false);
  paintLang();
  walk(document.body);

  /* 入口的短入場：動畫由 CSS 自完成（.ld-booting），這裡只負責收尾，
     去掉類名後由基礎態接管，腳本失敗也不會讓標題停在透明 */
  var settle = function () {
    document.documentElement.classList.remove('ld-booting');
    document.documentElement.classList.add('is-ready');
  };
  requestAnimationFrame(function () {
    requestAnimationFrame(settle);
  });
  setTimeout(settle, 1400);
})();
