/*  js/cursor.js — 可選的自訂指針（Task 13）
 *
 *  零依賴、無建置，隨 artist.html 以經典腳本載入。**預設關閉**，偏好存在
 *  localStorage 的 `jc-cursor`；開啟後只在「展品互動區」（主視覺、展櫃、封面牆、
 *  曲目列、歌曲檔案、抽屜曲目）畫一個小圓點與一圈細環，指向可操作封面時放大。
 *
 *  刻意不做的事：
 *    · 不取代全站游標——不設 `cursor: none`。輸入欄、捲動條、外部連結、可選文字
 *      一律保留原生指針；裝飾只在展品區出現，離開就淡出。
 *    · 不在手機／觸控（沒有精細指針）建立跟隨物件。
 *    · reduced-motion、forced-colors（高對比）自動停用。
 *    · 兩個裝飾層都 `pointer-events: none`，不攔任何點擊。
 *  這些是「保留可關閉實作、不強制取代全站游標」的具體落地，不是宣稱。
 */
(function () {
  'use strict';

  var KEY = 'jc-cursor';
  var FINE = window.matchMedia('(pointer: fine) and (hover: hover)');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FORCED = window.matchMedia('(forced-colors: active)');

  /* 裝飾只出現在這些容器裡（展品互動區），其餘地方維持原生指針 */
  var ZONES = [
    '.fan',
    '.ld-groups',
    '.ld-stage',
    '.rack-track',
    '.wall-grid',
    '#catList',
    '#sheetScroll',
    '#saScroll',
    '#picksList',
    '.cv-bar'
  ].join(',');

  /* 指向可操作封面/列時放大（真正的互動目標，不是任意子元素） */
  var HOT =
    'button, a[href], [role="button"], .fan-card, .ld-group, .wall-tile, .chrono-row, .cat-track';

  var enabled = false;
  var dot = null;
  var ring = null;
  var raf = 0;
  var px = 0;
  var py = 0;
  var rx = 0;
  var ry = 0;
  var visible = false;
  var inZone = false;

  function supported() {
    return FINE.matches && !REDUCED.matches && !FORCED.matches;
  }

  function readPref() {
    try {
      return localStorage.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  }

  function writePref(on) {
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      /* 隐私模式下写入会抛错：偏好當次有效即可，不阻止使用 */
    }
  }

  function build() {
    if (dot) return;
    dot = document.createElement('span');
    dot.className = 'cur-dot';
    dot.setAttribute('aria-hidden', 'true');
    ring = document.createElement('span');
    ring.className = 'cur-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.appendChild(ring);
  }

  function frame() {
    raf = 0;
    if (!enabled) return;
    /* 環用一階濾波追上指標；點直接到位。位移只寫自訂屬性，不在 JS 內拼樣式 */
    rx += (px - rx) * 0.22;
    ry += (py - ry) * 0.22;
    dot.style.setProperty('--cx', px.toFixed(1) + 'px');
    dot.style.setProperty('--cy', py.toFixed(1) + 'px');
    ring.style.setProperty('--cx', rx.toFixed(1) + 'px');
    ring.style.setProperty('--cy', ry.toFixed(1) + 'px');
    raf = window.requestAnimationFrame(frame);
  }

  function schedule() {
    if (!raf) raf = window.requestAnimationFrame(frame);
  }

  function setVisible(next) {
    if (visible === next) return;
    visible = next;
    document.documentElement.classList.toggle('cursor-on', next);
  }

  function setHot(next) {
    document.documentElement.classList.toggle('cursor-hot', next);
  }

  function onMove(e) {
    if (!enabled) return;
    px = e.clientX;
    py = e.clientY;
    if (!rx && !ry) {
      rx = px;
      ry = py;
    }
    var t = e.target;
    inZone = !!(t && t.closest && t.closest(ZONES));
    setVisible(inZone);
    setHot(!!(t && t.closest && t.closest(HOT) && inZone));
    schedule();
  }

  function onLeave() {
    setVisible(false);
    setHot(false);
  }

  /* 換頁／切到別的分頁：動畫迴圈停掉，裝飾層藏起來（不在背景燒 rAF） */
  function onVisibility() {
    if (document.hidden) {
      stop();
    } else if (enabled) {
      start();
    }
  }

  function start() {
    if (raf) return;
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
    setVisible(false);
    setHot(false);
  }

  function apply(on) {
    enabled = !!on && supported();
    document.documentElement.classList.toggle('cursor-custom', enabled);
    if (enabled) {
      build();
      start();
    } else {
      stop();
    }
    var btns = document.querySelectorAll('[data-tool="cursor"]');
    Array.prototype.slice.call(btns).forEach(function (b) {
      b.setAttribute('aria-checked', String(enabled));
      var state = b.querySelector('.am-meta');
      if (state) state.textContent = enabled ? '開' : '關';
    });
    return enabled;
  }

  function toggle() {
    var next = !enabled;
    writePref(next);
    return apply(next);
  }

  window.JCCursor = {
    toggle: toggle,
    isOn: function () {
      return enabled;
    },
    /* 環境不允許時回 false；呼叫端可用它把開關標成不可用，而不是假裝成功 */
    supported: supported
  };

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  FINE.addEventListener('change', function () {
    apply(enabled);
  });
  REDUCED.addEventListener('change', function () {
    apply(enabled);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      apply(readPref());
    });
  } else {
    apply(readPref());
  }
})();
