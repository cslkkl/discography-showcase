# 声之年轮 架构说明

記錄不變的設計決策、資料流與防錯清單。檔案級清單見各目錄 `README.md`。

## 目標與硬約束

- 目標：把十六張專輯陳列成一個可信、耐看、可長期維護的靜態站
- 硬約束一：零執行期依賴，無建置步驟，雙擊 `index.html` 即可開
- 硬約束二：離線可用。無網路時頁面完整呈現，僅試聽控制自行停用
- 硬約束三：唯一深色主題、唯一強調色。不提供淺色模式，不提供主題切換

## 資料流

```
iTunes Lookup API ──┐
MusicBrainz ────────┼─→ _data/albums-raw.json ─┐
封面平均色 ─────────┘                          │
                                               ├─→ _data/build.mjs ─→ js/data.js ─→ window.JC
_data/META 編輯層（繁體文案）───────────────────┘                                   │
                                                                                    ↓
                                                              js/app.js 各 render 函式 ─→ DOM
```

- 事實（專輯、曲目、時長、試聽網址）全部來自 `albums-raw.json`，由 `build.mjs` 匯出
- 文案（標題、簡介、分期說明）來自 `build.mjs` 內的 `META`，以繁體撰寫
- 檢視層不自行計算統計量；所有數字由 `build.mjs` 算好放進 `JC`

理由：檢視層與事實分離，任何一處陳列都不會與唱片事實漂移。

## 設計決策

### 繁簡轉換

- `js/data.js` 內嵌 OpenCC 的 `TSPhrases` 與 `TSCharacters` 為 `{phrases, chars}`
- 必須先套詞組再做單字轉換（最長匹配優先），否則「藉口」之類不會轉成「借口」
- 走訪節點時跳過 `SCRIPT` / `STYLE` / `NOSCRIPT` / `TEXTAREA`
- 文字與屬性原文以 WeakMap 快取，切回繁體時還原，不做二次轉換

### 版面

- 兩個圓角檔位：控制項用膠囊 `--r-pill`，面與圖用 `--r: 6px`
- 三套字體各司一職：`--f-serif` 標題、`--f-sans` 正文、`--f-num` 數字
- 橫向展櫃用 sticky 釘住 + `translate3d`；行動裝置與減少動效時降級為原生橫向捲動
- 每個展示面用不同佈局語言，不重複同一種卡片陣列

### 播放

- 音源為 Apple 隨目錄提供的官方 30 秒試聽片段，與中繼資料同一次請求返回
- 本站不儲存任何錄音，不抓取、不轉碼
- 若使用者自有音檔，`_data/local-audio.json` 登記的本機檔案優先，官方試聽留作後備
- 播放列為漸進增強：音源取不到時控制項停用並就地說明，不假裝在播

### 動效

- 全部動效由使用者互動或捲動驅動，無自動循環播放（WCAG 2.2.2）
- 捲動與指標事件以 rAF 節流，熱路徑不讀版面
- 指標效果寫入 CSS 自訂屬性，不在 JS 內逐幀設定樣式
- `prefers-reduced-motion` 下：年輪直接就位、區塊全部可見、展櫃不釘住

## 防錯清單

改動時逐條確認。

- 不要把 `body` 設為捲動容器（見 `overflow-x` 坑）
- 強調色底上的前景只能用 `--accent-on`
- 不要在 `sticky` 祖先上用 `overflow: hidden` 或 `will-change`
- 動效不得無限自動播放；`nudge` 之類提示動畫限次
- 互動元素觸控目標至少 44px；小圖示靠偽元素撐開命中區
- 焦點不得被固定層遮擋，`scroll-padding` 隨固定層高度調整
- 高對比下限：正文 4.5:1，非文字 3:1
- `js/data.js` 只由 `npm run build` 產生
- `service` 生成的網址在 `file://` 下也須可用，不得依賴伺服器

## 契約

- `window.JC` 的欄位即檢視層契約：`albums` / `tracks` / `eras` / `collaborators` /
  `longest` / `shortest` / `growth` / `gaps` / `signature` / `distribution` / `stats` / `toSimplified`
- 曲目欄位：`n` / `disc` / `zh` / `sec` / `len` / `sig` / `audio` / `preview` / `local`
- 專輯欄位：`id` / `idx` / `no` / `title` / `alt` / `en` / `year` / `dateISO` / `date` /
  `publisher` / `trackCount` / `runtime` / `runtimeSec` / `cover` / `blurb` / `tint` /
  `sourceAvg` / `tracks`
- 改動此契約須同一次改動內更新 [js/README.md](../js/README.md) 與本檔

## 版權

- 封面與錄音權利屬 JVR Music International Ltd.
- 本站為個人非商業展示，不含完整錄音，只引用官方試聽片段
- 新增任何音源前先確認授權，不得引入來源不明的整曲
