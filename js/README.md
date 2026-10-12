# js/ — 腳本手冊

- 職責：資料出口與全部檢視邏輯
- 被誰依賴：入口頁 `index.html` 載入 `data.js` + `landing.js`；
  歌手頁 `artist.html` 依序載入 `data.js` 再載入 `app.js`

## 檔案

### `data.js`（生成物，勿手改）

- 產生者：`_data/build.mjs`，指令 `npm run build`
- 形狀：`window.DISCOGRAPHY = { toSimplified, order: [歌手id], artists: { 歌手id: 展示集 } }`
- 每個展示集含原「歌手全集」的 `albums` / `tracks` / `eras` / `collaborators` /
  `longest` / `shortest` / `growth` / `gaps` / `signature` / `distribution` / `stats` /
  `toSimplified`，另加身份欄位 `id` / `name` / `en` / `seal` / `tagline` /
  `taglineEn` / `intro` / `heroFan` / `covers` / `tint`
- 內嵌 OpenCC 的 `TSPhrases` 與 `TSCharacters` 供 `toSimplified()` 使用
- 改這裡的欄位等於改檢視層契約，須同步 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

### `app.js`（歌手頁，手寫，IIFE，無依賴）

- 職責：讀 `?a=<id>` 取得對應歌手的展示集，渲染全部展示面、綁定互動、處理繁簡轉換
- 入口處把展示集賦值給內部變量 `JC`，因此渲染器內部全部沿用 `JC.*`，換歌手不需要改渲染函式
- 沒有參數或 id 不存在 → `location.replace('index.html')` 回入口
- 頁面上所有會寫出歌手名字的槽位（標題、描述、印章、品牌副題、主視覺眉題與首行、
  MediaSession 的 artist）一律由 `applyArtistChrome()` 從資料填充
- 歌手切換器：`bindArtistSwitch()` 由 `DISCOGRAPHY.order` 生成選單，當前歌手打勾，
  選單尾附「所有歌手」回入口；點外關閉、`Esc` 關閉

主要函式分組：

| 分組 | 函式 |
|---|---|
| 歌手解析 | 檔案頂部：`?a=` → `JC`，無效即回入口 |
| 繁簡 | `walkText` `walkEl` `localize` `setLang` |
| 建構工具 | `el` `esc` `srcset` `frag` `iconPaths` `playBtn` |
| 開場 | `runBoot` `finishBoot` |
| 各展示面 | `renderFan` `renderFigures` `renderMarquee` `renderRings` `renderRack` `renderChrono` `renderEras` `renderWall` `renderGrowth` `renderGaps` `renderBars` `renderFacts` `renderRanks` `renderCollab` `renderPicks` |
| 曲目總表 | `buildIndex` `renderCat` `renderCatBase` |
| 抽屜 | `openSheet` `closeSheet` `stepSheet` `trapFocus` |
| 播放 | `trackOf` `syncPlayingRows` `plPaint` `plLoad` `plSelect` `plStep` `plClose` `setMediaSession` `initAudio` `syncRangeFill` |
| 歌手外觀 | `applyArtistChrome` `bindArtistSwitch` |
| 揭示 | `observeReveals` |
| 其他 | `toast` `magnetize` `bindChrome` `bind` `init` |

### `landing.js`（入口頁，手寫，IIFE，無依賴）

- 職責：渲染歌手索引（封面疊放、名稱、年代跨度、專輯與曲目數），連到 `artist.html?a=<id>`
- 內含一份精簡的繁簡轉換，複用 `DISCOGRAPHY.toSimplified`；刻意不引入 app.js，
  避免為一個靜態頁載入整個渲染器。與 app.js 的 localize 是兩份實作，屬已知取捨
- 語言選擇與歌手頁共用同一個 localStorage 鍵 `jc-lang`

## 變更影響路由

改這裡 → 必跑：

- `data.js` 或其欄位 → `npm run build`，再跑站點 E2E
- `app.js` 任何渲染函式 → `npm run lint` + 站點 E2E（結構計數 20 項）
- 播放相關 → 額外實測：播放 / 暫停 / 上下首 / 拖動 / `空格` / 關閉後清空 `src`
- `localize` 相關 → 額外確認播放中切換繁簡不中斷音訊
- 入口頁 / 切換器 → 額外實測：入口渲染、點進歌手、無參數與無效 id 回入口、
  `file://` 全鏈路、切換器開合與 `Esc`
- 新增頂層函式 → 同步更新上表

## 已知坑

- 背景分頁的 CSS transition 會凍結，用自動化驗樣式前必須先讓頁面置前
- app.js 的 localize 以 WeakMap 快取原文；動態覆寫 `aria-label` 等屬性前須先清快取，
  否則切換語言會還原成舊值。landing.js 的精簡版同樣只在首次寫入時快取
- 入口頁與歌手頁共用 `jc-lang`；兩頁的 `<html data-lang>` 由各自的腳本維護

使用約束見 [AGENTS.md](AGENTS.md)。
