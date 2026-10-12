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

  /* Play control for one track row. `numClass` keeps the catalogue and the
     album sheet using their own numeral styling. */
  function playBtn(albumId, t, numClass) {
    var off = t.audio ? '' : ' disabled';
    var num = String(t.n).padStart(2, '0');
    return (
      '<button class="ct-play" type="button" data-play="' +
      albumId +
      ':' +
      t.n +
      '"' +
      ' data-track="' +
      esc(t.zh) +
      '"' +
      ' aria-label="試聽 ' +
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
  function renderFan() {
    var host = $('#heroArt');
    if (!host) return;
    var covers = JC.covers;
    var spec = [
      { r: -13, x: -56, y: 8, s: 0.72, z: 1, o: 0.44 },
      { r: -6.5, x: -29, y: 3, s: 0.85, z: 2, o: 0.78 },
      { r: 0, x: 0, y: 0, s: 1, z: 6, o: 1 },
      { r: 6.5, x: 29, y: 3, s: 0.85, z: 2, o: 0.78 },
      { r: 13, x: 56, y: 8, s: 0.72, z: 1, o: 0.44 }
    ];
    var fan = el('div', 'fan');
    covers.forEach(function (c, i) {
      var sp = spec[i];
      if (!sp) return;
      var card = el('div', 'fan-card');
      card.style.setProperty('--fx', sp.x + '%');
      card.style.setProperty('--fy', sp.y + '%');
      card.style.setProperty('--fr', sp.r + 'deg');
      card.style.setProperty('--fs', sp.s);
      card.style.setProperty('--fo', sp.o);
      card.style.setProperty('--z', sp.z);
      card.style.setProperty('--i', i);
      var img = el('img');
      img.src = c.cover;
      var a = ALBUMS.filter(function (x) {
        return x.id === c.id;
      })[0];
      if (!a) return;
      img.srcset = srcset(a);
      img.sizes = '(max-width: 1100px) 46vw, 30vw';
      img.alt = a.title + ' 專輯封面';
      img.decoding = 'async';
      if (i === 2) img.setAttribute('fetchpriority', 'high');
      card.appendChild(img);
      fan.appendChild(card);
    });
    host.appendChild(fan);

    // pointer parallax, driven straight off a custom property in a rAF loop
    var host2 = host;
    var mx = 0,
      my = 0,
      tx = 0,
      ty = 0,
      raf = 0;
    function tick() {
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      fan.style.setProperty('--mx', mx.toFixed(3));
      fan.style.setProperty('--my', my.toFixed(3));
      if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) raf = requestAnimationFrame(tick);
      else raf = 0;
    }
    host2.addEventListener('pointermove', function (e) {
      if (REDUCED.matches) return;
      var r = host2.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    });
    host2.addEventListener('pointerleave', function () {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
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
  }

  /* The band drifts as the page scrolls: a slow parallax response rather than a
     timed loop, so nothing animates unattended and no pause control is needed. */
  var marqueeEl,
    marqueeTrack,
    marqueeRoom = 0;
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
    marqueeTrack.style.transform = 'translate3d(' + (-p * travel).toFixed(1) + 'px,0,0)';
  }

  /* ── album rack ─────────────────────────────────────────────────────── */
  var rackStage, rackTrack, rackBar, rackNow, rackHint;
  var hijack = false,
    rackMax = 0,
    cards = [];

  function renderRack() {
    rackStage = $('#rackStage');
    rackTrack = $('#rackTrack');
    rackBar = $('#rackBar');
    rackNow = $('#rackNow');
    rackHint = $('#rackHint');
    if (!rackTrack) return;
    var f = frag();
    ALBUMS.forEach(function (a) {
      var card = el('div', 'album-card');
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-id', a.id);
      var alt = a.alt ? '<span class="album-alt">' + esc(a.alt) + '</span>' : '';
      var first = firstPlayable(a);
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
        /* 浏览与播放分开：点封面看专辑，点这一颗直接试听 */
        (first
          ? '<button class="album-play" type="button" data-play="' +
            a.id +
            ':' +
            first.n +
            '" aria-label="試聽 ' +
            esc(a.title) +
            ' 的 ' +
            esc(first.zh) +
            '，官方 30 秒片段">' +
            '<svg class="ico" viewBox="0 0 256 256" aria-hidden="true">' +
            P_PLAY +
            '</svg><span>試聽 30 秒</span></button>'
          : '');
      f.appendChild(card);
    });
    rackTrack.appendChild(f);
    cards = $$('.album-card', rackTrack);
    measureRack();
  }

  function measureRack() {
    hijack = window.matchMedia(
      '(min-width: 861px) and (prefers-reduced-motion: no-preference)'
    ).matches;
    if (!hijack) {
      rackStage.style.height = '';
      rackTrack.style.transform = '';
      cards.forEach(function (c) {
        c.classList.add('is-live');
      });
      if (rackHint) rackHint.style.display = 'none';
      paintRackFromScroll();
      return;
    }
    if (rackHint) rackHint.style.display = '';
    rackMax = Math.max(0, rackTrack.scrollWidth - window.innerWidth);
    rackStage.style.height = Math.round(window.innerHeight + rackMax * 0.82) + 'px';
    updateRack();
  }

  function rackOffset() {
    if (!hijack) return -rackTrack.scrollLeft;
    var top = rackStage.getBoundingClientRect().top;
    var dist = rackStage.offsetHeight - window.innerHeight;
    var p = dist > 0 ? clamp(-top / dist, 0, 1) : 0;
    rackBar.style.width = p * 100 + '%';
    return -p * rackMax;
  }

  function paintRackFromScroll() {
    var x = rackOffset();
    if (hijack) rackTrack.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    var center = window.innerWidth / 2,
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
  }

  var updateRack = paintRackFromScroll;

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
            '" aria-label="試聽 ' +
            esc(a.title) +
            '，官方 30 秒片段">' +
            '<svg class="ico" viewBox="0 0 256 256" aria-hidden="true">' +
            P_PLAY +
            '</svg></button>'
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
      b.setAttribute('data-open', t.album);
      b.setAttribute('aria-label', t.zh + '，' + t.albumTitle + '，' + t.len);
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
        li.innerHTML =
          playBtn(g.album.id, t, 'ct-num') +
          '<span class="ct-name">' +
          esc(t.zh) +
          '</span>' +
          '<span class="ct-len">' +
          t.len +
          '</span>';
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
          '<span class="st-name">' +
          esc(t.zh) +
          '</span>' +
          '<span class="st-len">' +
          t.len +
          '</span></li>'
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
      '<span>試聽整張 · 30 秒</span></button>' +
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
      b.classList.toggle('is-current', match);
      b.classList.toggle('is-playing', match && playing);
      var row = b.closest ? b.closest('.cat-track, .sheet-track') : null;
      if (row) row.classList.toggle('is-current', match);
      b.setAttribute(
        'aria-label',
        (match && playing ? '暫停 ' : '試聽 ') + (b.getAttribute('data-track') || '')
      );
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
      meta.innerHTML = '<b>' + esc(a.title) + '</b> · 第 ' + idx + ' 首 · 官方 30 秒試聽';
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

    /* 题名已是歌手名，副题不再重复它，只留英文名（若与中文名不同）与类别 */
    var eyebrow = $('#heroEyebrow');
    if (eyebrow)
      eyebrow.textContent = (JC.en && JC.en !== JC.name ? JC.en + ' · ' : '') + JC.tagline;

    var line = $('#heroLine');
    if (line)
      line.textContent =
        '從 ' + JC.stats.from + ' 到 ' + JC.stats.to + '，' + JC.stats.albums + ' 張錄音室專輯。';

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
    html.push(
      '<button class="am-item am-tool" type="button" role="menuitem" data-tool="lang">' +
        '<span class="am-seal" aria-hidden="true">文</span>' +
        '<span class="am-name">切換繁簡</span>' +
        '<span class="am-meta" id="amLangState">' +
        (lang === 's' ? '簡' : '繁') +
        '</span></button>' +
        '<button class="am-item am-tool" type="button" role="menuitem" data-tool="random">' +
        '<span class="am-seal" aria-hidden="true">隨</span>' +
        '<span class="am-name">隨機試聽</span>' +
        '<span class="am-meta">30 秒</span></button>'
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
      // navigating to another artist rebuilds the page; nothing to keep open
      var item = e.target.closest ? e.target.closest('.am-item') : null;
      if (item) setOpen(false);
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
    toast('隨機試聽：' + t.zh + '（' + t.albumTitle + '）');
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
      // playback takes precedence: the row controls live inside list rows
      var play = e.target.closest('[data-play]');
      if (play) {
        if (play.disabled) return;
        var parts = play.getAttribute('data-play').split(':');
        plSelect(parts[0], parts[1]);
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

    // rack: native scroll mode (mobile / reduced motion)
    rackTrack.addEventListener(
      'scroll',
      function () {
        if (!hijack) paintRackFromScroll();
      },
      { passive: true }
    );

    /* Pointer-tracked sheen on the sleeves, and a 6px magnetic pull on the
       primary CTA. Both write custom properties inside a rAF so no layout is
       read on the hot path. */
    var spotRaf = 0,
      spotEvt = null;
    rackTrack.addEventListener(
      'pointermove',
      function (e) {
        if (REDUCED.matches || e.pointerType === 'touch') return;
        spotEvt = e;
        if (spotRaf) return;
        spotRaf = requestAnimationFrame(function () {
          spotRaf = 0;
          var ev = spotEvt;
          if (!ev) return;
          var hit = ev.target.closest ? ev.target.closest('.album-hit') : null;
          if (!hit) return;
          var plate = $('.album-plate', hit);
          if (!plate) return;
          var r = plate.getBoundingClientRect();
          plate.style.setProperty(
            '--px',
            (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + '%'
          );
          plate.style.setProperty(
            '--py',
            (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + '%'
          );
        });
      },
      { passive: true }
    );

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
    /* 这位歌手的曲目不用 feat./with 标注时没有合作者可列：整段收起 */
    if (!JC.collaborators.length) {
      var collab = $('#collab');
      if (collab) collab.hidden = true;
    }
    renderPicks();
    renderCatBase();
    initAudio();

    // sheet nodes must exist before bind()
    sheet = $('#sheet');
    sheetPanel = $('.sheet-panel', sheet);
    sheetScroll = $('#sheetScroll');
    toastEl = $('#toast');

    bind();
    bindChrome();
    renderChapters();
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
