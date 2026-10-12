# 声之年轮 架构说明

記錄不變的設計決策、資料流與防錯清單。檔案級清單見各目錄 `README.md`。

## 目標與硬約束

- 目標：一套可复用的歌手唱片陳列模板——按歌手陳列完整錄音室目錄，
  現收錄周杰倫，新增歌手不需要改渲染層
- 硬約束一：零執行期依賴，無建置步驟，雙擊 `index.html` 即可開
- 硬約束二：離線可用。無網路時頁面完整呈現，僅試聽控制自行停用
- 硬約束三：唯一深色主題、唯一強調色。不提供淺色模式，不提供主題切換

## 頁面構成

```
index.html    入口：歌手索引，點選一位歌手
artist.html   歌手頁：?a=<id> 決定陳列誰，十四個展示面都在這裡
```

## 資料流

```
_data/artists/<id>/albums-raw.json ──┐
_data/artists/<id>/colors.json ──────┼─→ _data/build.mjs ─→ js/data.js ─→ window.DISCOGRAPHY
_data/artists/<id>/meta.mjs ─────────┘                                     │
                                                     ┌─────────────────────┤
入口 index.html ←── landing.js（歌手索引）────────────┘                     │
歌手 artist.html ←── app.js（?a=<id> → artists[id] 賦值給內部 JC）───────────┘
```

- 事實（專輯、曲目、時長、試聽網址）按歌手放在 `artists/<id>/albums-raw.json`
- 文案（歌手身份、專輯標題與介紹、分期說明）放在 `artists/<id>/meta.mjs`，以繁體撰寫
- 檢視層不自行計算統計量；所有數字由 `build.mjs` 算好放進各歌手的展示集
- `app.js` 在檔案頂部把當前歌手的展示集賦值給內部變量 `JC`，
  因此渲染層與「具體是哪位歌手」解耦：換歌手不需要改任何渲染函式
- 無參數或 id 不存在時，`artist.html` 回到入口頁

理由：檢視層與「哪位歌手」及「事實」雙重解耦，任何一處陳列都不會漂移；
新增歌手 = 新增資料夾 + 重跑構建。

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
- 入場的隱藏態只掛在明確要走開場流程的頁面（根元素 `is-booting`）；
  基礎態必須可見，否則腳本失敗或換頁遺漏會讓文字永久透明
- 小字下限 12px：標籤與元資訊一律 `.75rem` 起，不低於此值
- 目錄三視圖（展櫃／封面牆／年表）共用一批資料，切換而非連續重複；
  切回展櫃要重新測量（`measureRack`），隱藏狀態下測量會得到 0
- 動效不得無限自動播放；`nudge` 之類提示動畫限次
- 互動元素觸控目標至少 44px；小圖示靠偽元素撐開命中區
- 焦點不得被固定層遮擋，`scroll-padding` 隨固定層高度調整
- 高對比下限：正文 4.5:1，非文字 3:1
- `js/data.js` 只由 `npm run build` 產生
- `artist.html` 與 `js/app.js` 不得含任何歌手專屬內容（歌名、專輯數、年份、歌手名）：
  凡是隨歌手變化的都必須由 `applyArtistChrome()` 從資料填充。
  HTML 裡的兜底文字一律留空，不留某位歌手的內容
- 跑馬燈等「清單型」區塊從 `JC.signature` 取，不得寫死歌名陣列
- `service` 生成的網址在 `file://` 下也須可用，不得依賴伺服器

## 主題分層

三層職責互斥，逐層覆蓋：

| 層 | 來源 | 覆蓋範圍 |
|---|---|---|
| 站點層 | `:root` 權杖 | 深墨底、顆粒、品牌字、佈局尺度 |
| 歌手層 | `meta.mjs` 的 `theme` | 強調色 `--accent` / `--accent-on`、印章字、主視覺題名、母題 `data-motif` |
| 專輯層 | 封面派生（`vivid` + `lum`） | 抽屜面板內的 `--accent` / `--accent-on` |

- 歌手層由 `applyArtistChrome()` 寫入根元素：CSS 變量 + `data-artist` + `data-motif`。
  全站樣式讀變量，換歌手即換色，無需複製樣式
- 主視覺題名 `heroTitle` 取歌手本名，不得自創名號；題名超過四字或含拉丁字母時
  走小一號的字號檔（根元素 `data-len="long"`），避免溢出
- 母題裝飾集中在 `css/motifs.css`，按 `data-motif` 選組；克制原則：
  只做氛圍與細節（淡墨暈、印痕描邊），不改版式、不動正文對比度
- 專輯層在構建期從封面派生：`vivid` 為強調色，明度低於 0.18 提亮、高於 0.82 壓暗，
  文字色按明度 0.5 分界取深墨或紙白。派生結果存進專輯的 `theme`，運行時注入抽屜面板
- 入口頁每行內聯該歌手的強調色，懸停暈染與箭頭即為歌手色

理由：個性來自數據（封面、歌風、文案），而不是為每位歌手複製一份樣式；
主題機制的自由度分層供給，越靠近內容的層越具體。

## 契約

- `window.DISCOGRAPHY` 的欄位即檢視層契約：`toSimplified` / `order` / `artists`
- 每個歌手展示集的欄位：身份（`id` `name` `en` `seal` `tagline` `taglineEn` `intro`）、
  主題（`theme: { accent, accentOn, motif, heroTitle }`）、
  事實衍生（`albums` `tracks` `eras` `collaborators` `longest` `shortest` `growth` `gaps`
  `signature` `distribution` `stats`）、外觀（`heroFan` `covers` `tint`）、`toSimplified`
- 曲目欄位：`n` / `disc` / `zh` / `sec` / `len` / `sig` / `audio` / `preview` / `local`
- 專輯欄位：`id` / `idx` / `no` / `title` / `alt` / `en` / `year` / `dateISO` / `date` /
  `publisher` / `trackCount` / `runtime` / `runtimeSec` / `cover` / `blurb` / `tint` /
  `sourceAvg` / `theme` / `tracks`
- 改動此契約須同一次改動內更新 [js/README.md](../js/README.md) 與本檔

## 版權

- 封面與錄音權利屬 JVR Music International Ltd.
- 本站為個人非商業展示，不含完整錄音，只引用官方試聽片段
- 新增任何音源前先確認授權，不得引入來源不明的整曲
