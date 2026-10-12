/* ============================================================================
   landing.js · 聲之年輪入口頁
   Renders the artist index from window.DISCOGRAPHY and converts its own copy
   with the same OpenCC tables embedded in data.js. Kept deliberately small:
   app.js 的 localize 屬於歌手頁的 IIFE，這裡不引入整個渲染器。
   ========================================================================= */
(function () {
  'use strict';

  var D = window.DISCOGRAPHY;
  if (!D || !D.order || !D.order.length) {
    var empty = document.getElementById('ldEmpty');
    if (empty) empty.hidden = false;
    return;
  }

  var lang = 's';
  try {
    lang = localStorage.getItem('jc-lang') || 's';
  } catch {
    lang = 's';
  }

  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var ATTRS = ['aria-label'];
  var orig = new WeakMap();

  function localizeNode(node) {
    if (node.nodeType !== 3) return;
    if (orig.has(node)) {
      node.nodeValue = lang === 's' ? D.toSimplified(orig.get(node)) : orig.get(node);
      return;
    }
    var text = node.nodeValue;
    if (!text || !text.trim()) return;
    orig.set(node, text);
    node.nodeValue = lang === 's' ? D.toSimplified(text) : text;
  }

  function walk(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) localizeNode(walker.currentNode);
    Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function (el) {
      ATTRS.forEach(function (a) {
        if (!el.hasAttribute(a)) return;
        var store = orig.get(el);
        if (store && store[a] !== undefined) {
          el.setAttribute(a, lang === 's' ? D.toSimplified(store[a]) : store[a]);
          return;
        }
        var v = el.getAttribute(a);
        if (!v || !v.trim()) return;
        store = store || {};
        store[a] = v;
        orig.set(el, store);
        el.setAttribute(a, lang === 's' ? D.toSimplified(v) : v);
      });
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
    paint();
  }

  /* ---------- render ---------- */
  var list = $('#artistList');
  if (list) {
    list.innerHTML = D.order
      .map(function (id) {
        var a = D.artists[id];
        var rgb = a.tint || [40, 32, 26];
        var stack = a.covers
          .map(function (c, i) {
            return (
              '<img class="lds-img" src="' +
              c.cover +
              '" alt="" loading="lazy"' +
              ' style="--i:' +
              i +
              '">'
            );
          })
          .join('');
        return (
          '<li class="ld-row" style="--tint:' +
          rgb.join(',') +
          ';--accent:' +
          (a.theme && a.theme.accent ? a.theme.accent : '') +
          '">' +
          '<a class="ld-link" href="artist.html?a=' +
          encodeURIComponent(id) +
          '">' +
          '<span class="lds" aria-hidden="true">' +
          stack +
          '</span>' +
          '<span class="ld-main">' +
          '<span class="ld-name">' +
          a.name +
          '</span>' +
          (a.en && a.en !== a.name ? '<span class="ld-en">' + a.en + '</span>' : '') +
          '<span class="ld-intro">' +
          a.intro +
          '</span>' +
          '</span>' +
          '<span class="ld-meta">' +
          '<b>' +
          a.stats.albums +
          '</b><i>張專輯</i>' +
          '<b>' +
          a.stats.tracks +
          '</b><i>首曲目</i>' +
          '<b>' +
          a.stats.from +
          '–' +
          a.stats.to +
          '</b><i>年跨度</i>' +
          '</span>' +
          '<svg class="ico ld-arrow" viewBox="0 0 256 256" aria-hidden="true"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>' +
          '</a></li>'
        );
      })
      .join('');
  }

  /* lang toggle sits in the hero eyebrow area */
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'lang ld-lang';
  toggleBtn.type = 'button';
  toggleBtn.setAttribute('aria-label', '切換繁體與簡體');
  toggleBtn.innerHTML =
    '<span class="lang-opt" data-opt="s">簡</span><span class="lang-opt" data-opt="t">繁</span>';
  var sub = $('.ld-sub');
  if (sub && sub.parentNode) sub.parentNode.insertBefore(toggleBtn, sub.nextSibling);
  toggleBtn.addEventListener('click', toggle);

  function paint() {
    Array.prototype.slice.call(toggleBtn.querySelectorAll('.lang-opt')).forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-opt') === lang);
    });
  }
  document.documentElement.setAttribute('data-lang', lang);
  paint();
  walk(document.body);

  /* 入口的短入场：动画由 CSS 自完成（.ld-booting），这里只负责收尾，
     去掉类名后由基础态接管，脚本失败也不会让标题停在透明 */
  var settle = function () {
    document.documentElement.classList.remove('ld-booting');
    document.documentElement.classList.add('is-ready');
  };
  requestAnimationFrame(function () {
    requestAnimationFrame(settle);
  });
  setTimeout(settle, 1400);
})();
