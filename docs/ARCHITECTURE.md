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
index.html    入口：立體唱片架，選一位歌手
artist.html   歌手頁：?a=<id> 決定陳列誰，十四個展示面都在這裡
```

## 資料流

```
_data/artists/<id>/albums-raw.json ──┐
_data/artists/<id>/colors.json ──────┼─→ _data/build.mjs ─→ js/data.js ─→ window.DISCOGRAPHY
_data/artists/<id>/meta.mjs ─────────┘                                     │
                                                     ┌─────────────────────┤
入口 index.html ←── landing.js（立體唱片架）────────────┘                     │
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

- 兩個圓角檔位：控制項用膠囊 `--r-pill`，面與圖用 `--r: 6px`。明列例外：入口的
  `.ld-cta` 與歌手頁 `.hero-cta` 內的按鈕是**文字型按鈕**（透明底、無圓角、hover 時
  底部長出 1px 強調色細線，`.ld-cta` 的箭頭是文字符號 `→` 而非 svg），
  因為展廳入口不是膠囊按鈕；其餘圖示型控制項（頂欄、展櫃箭頭、播放列、抽屜）仍用 `--r-pill`
- 四套字體各司一職：`--f-serif` 中文標題（Noto Serif SC）、`--f-display` 拉丁銘牌
  （Cormorant Garamond，自託管 latin + latin-ext 的 400／500）、`--f-num` 數字與年份
  （Bodoni Moda）、`--f-sans` 正文與控制項（Noto Sans SC）。`--f-display` 只給那一類
  拉丁銘牌（歌手拉丁名、`SOUND ARCHIVE`、`EST. 1997`、檔案標籤），字組裡墊 Noto Serif SC，
  混排的漢字才不會掉到系統預設襯線
- 橫向展櫃是原生橫向捲動（`overflow-x: auto` 的 `.rack-viewport` + 拖曳 + 左右箭頭）；
  頁面縱向捲動不被劫持。曾用 sticky 釘住 + `translate3d` 把捲動換成橫向位移，
  等於十張專輯要一萬多像素的捲動預算才走得完，維護者反映「一定要把所有專輯翻完
  才能看下面」；行動裝置原本就是原生捲動，現在桌面與它一致
- 每個展示面用不同佈局語言，不重複同一種卡片陣列
- 指標懸停在主視覺封面時只改自訂屬性（`--hs` 縮放乘數、`--hx` 額外位移），
  避讓方向由 JS 依**視覺**位移算出（輪播是環形的，DOM 順序與視覺左右不一致）

### 播放

- 音源為 Apple 隨目錄提供的官方 30 秒試聽片段，與中繼資料同一次請求返回
- 本站不儲存任何錄音，不抓取、不轉碼
- 若使用者自有音檔，`_data/local-audio.json` 登記的本機檔案優先，官方試聽留作後備
- 播放文案隨音源型別分流（`playWords()`）：本機整首為「播放／本機音檔」，
  官方片段為「試聽／官方 30 秒試聽」，兩邊都不假裝成另一邊
- 全屏歌詞舞台（`js/lyrics.js`）：消費本機 sidecar `.lrc`，逐行呈現、逐字掃光。
  掃光進度由行時長在字元間插值（逐行 LRC 沒有逐字時間軸）；
  短句按 `micro / short / normal` 降級轉場，避免相鄰兩句動畫互相踩踏。
  舞台只在 `build:local` 產物下才有資料，公開產物不含歌詞欄位
- 播放列為漸進增強：音源取不到時控制項停用並就地說明，不假裝在播

### 動效

- 全部動效由使用者互動或捲動驅動，無自動循環播放（WCAG 2.2.2）
- 捲動與指標事件以 rAF 節流，熱路徑不讀版面
- 指標效果寫入 CSS 自訂屬性，不在 JS 內逐幀設定樣式
- `prefers-reduced-motion` 下：年輪直接就位、區塊全部可見、不做捲動位移；
  降級要連 `animation-delay` 一起歸零（只壓 duration 而留著 delay，分階段入場的元素
  會停在起始態 `opacity: 0` 近三秒）

### 主視覺換片：兩階段狀態機

換片不是直接改索引再重繪——那只得一次橫向滑動，沒有「闔上再翻開」的分段。

- `.is-shifting`（舊片退場，`FAN_OUT = 340ms`）：群組 `transform: scale(.972)`，
  暗度下放到每一張卡（`opacity: calc(var(--fo, 1) * .26)`）。
  暗度不能掛在群組上：群組 `opacity < 1` 會壓平整個 3D 子樹，外側封面會在頭尾各跳一次
- 到期才換 `fanIdx` 並重繪，然後 `.is-arriving`（新片進場，`FAN_IN = 620ms`）
  ＋ `.hero-art.is-lit`（環境光補亮一次）＋ `--amb` 換成新專輯的封面主色
- 鍵盤連按不掉步：`delta` 先累積在 `fanPending`，`fanShiftBusy` 期間只累加、不重啟計時器
- 入場錯峰（`transition-delay: calc(--i * 95ms + 240ms)` 配 1.15s 時長）不得騎在換位上：
  舊片否則要 1458–2263ms 才停穩；`.is-shifting`／`.is-arriving` 期間該延遲與時長都要歸零
- 換歌手時 `resetFanShift()` 收回全部狀態（兩個計時器、`pending`、`busy`、`is-lit`）：
  留著的計時器會在新資料上補跑一次 `fanPaint()`，把新歌手的輪播多推一格
- 縱深由**每張卡自己的** `perspective(1400px)` 提供，不是祖先的 `perspective`
  （理由見「防錯清單」的透視命中條）

## 防錯清單

改動時逐條確認。

- 不要把 `body` 設為捲動容器（見 `overflow-x` 坑）
- 強調色底上的前景只能用 `--accent-on`
- 不要在 `sticky` 祖先上用 `overflow: hidden` 或 `will-change`
- 切換歌手是就地在同一份文件內換資料（`applyArtist()`），不整頁重載：
  播放中的 `<audio>` 是獨立節點，重繪展示面時不得替換或重建它。
  重繪前必須清掉 `appendChild` 型宿主與模組級 `index`，否則畫面會悄悄疊加
- 入場的隱藏態只掛在明確要走開場流程的頁面（入口頁根元素 `ld-booting`）；
  基礎態 `is-ready` 必須可見，否則腳本失敗會讓文字永久透明
- 重疊封面堆（歌手頁 `.fan-card`、入口頁 `.ld-group`）的縱深只能用每張卡自己的
  `perspective()`：祖先 `perspective` ＋ 子層 `transform-style: preserve-3d` 會建立
  真正的 3D 脈絡，被 `translateZ` 推遠的卡片在真實指標下命中不到自己，而
  `document.elementsFromPoint` 仍回報它——**DOM 斷言驗不出這條回歸**。
  驗收一律用真實指標事件（`page.mouse.click`）與命中取樣，輔助函式不得在真實點擊失敗時
  靜默回退成 `element.click()`。見 [.agents/notes/](../.agents/notes/)
- `prefers-reduced-motion` 的降級要連 `animation-delay` 一起歸零
- 小字下限 12px：標籤與元資訊一律 `.75rem` 起，不低於此值
- 目錄三視圖（展櫃／封面牆／年表）共用一批資料，切換而非連續重複；
  切回展櫃要重新測量（`measureRack`），隱藏狀態下測量會得到 0（`scrollWidth` 也是 0），
  量測前必須確認該分頁可見
- 動效不得無限自動播放；`nudge` 之類提示動畫限次
- 互動元素觸控目標至少 44px；小圖示靠偽元素撐開命中區
- 焦點不得被固定層遮擋，`scroll-padding` 隨固定層高度調整
- 高對比下限：正文 4.5:1，非文字 3:1
- `js/data.js` 只由 `npm run build` 產生
- `artist.html` 與 `js/app.js` 不得含任何歌手專屬內容（歌名、專輯數、年份、歌手名）：
  凡是隨歌手變化的都必須由 `applyArtistChrome()` 從資料填充。
  HTML 裡的兜底文字一律留空，不留某位歌手的內容
- 跑馬燈等「清單型」區塊從 `JC.signature` 取，不得寫死歌名陣列。
  `signature` 是每張專輯 2 至 4 首的**編輯挑選**（`meta.mjs` 手寫層），不是串流熱度統計；
  跑馬燈再從中跨專輯均勻抽樣到 30 首，所以每張專輯都會出現，不會被某一張的熱門曲佔滿
- 跑馬燈的位移由捲動驅動（`marqueePan`），並疊加指標方向：指帶子右側往右推、
  指左側往左推，移出後回到捲動決定的位置；幅度取內容可位移量的 34%（上限 150px），
  窄清單不會被一次推到底
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
- 入口頁的歌手色寫在舞台容器 `.ld-hero` 的 `--accent` / `--accent-on`，
  只點綴印章、選中態、主按鈕與低強度光暈；換歌手即換色

作品層打光與歌手強調色是兩條互斥的通道：

- `--accent` 是**歌手層**，管身分：印章、選中態、焦點、裝飾
- `--amb` 是**作品層打光**，取當前專輯封面的構建期平均色 `sourceAvg`
  （入口頁取該歌手第一張封面所屬專輯，歌手頁取輪播中央那張），以 `"r, g, b"` 字串寫進容器，
  CSS 端只以 `rgba(var(--amb), α)` 畫柔光（`.ld-glow`、`.hero-art::before` / `::after`）
- 打光不承載狀態、不畫文字、不進邊框：它是展台的燈，不是第二強調色。
  專輯層的抽屜色（`--accent` 覆寫）仍照舊，兩者不互相取代

理由：先前只有單一強調色的兩圈暈，切歌手時背景不跟著唱片換色，一張紅封面與一張藍封面
看起來是同一個展台；而把打光做成「第二強調色」會讓同一頁出現兩個爭奪注意力的色源。

理由：個性來自數據（封面、歌風、文案），而不是為每位歌手複製一份樣式；
主題機制的自由度分層供給，越靠近內容的層越具體。

## 入口頁的選擇與導覽

入口 `index.html` 是單一舞台，不是清單：中央為當前歌手的封面組，
左右依最小環形位移排開相鄰與遠端歌手，下方是姓名列、統計與進入入口。

- 資料與狀態單一來源：歌手清單與順序取自 `DISCOGRAPHY.order`；
  封面取該歌手 `albums` 的封面，統計取 `stats`，色取 `theme`。
  入口不得另寫歌手陣列或把統計寫進文案
- 位置由最小環形位移 `offsetOf` 決定：`|off| <= 2` 留在舞台上並以 `data-off`
  對應位置、縮放、側轉、不透明度與層級，其餘收進 `hidden` 不佔焦點。
  首尾銜接靠位移計算，不複製整套可互動 DOM
- 切換只更新狀態：性名、統計、主連結 `href`、強調色與 `aria-pressed`
  由同一個當前 id 一起更新，不重建節點，焦點不因切換丟失
- 舞台是選擇、主連結是進入：點兩側封面或姓名只切換選中；點**中央那張已選中的封面**
  等同「進入專輯」，直接進該歌手的頁面。只有 `進入專輯` 這個真實 `<a href>`
  與中央封面會離開入口頁
- 選擇記在 sessionStorage `discography-selected-artist`；記錄失效、被封鎖或
  id 已移除時回退 `order[0]`，不阻止瀏覽
- 操作與其邊界：拖曳與滑動的位移至少 40px 且大於垂直位移 1.3 倍；
  點封面選中該歌手，點舞台上的空白處則左半退一位、右半進一位；
  方向鍵與 Home／End 只在唱片架容器內攔截；`touch-action: pan-y` 保留原生縱向捲動。
  入口不設左右箭頭與「01 / 07」計數：切換只靠點封面、點空白處與拖曳
- 拖曳的指標捕獲必須**延後到確認是拖曳**（位移超過 8px）才做：`pointerdown` 就
  `setPointerCapture` 會讓瀏覽器把 `click` 派發給舞台而非底下的封面鈕，
  點封面永遠不會選中（`click` 的 target 實測是 `ld-stage`）
- HTML 的 `js/`、`css/` 引用一律帶 `?v=<版本>`（`npm run stamp`）：
  HTML 更新而資源仍是快取的舊版時，舊腳本會因為找不到已刪除的元素而在
  `addEventListener` 拋錯、初始化中斷，整座唱片架停在「封面全疊在中央」。
  改過 `js/` 或 `css/` 就重跑一次 `npm run stamp`
- 動態寫入一律經 `setText` / `setAttr` 記錄繁體原文：切換歌手後再切語言時，
  WeakMap 快取才不會把上一位歌手的文字還原回來
- 入口的三階段入場是**類別契約**（品牌 → 唱片架 → 資訊區）：初始 `html.ld-booting`
  由 `index.html` 帶上，各行由 CSS 的 `animation-delay` 排程；序列跑完
  （`BOOT_MS = 3400ms`）JS 只切類——移除 `ld-booting`、加上 `is-ready`，
  基礎態完全可見。每個 `@keyframes` 的結束值必須等於基礎態，否則移類那一瞬間會跳一下；
  `prefers-reduced-motion: reduce` 下立即收斂，不讓人等 3.4 秒
- 空數與單數：0 位歌手顯示可讀空狀態並收起唱片架；1 位停用左右切換；
  缺封面以佔位呈現，姓名與進入連結仍可用

## 歌手頁的主視覺輪播

歌手頁 `artist.html` 的主視覺（`.fan`）是一台**可左右翻的專輯輪播**，
不是裝飾圖：走完該歌手的全部 `albums`，中央那張是「當前專輯」。

- 位置同樣按最小環形位移排開，`|off| <= 2` 留在台上（5 張），其餘 `hidden`
  且**不掛 `src`**：十六張專輯若一次全下載會拖慢首屏
- 點兩側封面＝把那張翻到中央；點中央那張＝`openSheet(該專輯 id)` 打開它的抽屜
- 鍵盤：焦點在這一組內時，左右方向鍵翻一張、Home／End 到首／末；
  事件只掛在輪播容器上，不在整份文件攔截
- 寫入 `aria-label`（「專輯名，開啟專輯」／「專輯名，年份」）前要先
  `dropAttr`，否則切換繁簡時 `localize` 會把舊值還原回來
- 這一組原本取 `covers` 精選五張並帶 `aria-hidden`；改成走 `albums` 之後，
  `heroFan` 已無渲染層使用者（`covers` 仍在用：入口頁取每位歌手前三張做封面組），
  保留這兩個欄位是為了不改資料契約
- 幾何三個旋鈕互相牽制，調一個要一起量：`.hero-art` 的 `aspect-ratio`（豎向留白）、
  `.fan-card` 的 `width`（封面大小）、`FAN_SPEC.x`（扇形張角）。
  五張的橫向跨度約為單張寬的 1.9 倍，放大封面必然外溢容器並吃掉與左欄標題的間隙；
  容器高度依內容收（`aspect-ratio: 1 / .82`），因為五張的豎向跨度只有卡片高的約 1.0 倍
- 縱深由**每張卡自己的** `perspective(1400px)` 函式提供，不是祖先的 `perspective`
  屬性：兩者對單一元素的視覺等價，但後者配上子層 `transform-style: preserve-3d`
  會建立真正的 3D 脈絡，被 `translateZ` 推遠的卡片在真實指標下命中不到自己
  （實測命中率 72.3%，`click.target` 穿到宿主 `div.fan`）。展櫃與封面牆不重疊、
  不受影響，仍保留 `preserve-3d`

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
