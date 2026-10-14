# js/ — 腳本手冊

- 職責：資料出口與全部檢視邏輯
- 被誰依賴：入口頁 `index.html` 載入 `data.js` + `landing.js`；
  歌手頁 `artist.html` 依序載入 `data.js`、`lyrics.js`、`app.js`

## 檔案

### `data.js`（生成物，勿手改）

- 產生者：`_data/build.mjs`，指令 `npm run build`
- 形狀：`window.DISCOGRAPHY = { toSimplified, order: [歌手id], artists: { 歌手id: 展示集 } }`
- 每個展示集含原「歌手全集」的 `albums` / `tracks` / `eras` / `collaborators` /
  `longest` / `shortest` / `growth` / `gaps` / `signature` / `distribution` / `stats` /
  `toSimplified`，另加身份欄位 `id` / `name` / `en` / `seal` / `tagline` /
  `taglineEn` / `intro` / `heroFan` / `covers` / `tint`。
  `covers` 仍在使用中：入口頁 `landing.js` 取每位歌手 `covers` 前三張組成封面組；
  `heroFan` 只在歌手頁主視覺還是「精選五張」時用過，改成走完 `albums` 的輪播後
  已無取用者（保留是為了不改資料契約，新渲染不要再依賴它）
- 內嵌 OpenCC 的 `TSPhrases` 與 `TSCharacters` 供 `toSimplified()` 使用
- 改這裡的欄位等於改檢視層契約，須同步 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

### `app.js`（歌手頁，手寫，IIFE，無依賴）

- 職責：讀 `?a=<id>` 取得對應歌手的展示集，渲染全部展示面、綁定互動、處理繁簡轉換
- 入口處把展示集賦值給內部變量 `JC`，因此渲染器內部全部沿用 `JC.*`，換歌手不需要改渲染函式
- 沒有參數或 id 不存在 → `location.replace('index.html')` 回入口
- 頁面上所有會寫出歌手名字的槽位（標題、描述、印章、品牌副題、主視覺眉題與首行、
  MediaSession 的 artist）一律由 `applyArtistChrome()` 從資料填充
- 歌手切換器：`bindArtistSwitch()` 由 `DISCOGRAPHY.order` 生成選單，當前歌手打勾，
  選單尾附「所有歌手」回入口；點外關閉、`Esc` 關閉。
  點歌手項目是**就地換資料**（`applyArtist`），不整頁導航，所以正在播的歌不中斷

主要函式分組：

| 分組 | 函式 |
|---|---|
| 歌手解析 | 檔案頂部：`?a=` → `JC`，無效即回入口 |
| 繁簡 | `walkText` `walkEl` `localize` `setLang` |
| 建構工具 | `el` `esc` `srcset` `frag` `iconPaths` `playBtn` |
| 開場 | `runBoot` `finishBoot` |
| 主視覺輪播 | `renderFan` `fanPaint` `fanGo` `fanOffset` `fanHover`（走完 `albums`，點兩側翻、點中央開抽屜、方向鍵／Home／End；懸停或聚焦時該張跳出來、其餘照視覺方向讓開） |
| 各展示面 | `renderAll` `resetHosts` `renderFigures` `renderMarquee` `renderRings` `renderRack` `renderChrono` `renderEras` `renderWall` `renderGrowth` `renderGaps` `renderBars` `renderFacts` `renderRanks` `renderCollab` `renderPicks` `renderChapters` |
| 展櫃捲動 | `measureRack` `paintRackFromScroll` `rackStepBy`（原生橫向捲動；拖曳、左右箭頭、←→／Home／End 共用一條路徑） |
| 曲目總表 | `buildIndex` `renderCat` `renderCatBase` |
| 抽屜 | `openSheet` `closeSheet` `stepSheet` `trapFocus` |
| 播放 | `trackOf` `syncPlayingRows` `plPaint` `plLoad` `plSelect` `plStep` `plClose` `setMediaSession` `initAudio` `syncRangeFill` |
| 歌手外觀 | `applyArtistChrome` `bindArtistSwitch` `applyArtist` |
| 揭示 | `observeReveals` |
| 其他 | `toast` `magnetize` `bindChrome` `bind` `init` |

就地在歌手間切換：

- `init()` 與 `applyArtist(id)` 共用 `renderAll()`，不各留一份渲染清單
- `applyArtist()` 先 `resetHosts()` 再重繪，最後 `syncPlayingRows()` 重新標記正在播的那列；
  `<audio>` 不重建，所以換歌手時播放不中斷
- `resetHosts()` 清的是 `appendChild` 型宿主（`APPEND_HOSTS`）與模組級 `index`／`fanCards`／
  `cards`／`ringNodes`／`legendNodes`／`ringsLive`；`buildIndex()` 自己也清 `index`
- 換歌手用 `history.pushState` 更新 `?a=`，`popstate` 就地套用，不觸發整頁導航

### `lyrics.js`（歌手頁全屏歌詞，手寫，IIFE，無依賴）

- 職責：解析逐行 LRC 並驅動全屏歌詞舞台（`#lyricStage`），對外只暴露 `window.JCLyrics`
- 資料來源：`track.lyrics`（只有 `npm run build:local` 才會寫入；公開產物連鍵都沒有）。
  歌詞檔是與音檔同目錄的 sidecar `.lrc`，由 `_data/local-audio.mjs` 一併登記
- 解析（`parseLrc(text, title)`）：只取時間軸行；丟掉 `[ti:]` 等標籤、製作人員行
  （`詞/曲/編曲/混音…`）、**演唱者標記**（整行只有「男：」「女：」「合：」這類）與
  **標題頭行**（`<歌名> - 周杰倫 (Jay Chou)`）。
  標題比對要**先轉簡體再比**，因為歌詞檔是簡體而站點曲名是繁體
- 短句降級（`hintFor`）：依行時長分 `micro < 0.7s` / `short < 1.6s` / `normal`，
  分別對應「不做轉場、掃光瞬時」「快速」「常規」。思路取自 Folia 的 renderHints，
  閾值按本項目的行長分布重訂
- 掃光（`sweep`）：逐行 LRC 沒有逐字時間軸，點亮進度由**行時長在字元間插值**
- 前奏期（索引 < 0）顯示首句但一字不點亮，避免整屏空白
- 換歌用序號（`loadSeq`）丟棄過期回應：快速連按上下首時先發的請求可能後到
- 減少動效時不生成逐字節點，整句直接呈現
- 與 app.js 的分工：app.js 在 `plLoad` 預載歌詞、綁按鈕與 `Esc`、關播放列時收舞台；
  舞台自身的渲染與時間軸完全在 lyrics.js 內

### `landing.js`（入口頁，手寫，IIFE，無依賴）

- 職責：渲染立體唱片架（當前歌手的封面組、姓名列、統計與進入入口），
  綁定切換與選擇，連到 `artist.html?a=<id>`
- 歌手清單與順序取自 `DISCOGRAPHY.order`；封面取 `covers` 前三張，
  統計取 `stats`，強調色取 `theme.accent` / `accentOn`，不另寫歌手陣列
- 舞台位置由最小環形位移決定（`offsetOf`），`|off| <= 2` 留在舞台上，
  其餘收進 `hidden` 不佔焦點；切換只改 `data-off` 與 `aria-pressed`，不重建 DOM
- 操作：姓名直選、點兩側封面選中、點中央封面進入該歌手、點舞台空白處進退一位、
  拖曳與滑動、控制區方向鍵與 Home／End；選擇記在 sessionStorage
  `discography-selected-artist`，失效即回退首位
- 0 位歌手顯示空狀態並收起唱片架
- 內含一份精簡的繁簡轉換，複用 `DISCOGRAPHY.toSimplified`；刻意不引入 app.js，
  避免為一個靜態頁載入整個渲染器。與 app.js 的 localize 是兩份實作，屬已知取捨
- 動態寫入（姓名、統計、aria-label）一律走 `setText` / `setAttr`，
  由它們記住繁體原文；切歌手後再切語言才不會還原成上一位歌手
- 語言選擇與歌手頁共用同一個 localStorage 鍵 `jc-lang`

## 變更影響路由

改這裡 → 必跑：

- `data.js` 或其欄位 → `npm run build`，再跑站點 E2E
- `app.js` 任何渲染函式 → `npm run lint` + 站點 E2E（結構計數 20 項）
- 換歌手 / `applyArtist` / `resetHosts` → 額外實測：連切多位再切回首位後，
  曲目表、卷宗、年表、年代、封面牆、精選、年輪圖例的數量皆為該歌手正確值且零累積；
  `#plAudio` 未重建、`paused` 恆為 false、`currentTime` 持續增加；上一頁／下一頁正確
- 主視覺輪播 / `fanHover` → 額外實測：懸停最右與最左那張時，其餘卡片往同側讓開、
  被指那張放大、移出即精確回位；鍵盤聚焦同效
- 展櫃 → 額外實測（**先點「展櫃」分頁再量**）：`scrollWidth > clientWidth`、
  箭頭各捲一張且到端 disabled、拖曳可捲、拖曳不誤開抽屜、←→／Home／End、HUD 編號與進度條
- 跑馬燈 → 額外實測：捲動時隨之平移；指標在帶子右半整條往右推、左半往左推，
  移出後回位；`hover: none` 與 `prefers-reduced-motion` 下不做指標平移
- `lyrics.js` 或歌詞舞台 → 額外實測：解析器（標題頭行／製作人員行必須消失、
  副歌重複歌名必須保留）、播放中掃光隨時間推進、換曲自動重載、
  `Esc` 與關閉鈕、減少動效不逐字、無歌詞時就地說明不開空舞台
- 播放相關 → 額外實測：播放 / 暫停 / 上下首 / 拖動 / `空格` / 關閉後清空 `src`
- `localize` 相關 → 額外確認播放中切換繁簡不中斷音訊
- 入口頁 / 切換器 → 額外實測：入口渲染、點進歌手、無參數與無效 id 回入口、
  `file://` 全鏈路、切換器開合與 `Esc`
- `landing.js` → 額外實測：八位歌手逐一選擇後姓名、統計、強調色與 `href`
  一致；姓名直選、點封面選中、點空白處進退一位、拖曳與滑動（未達 40px 不切換）、
  方向鍵與 Home／End、連點不失焦；
  0／1／2／6 位歌手與缺封面的 fixture；停用儲存時仍可瀏覽
- 新增頂層函式 → 同步更新上表

## 已知坑

- 背景分頁的 CSS transition 會凍結，用自動化驗樣式前必須先讓頁面置前
- app.js 的 localize 以 WeakMap 快取原文；動態覆寫 `aria-label` 等屬性前須先清快取，
  否則切換語言會還原成舊值。landing.js 同樣以 WeakMap 記原文，因此動態內容一律走
  `setText` / `setAttr` 重設原文——否則切換歌手後再切語言會還原成上一位歌手
- 入口頁與歌手頁共用 `jc-lang`；兩頁的 `<html data-lang>` 由各自的腳本維護
- 入口頁的 `main` 帶 `.ld-main` 類，抵掉全站 `main { padding-top: var(--nav-h) }`：
  入口沒有固定頂欄，那份讓位會把首屏內容推到折線下方

使用約束見 [AGENTS.md](AGENTS.md)。
