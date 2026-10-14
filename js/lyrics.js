/*  js/lyrics.js — 全屏歌词舞台
 *
 *  零依赖、无构建，随 artist.html 以经典脚本加载。
 *  数据：js/data.js 里每首歌的 song.lyrics（一个 sidecar 描述子，只有本机听歌模式
 *  才有；公开产物连这个键都没有，见 npm run build:local）。歌词文件是第三方版权
 *  文本，登记档与文件都不进版本库，也不内嵌进 data.js。
 *
 *  一行歌词的规范形状（歌曲档案的资料模型共用它，见 docs/ARCHITECTURE.md 的契约节）：
 *    { time: 12.34, text: '想要有直升机', end: 15.2 }
 *    time 是秒（数字，便于比较与扫光插值），text 是该行文字，
 *    end 是这一行的结束时间、由解析器从下一行的 time 补出（最后一行给 4 秒）。
 *    由 parseLrc() 产出；舞台内部直接消费这个形状，没有第二套。
 *
 *  逐行 LRC 没有逐字时间轴，所以扫光位置由「当前行时长」在字元间按宽度插值，
 *  并对短句降级（见 hintFor）：这一层思路取自 Folia 的 renderHints，
 *  阈值与转场时长按其量级重写，实现是本站自己的。
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* 短句分级：太短的行来不及做完入场与扫光，硬做会互相踩踏 */
  var MICRO = 0.7; /* 秒；以下不做转场、扫光瞬时完成 */
  var SHORT = 1.6;

  function hintFor(dur) {
    if (dur < MICRO) return { cls: 'micro', enter: 0, sweep: 'instant' };
    if (dur < SHORT) return { cls: 'short', enter: 0.12, sweep: 'fast' };
    return { cls: 'normal', enter: 0.26, sweep: 'normal' };
  }

  /* ── LRC 解析 ───────────────────────────────────────────────
     只取时间轴行；[ti:] [ar:] [al:] 等标签丢弃。
     开头几行常是「词：方文山／曲：周杰伦／编曲：…」，属制作信息而非歌词，
     混进舞台会很难看，这里按前缀识别删掉（正文里出现这些词不受影响）。 */
  /* 制作人员行：中文 LRC 用「词：／曲：」，英文 LRC 用「Composed by:／Written by:」。
     两边都要滤掉，否则舞台上会出现一行没人唱的制作信息。
     英文分支要求行首是这些词、冒号前不超过 30 字，避免误删正文。 */
  var CREDIT =
    /^(词|詞|填词|填詞|作词|作詞|曲|作曲|编曲|編曲|制作人|製作人|吉他|贝斯|貝斯|鼓|和声|和聲|录音|錄音|混音|母带|母帶|发行|發行|OP|SP|监制|監製|出品|企划|企劃)\s*[:：]|^(composed|written|lyrics|lyric|music|words|produced|producer|arranged|arranger|published|mixed|mix|recorded|mastered|performed|vocals|backing vocals|label|engineer|guitar|bass|drums|piano|strings|additional)\b([^:：]{0,30}[:：]|\s+by\b)/i;

  /* 演唱者标记：对唱曲里整行只有「男：」「女：」「合：」「周杰伦：」这类标记，
     后面没有任何歌词。全库 175 首实测只有 12 种这种文本（合计 114 行），
     都短于 5 字且冒号后为空，所以要求「整行就是标记」才删，正文一律不动。 */
  var SPEAKER = /^[^:：\s]{1,4}[:：]$/;

  /* 比对用：去空白与大小写，再统一转简体——歌词文件多是简体，
     而站点曲名是繁体，不转换会整类判不中。 */
  function normForMatch(s) {
    var t = String(s)
      .replace(/[\s\u3000]+/g, '')
      .toLowerCase();
    try {
      var D = window.DISCOGRAPHY;
      if (D && D.toSimplified) t = D.toSimplified(t);
    } catch {
      /* 转换表不可用时退回原样比对 */
    }
    return t;
  }

  function parseLrc(text, title) {
    if (!text) return [];
    var tKey = title ? normForMatch(title) : '';
    var out = [];
    var lines = String(text)
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/);
    var pending = [];
    var re = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      if (!raw) continue;
      re.lastIndex = 0;
      var stamps = [];
      var m;
      var last = 0;
      while ((m = re.exec(raw)) !== null) {
        stamps.push(m);
        last = re.lastIndex;
      }
      if (!stamps.length) continue;
      var body = raw.slice(last).trim();
      /* 增强型逐字标签 <mm:ss.xx> 这里不支持：剥掉后按行处理，至少不把标签显示出来 */
      body = body.replace(/<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g, '').trim();
      if (!body) continue;
      /* 标题头行：带时间戳但不是歌词。两种顺序都有，都要认：
         「歌名 - 周杰倫 (Jay Chou)」（jay/taylor 的档）与
         「林俊杰 - 就是我」（jj/gem 的档）。
         行尾命中时要求破折号前是 14 字以内的短前缀（歌手名），
         否则正文里「… - 就是我」这种句子会被误删。 */
      if (tKey && /[-–—]/.test(body)) {
        var nb = normForMatch(body);
        var head = nb.indexOf(tKey) === 0;
        var dash = body.search(/[-–—]/);
        var tail = nb.slice(-tKey.length) === tKey && dash <= 14;
        if (head || tail) continue;
      }
      for (var s = 0; s < stamps.length; s++) {
        var st = stamps[s];
        var frac = st[3] || '0';
        var sec =
          Number(st[1]) * 60 + Number(st[2]) + Number('0.' + frac.padEnd(3, '0').slice(0, 3));
        pending.push({ time: sec, text: body });
      }
    }
    pending.sort(function (a, b) {
      return a.time - b.time;
    });
    /* 过滤制作人员行、演唱者标记与空行 */
    for (var k = 0; k < pending.length; k++) {
      var tx = pending[k].text;
      if (!tx) continue;
      if (CREDIT.test(tx)) continue;
      if (SPEAKER.test(tx)) continue;
      out.push({ time: pending[k].time, text: tx });
    }
    /* 补出每行的结束时间（下一行开始；最后一行给一个合理默认） */
    for (var j = 0; j < out.length; j++) {
      out[j].end = j + 1 < out.length ? out[j + 1].time : out[j].time + 4;
    }
    return out;
  }

  /* ── 舞台 ─────────────────────────────────────────────────── */
  var stage, elPrev, elCur, elNext, elMeta, elHint;
  var lines = [];
  var stageAlbum = '';
  var stageTrack = '';
  var loading = false;
  var loadSeq = 0;
  /* 已受理但還沒解析完的「開舞台」請求（見 openFor）：{ zh, title, fail } */
  var pending = null;
  var rafId = 0;
  var lastIdx = -2;
  var active = false;

  function ensureDom() {
    if (stage) return true;
    stage = document.getElementById('lyricStage');
    if (!stage) return false;
    elPrev = stage.querySelector('.ls-prev');
    elCur = stage.querySelector('.ls-cur');
    elNext = stage.querySelector('.ls-next');
    elMeta = stage.querySelector('.ls-meta');
    elHint = stage.querySelector('.ls-hint');
    stage.addEventListener('click', function (e) {
      if (e.target.closest('[data-ls-close]')) close();
    });
    return true;
  }

  /* 把一行按字元拆成 span，供扫光逐字点亮。
     中文没有词边界，按字拆比按空格拆更接近原曲的推进节奏。 */
  function paintLine(host, text, chars) {
    host.textContent = '';
    if (chars === false) {
      host.textContent = text;
      return null;
    }
    var frag = document.createDocumentFragment();
    var spans = [];
    for (var i = 0; i < text.length; i++) {
      var sp = document.createElement('span');
      sp.className = 'ls-ch';
      sp.textContent = text[i];
      frag.appendChild(sp);
      spans.push(sp);
    }
    host.appendChild(frag);
    return spans;
  }

  /* 当前行进度：0..1，决定点亮到第几个字 */
  function sweep(spans, line, now, hint) {
    if (!spans || !spans.length) return;
    var lit;
    if (hint.sweep === 'instant') {
      lit = spans.length;
    } else {
      var span = Math.max(0.001, line.end - line.time);
      lit = Math.round(((now - line.time) / span) * spans.length);
    }
    if (lit < 0) lit = 0;
    if (lit > spans.length) lit = spans.length;
    for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-on', i < lit);
  }

  function currentIndex(now) {
    var lo = 0;
    var hi = lines.length - 1;
    var hit = -1;
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (lines[mid].time <= now) {
        hit = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return hit;
  }

  /* 前奏阶段（第一句还没到）也要有内容：把首句当作当前行灰着显示，
     否则整屏空白，看起来像坏了 */
  function paint(now) {
    var idx = currentIndex(now);
    var head = idx < 0 && lines.length ? 0 : idx;
    if (head !== lastIdx) {
      lastIdx = head;
      var cur = head >= 0 ? lines[head] : null;
      var prev = head - 1 >= 0 ? lines[head - 1] : null;
      var next = head + 1 < lines.length ? lines[head + 1] : null;
      elPrev.textContent = prev ? prev.text : '';
      elNext.textContent = next ? next.text : '';
      if (cur) {
        var hint = hintFor(cur.end - cur.time);
        var spans = paintLine(elCur, cur.text, REDUCED.matches ? false : true);
        elCur.setAttribute('data-cls', hint.cls);
        /* 前奏里这一句还没开始唱，一个字都不点亮 */
        if (idx >= 0) sweep(spans, cur, now, hint);
      } else {
        paintLine(elCur, '', false);
      }
    } else if (head >= 0 && idx >= 0 && !REDUCED.matches) {
      var line = lines[head];
      var sp = elCur.querySelectorAll('.ls-ch');
      if (sp.length) sweep(sp, line, now, hintFor(line.end - line.time));
    }
  }

  function tick() {
    if (!active) return;
    var a = document.getElementById('plAudio');
    if (a) {
      var t = a.currentTime;
      if (lines.length) paint(t);
    }
    rafId = window.requestAnimationFrame(tick);
  }

  function setMeta(text) {
    if (elMeta) elMeta.textContent = text || '';
  }

  function open(albumTitle, trackZh) {
    if (!ensureDom()) return;
    var a = document.getElementById('plAudio');
    if (!a || !a.src) {
      toastHint('先播放一首再開歌詞');
      return;
    }
    if (!lines.length) {
      toastHint(
        loading
          ? '歌詞載入中，稍後再試'
          : '這首沒有本機歌詞（歌詞與音檔放同一目錄，跑 npm run audio -- --write）'
      );
      return;
    }
    stage.hidden = false;
    stage.classList.add('is-open');
    document.documentElement.classList.add('has-lyrics');
    active = true;
    lastIdx = -2;
    setMeta((albumTitle || stageAlbum) + ' · ' + trackZh + ' · ' + lines.length + ' 行');
    if (elHint) {
      elHint.textContent = REDUCED.matches ? '減少動效：不逐字掃光' : '逐行歌詞，掃光由行時長插值';
    }
    paint(a.currentTime);
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  }

  /* 就地說明，不彈 toast 搶焦點：舞台本身是模態層 */
  function toastHint(text) {
    var el = document.getElementById('lsHint');
    if (el) el.textContent = text;
  }

  function close() {
    if (!stage) return;
    active = false;
    /* 關掉舞台時把「待開」的請求一起取消：解析完成後不該再自己彈回來 */
    pending = null;
    stage.classList.remove('is-open');
    stage.hidden = true;
    document.documentElement.classList.remove('has-lyrics');
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    var b = document.querySelector('.pl-btn--lyrics');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function isOpen() {
    return !!stage && !stage.hidden;
  }

  /* ── 歌曲檔案的歌詞入口 ─────────────────────────────────────
     檔案（Song Archive）以「一首歌」為單位，它的閱讀歌詞鈕按下去時，
     歌詞未必已經在記憶體裡（plLoad 的預載是非同步的）。這裡把
     「沒有歌詞檔」與「還在解析」兩件事分開講清楚：
       回傳 false → 這首沒有歌詞，呼叫方就地說明，不要開空舞台；
       回傳 true  → 已受理；解析完成就自己開舞台。
     失敗訊息交給呼叫方（onFail），因為只有它知道自己那塊畫面的文案在哪。 */
  function openFor(albumTitle, track, onFail) {
    if (!ensureDom()) {
      if (onFail) onFail('歌詞舞台不在這一頁');
      return false;
    }
    if (!track || !track.lyrics) {
      if (onFail) onFail('這首沒有本機歌詞');
      return false;
    }
    var a = document.getElementById('plAudio');
    if (!a || !a.src) {
      if (onFail) onFail('先播放一首再開歌詞');
      return false;
    }
    if (lines.length && stageTrack === track.zh) {
      open(albumTitle, track.zh);
      return true;
    }
    pending = { zh: track.zh, title: albumTitle || '', fail: onFail || null };
    if (!loadFor(albumTitle, track)) {
      pending = null;
      if (onFail) onFail('這首沒有本機歌詞');
      return false;
    }
    return true;
  }

  /* 受理後又被取消（例如檔案已經關掉）：不要再自己把舞台打開 */
  function cancel() {
    pending = null;
  }

  /* 解析結束的收尾：只有「這一首」的待開請求會被兌現，
     換歌後才回來的舊回應一律作廢（與 lines 的序號守衛同一個理由） */
  function settlePending(ok, zh) {
    var p = pending;
    if (!p || p.zh !== zh) return;
    pending = null;
    if (ok) open(p.title, zh);
    else if (p.fail) p.fail('歌詞載入失敗');
  }

  /* 换歌：读 lyrics 路径并解析。异步取，不阻塞播放；取不到就清空，
     舞台打开时会就地说明「这首没有本机歌词」。
     参数只有专辑名（给说明行用）与曲目本身；专辑 id 曾经在签名里但从未被用到，
     留着一个不讀的参数只会让调用端多传一个错的位（openFor 一度就因此传错位、
     被当成「这首没有本机歌词」）。 */
  function loadFor(albumTitle, track) {
    lines = [];
    lastIdx = -2;
    stageAlbum = albumTitle || '';
    loading = false;
    var rel = track && track.lyrics;
    if (!rel) return false;
    loading = true;
    var wantZh = (track && track.zh) || '';
    /* 快速連按上下首時，先發的請求可能後到：用序號丟掉過期回應 */
    var seq = ++loadSeq;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', rel, true);
    xhr.onload = function () {
      if (seq !== loadSeq) return;
      loading = false;
      if (xhr.status && xhr.status !== 200 && xhr.status !== 0) {
        settlePending(false, wantZh);
        return;
      }
      var parsed = parseLrc(xhr.responseText, track && track.zh);
      if (!parsed.length) {
        settlePending(false, wantZh);
        return;
      }
      lines = parsed;
      lastIdx = -2;
      stageTrack = (track && track.zh) || '';
      /* 舞台开着时换歌：说明行也要跟着换，否则停在上一首的行数 */
      if (isOpen()) {
        setMeta(stageAlbum + ' · ' + stageTrack + ' · ' + lines.length + ' 行');
        var a = document.getElementById('plAudio');
        paint(a ? a.currentTime : 0);
      }
      /* 檔案（Song Archive）按下閱讀歌詞時舞台還沒開，這裡把它接上 */
      settlePending(true, wantZh);
    };
    xhr.onerror = function () {
      if (seq !== loadSeq) return;
      loading = false;
      settlePending(false, wantZh);
    };
    xhr.send(null);
    return true;
  }

  window.JCLyrics = {
    parseLrc: parseLrc,
    hintFor: hintFor,
    loadFor: loadFor,
    open: open,
    openFor: openFor,
    cancel: cancel,
    close: close,
    isOpen: isOpen,
    toggle: function (albumTitle, trackZh) {
      if (isOpen()) close();
      else open(albumTitle, trackZh);
    }
  };
})();
