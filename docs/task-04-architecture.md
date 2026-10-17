# Task 04 實作架構與介面契約

上游以本機 Folia 為移植基準，版本與 commit 見 `stage/vendor/folia/SOURCE.md`。
需求以 [Task 04 規格](task-04-folia-stage.md) 為準，本檔只定介面與檔案邊界，方便多人分工。

## 一、分層

```
artist.html / js/app.js / js/lyrics.js      站點主體：零執行期依賴、無建置
        │  window.JCLyrics（既有契約，保持）
        ▼
js/lyric-stage.js                            舞台裝載器（經典腳本）
        │  按需 import('<stage 產物>')        未進舞台前不載入任何渲染器
        ▼
stage/                                       獨立子專案：可有執行期依賴與獨立建置
  vendored/folia/src/**                      上游原始碼逐字複製（AGPL-3.0，未修改）
  src/entry.jsx                              舞台掛載入口 mount/update/unmount
  src/bridge/**                              站點 ↔ Folia props 適配
  src/theme/**                               第一層：整曲主題（AI + 快取 + 鎖定）
  src/segments/**                            第二層：段落調度
  src/shims/**                               上游外部模組的替身
  dist/**                                    建置產物，供站點按需載入
tools/                                       本機工具（不進公開產物）
  theme-service.mjs                          AI 主題服務（密鑰只在這裡讀）
  analyze-audio.mjs                          完整音檔預分析 → 段落 sidecar
```

## 二、硬性契約

### 2.1 音訊唯一來源

- 全站只有一個 `<audio id="plAudio">`，在 `artist.html`，由 `js/app.js` 擁有。
- 舞台**不得**建立第二個 `HTMLAudioElement`，不得 `new Audio()`，不得接 `AudioContext` 的
  `createMediaElementSource` 之外的解碼路徑去播同一首歌。
- 舞台讀時間的唯一方式是 `bridge` 傳進來的取樣函式；停 / 播 / 拖進度 / 上下首全部由站點驅動。

`bridge` 對外介面（`stage/src/bridge/audio-bridge.js`）：

```js
createAudioBridge(audioEl) => {
  getTime(): number          // 當前播放秒數
  isPaused(): boolean
  getDuration(): number
  subscribe(cb): () => void  // 站點事件（timeupdate/play/pause/seeked/ratechange）
  seek(sec): void            // 交給站點；舞台不自己設 currentTime
  dispose(): void            // 解綁全部監聽、清 rAF
}
```

### 2.2 舞台掛載 API（`js/lyric-stage.js` 與 `stage/src/entry.jsx` 之間的唯一介面）

```js
mount(hostEl, payload) => Promise<StageHandle>
payload = {
  mode: 'classic'|'monet'|... ,      // 允許 null → 用主題推薦值
  theme: SongTheme,                  // 見 2.4，可先給封面主題
  lines: FoliaLine[],                // 見 2.3
  segments: StageSegment[] | null,   // 見 2.5，null = 不分段
  coverUrl: string | null,
  song: { id, title, artist, album, year },
  audio: { getTime, isPaused, getDuration, subscribe, seek },
  reducedMotion: boolean
}
StageHandle = {
  setMode(mode): Promise<void>       // 平滑換模式，不黑屏
  applyTheme(theme): void            // 遲到的 AI 主題；若已手動鎖定則忽略
  applySegments(segments): void
  setPaused(paused): void
  dispose(): Promise<void>           // 停動畫迴圈、釋放 WebGL/Pixi/監聽/紋理
}
```

### 2.3 歌詞形狀（`FoliaLine`）

站點既有 `js/lyrics.js` 的 `{ time, text, end }` 逐行形狀**不變**。
舞台側 `src/bridge/lines.js` 轉成 Folia `Line`：

```js
Line = {
  words: [{ text, startTime, endTime }],  // 由漸層合成；標為估算
  startTime, endTime, fullText,
  renderHints?, isChorus?, wordSegments?
}
```

- 逐行 LRC 沒有逐字時間 → 依 Folia `utils/lyrics/parserCore.ts` 的權重規則合成，
  並在 `Line.wordsSource = 'estimated'` 標明（可選欄位，不影響上游渲染）。
- 有 `<mm:ss.xx>` 增強標籤時用真時間軸，標 `real`。

### 2.4 主題形狀（`SongTheme`，兩層共用）

```js
SongTheme = {
  mood: string, confidence: number,
  colors: { background, primary, accent, secondary, textOnBackground },
  mode: string, background: string, intensity: 'calm'|'normal'|'chaotic',
  rationale: string,
  provenance: { source: 'ai'|'cover'|'manual', model?, promptVersion, inputFingerprint, generatedAt }
}
```

對應上游 `Theme`（`src/types.ts`）由 `src/theme/toFoliaTheme.js` 轉換。
配色一律過對比度檢查（正文 ≥ 4.5:1）。

### 2.5 段落形狀（`StageSegment`）

```js
StageSegment = {
  start, end,                    // 秒，有限、start < end、可排序、不越曲長
  label, kind: 'intro'|'verse'|'chorus'|'bridge'|'instrumental'|'outro'|'neutral',
  energy, mood, confidence,
  mode: string|null,             // null = 沿用整體模式
  theme: Partial<SongTheme>,
  background: string|null,
  transition: 'none'|'fade'|'crossfade'
}
```

## 三、檔案寫入邊界（不得跨）

| 工作流 | 擁有 |
| --- | --- |
| stage-build | `stage/**`（`stage/vendored/**` 只複製不修改） |
| baseline | `css/style.css`（僅 1100px 前那段）、`artist.html`（僅播放器註解）、`js/app.js` |
| ai-analysis | `tools/**`、`storage/**`（主題快取） |
| stage-integrate | `js/lyric-stage.js`（新）、`js/lyrics.js`、`artist.html`（僅舞台節） 、`css/style.css`（僅舞台節） |
| docs | `docs/**`、`AGENTS.md`、`js/README.md`、`css/README.md` |

## 四、上游同步規則

`stage/vendored/` **不進版本庫**（根 `.gitignore` 已排除）。本機倉庫早有同類規則：
外部參考副本（`folia-major/`）絕不入庫。上游原始碼改用「可重建落盤」：

```powershell
node stage/vendor.mjs            # 依固定 commit 從 FOLIA_SRC 落盤 + 寫 MANIFEST.json
node stage/vendor.mjs --verify   # 只驗雜湊，不複製
```

- 來源預設 `../folia-major`，可用 `FOLIA_SRC` 覆寫；HEAD commit 不等於固定值就拒絕
- `MANIFEST.json` 逐檔記相對路徑、大小與 SHA-256，讓「落盤內容」可獨立複核
- **上游檔一律逐字複製、不修改**。需要改行為時：
  1. 優先在上游選項 / props 層解決；
  2. 真的非得改上游檔案時，改動寫成 `stage/patches/*.patch`，在 `stage/SOURCE.md` 記錄，
     建置腳本先複製再套 patch，讓「上游原文」與「我們的修改」永遠可分辨。
- 需要替身（stub）時放 `stage/src/shims/**`，每個替身都要在 `stage/SOURCE.md` 記
  「替換了哪個上游模組、為什麼、替身做什麼」。不得用簡化效果冒充某個模式。

入庫的是三份小而關鍵的檔案：`stage/SOURCE.md`（來源清單）、`stage/LICENSE.folia`（上游
AGPL-3.0 全文）、`stage/patches/**`。

## 五、許可

- 站點其餘部分維持 MIT（`LICENSE` 不動）。
- `stage/vendored/folia/**` 為 Folia 的 AGPL-3.0 原始碼，我們**不修改**它。
  版權聲明與許可全文見 `stage/LICENSE.folia`；來源、版本、commit、複製範圍見 `stage/SOURCE.md`。
- 舞台模組（`stage/src/**`，我們的適配層）與站點其餘部分不是同一個授權整體：
  兩者由 `js/lyric-stage.js` 的動態 `import()` 在**執行期**連接，檔案邊界清楚、可分別取出。
  但這是**技術事實的陳述，不是法律結論**——AGPL 對「衍生作品」「對應源碼」的適用範圍
  需由維護者判斷。本專案**不自行發布、部署或分發**這個模組，並在交付說明中
  把問題具體列出（見 `docs/upgrade-progress.md` 的受阻表）。
- 任何情況下都不得把導入的 Folia 代碼重新標成 MIT，也不得改動整站的 `LICENSE`。
