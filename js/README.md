# js/ — 腳本手冊

- 職責：資料出口與全部檢視邏輯
- 被誰依賴：`index.html` 依序載入 `data.js` 再載入 `app.js`

## 檔案

### `data.js`（生成物，勿手改）

- 產生者：`_data/build.mjs`，指令 `npm run build`
- 職責：把事實與文案攤成 `window.JC`
- 內容：`albums` / `tracks` / `eras` / `collaborators` / `longest` / `shortest` /
  `growth` / `gaps` / `signature` / `distribution` / `stats` / `toSimplified`
- 內嵌 OpenCC 的 `TSPhrases` 與 `TSCharacters` 供 `toSimplified()` 使用
- 改這裡的欄位等於改檢視層契約，須同步 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

### `app.js`（手寫，IIFE，無依賴）

- 職責：讀 `JC` 渲染全部展示面、綁定互動、處理繁簡轉換
- 不在其中計算任何統計量；數字一律取自 `JC`

主要函式分組：

| 分組 | 函式 |
|---|---|
| 繁簡 | `walkText` `walkEl` `localize` `setLang` |
| 建構工具 | `el` `esc` `srcset` `frag` `iconPaths` `playBtn` |
| 開場 | `runBoot` `finishBoot` |
| 各展示面 | `renderFan` `renderFigures` `renderMarquee` `renderRings` `renderRack` `renderChrono` `renderEras` `renderWall` `renderGrowth` `renderGaps` `renderBars` `renderFacts` `renderRanks` `renderCollab` `renderPicks` |
| 曲目總表 | `buildIndex` `renderCat` `renderCatBase` |
| 抽屜 | `openSheet` `closeSheet` `stepSheet` `trapFocus` |
| 播放 | `trackOf` `syncPlayingRows` `plPaint` `plLoad` `plSelect` `plStep` `plClose` `setMediaSession` `initAudio` `syncRangeFill` |
| 揭示 | `observeReveals` |
| 其他 | `toast` `magnetize` `bindChrome` `bind` `init` |

## 變更影響路由

改這裡 → 必跑：

- `data.js` 或其欄位 → `npm run build`，再跑站點 E2E
- `app.js` 任何渲染函式 → `npm run lint` + 站點 E2E（結構計數 20 項）
- 播放相關 → 額外實測：播放 / 暫停 / 上下首 / 拖動 / 空白鍵 / 關閉後清空 `src`
- `localize` 相關 → 額外確認播放中切換繁簡不中斷音訊
- 新增頂層函式 → 同步更新上表

## 已知坑

- 背景分頁的 CSS transition 會凍結，用自動化驗樣式前必須先讓頁面置前
- `localize()` 以 WeakMap 快取原文；動態覆寫 `aria-label` 等屬性前須先清快取，
  否則切換語言會還原成舊值

使用約束見 [AGENTS.md](AGENTS.md)。
