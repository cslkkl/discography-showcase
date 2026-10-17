# 升級執行進度與驗證記錄

任務效果、提示詞和完成標準以 [完整升級待辦](upgrade-roadmap.md) 為準。
本文件只記實際執行狀態，不複製需求。
初始化日期：2026-10-15；建立本表不表示已重新驗收既有功能。

## 狀態規則

- `待複核`：有既有實作或歷史記錄，本輪尚未驗證。
- `待實作`：目標能力仍缺失。
- `進行中`：已開始且尚未完成必要驗證。
- `部分受阻`：列出受阻子項，其他已完成部分附證據。
- `實作驗證完成`：本輪規定的功能與程式檢查通過；另列待人工視覺驗收。
- `可選已交付`：可選功能已實作並驗證，預設關閉。

## 任務總表

| 任務 | 名稱 | 初始狀態 | 本輪證據或記錄 |
| --- | --- | --- | --- |
| 00 | 基線修復 | 待複核 | 實作驗證完成，見 [Task 00 記錄](#task-00-記錄) |
| 01 | 歌曲檔案 | 待複核 | 已符合，保留；本輪證據見 [Task 01／02／03／09 複核記錄](#task-01020309-複核記錄) |
| 02 | 歌曲資料 | 待複核 | 已符合（1104 筆零問題）；舞台 sidecar 擴充由 Task 04 寫入者負責 |
| 03 | 歌曲狀態列 | 待複核 | 已符合，保留；跨歌手入口已修並驗 |
| 04 | Folia 舞台及兩層 AI | 待實作 | **本地歌詞舞台已實作並實測**（14 模式、三條入口、關掉服務仍可用）；**三首代表歌曲的段落預設已驗證**（可愛女人／第二天堂／Out of the Woods）；**真實 AI 仍未驗證**（無密鑰）。三段式界定見 [Task 04 記錄](#task-04-記錄) 末「Task 04 現狀」 |
| 05 | 年輪與生涯時間軸 | 待複核 | 年表節點真實點擊可開對應專輯抽屜（實測 16 列、第 4 列開「叶惠美」）；`timeline` 節點仍未接、有來源的敘述節點缺，見 [Task 05–20 複核記錄](#task-0520-複核記錄) |
| 06 | 專輯空間 | 待複核 | 已符合，保留（既有每卡透視） |
| 07 | 動態環境光 | 待複核 | 已驗證：換片 `--amb` 由 `114,97,91` 變 `130,58,42`（＝新專輯 sourceAvg）；八位歌手 8/8 相符 |
| 08 | 轉場 | 待複核 | 已抽樣驗證，保留（換片、抽屜、舞台的既有轉場皆正常） |
| 09 | 歌曲列表 | 待複核 | 已符合，保留；三條入口都以真實點擊驗過（總表／抽屜列／檔案） |
| 10 | 指標空間互動 | 待複核 | 已驗證：`--px/--py` 追光、`--rx/--ry` 微傾上限 2.16deg、移出清空回正 |
| 11 | 材質光澤 | 待複核 | 已驗證：16 個高光層皆 `pointer-events: none`；四個可點元素中心命中自己；聚焦有 outline |
| 12 | 動畫節奏 | 待複核 | 已驗證（頁內 rAF 逐幀）：檔案淡入 581/720ms、狀態列換歌 412→1081ms；減少動效第 1 幀即到位 |
| 13 | 可選自訂指針 | 待實作 | 已實作並驗證，預設關閉 |
| 14 | 自然捲動 | 待複核 | 已驗證：`overflow-x: clip`、sticky 0；wheel/PageDown/End/Home 位置全部正確 |
| 15 | 膠片材質 | 待複核 | 已符合，保留（單層靜態 grain） |
| 16 | 品牌導航 | 待複核 | 已驗證：320px 下選單開合、12 項、焦點進出、`Esc` 回焦、無溢出 |
| 17 | 歌手及歌曲內容 | 待複核 | 逐曲文案仍全空；缺來源，見受阻一節 |
| 18 | 字體層級 | 待複核 | 已修正兩處低於 12px 的宣告（舞台外框、抽屜官方入口），現在 CSS 內無 <12px |
| 19 | 行動適配 | 待複核 | 9 檔視口無溢出、舞台四平台可用；**真實觸控無法量測**（工具限制），見下 |
| 20 | 效能及交付 | 待複核 | 全套檢查通過、公開包獨立可用；舞台資源按需載入（載入歌手頁 119 個請求中 0 個來自 `stage/dist`） |

## 當前接手點

- 收尾狀態（2026-10-15 第四輪，最後一輪）：交付進入**文檔與交付收尾**。
  本輪只改文檔（`DELIVERY.md` 與本檔），不動已通過測試的程式、不加依賴；
  過期的「`stage/dist/**` 不在版本戳範圍內」結論已清除並複驗（見第四輪一節），
  Task 04 的狀態改為三段式界定（見 [Task 04 記錄](#task-04-記錄) 末「Task 04 現狀」）。
- 負責執行的 Agent：本輪單一執行者。使用者於 2026-10-15 確認另一個並行寫入者已停止後，
  本輪接手 `stage/**`、`tools/**`、`storage/**`、`docs/evidence/**` 與全部站點檔案。
- 正在做的任務：Task 00 完成；01／02／03／09 複核完成；04 舞台整合完成（真實 AI 受阻）；
  13 實作完成；05／17 部分符合或受阻；06／07／08／10／11／12／14／15／16／18／19／20 已抽樣驗證並保留。
- 下一步（交回使用者）：接上 AI 密鑰後重跑 Task 04 第一層（真實 AI）、
  換一個開了 `hasTouch` 的 context 補真實觸控（Task 19）、
  在 `timeline` 與逐曲文案有可信來源後補 Task 05／17 的內容，
  以及 `DELIVERY.md` 第六節與 12.4 列出的人工視覺驗收。
- **並行寫入者的處理**：本輪執行期間偵測到另一個寫入者同時產生 `stage/**` 與 `tools/**`。
  當時依 [Task 04 實作架構](task-04-architecture.md) 的寫入邊界分區，不碰對方的檔案；
  使用者確認對方停止後才接手，所以本檔的記錄沒有兩份互相矛盾的版本。
  被對方寫過又被本輪改動的檔案（`eslint.config.js`、`.prettierignore`、`_data/pack-public.mjs`、
  `package.json`）都是在原內容上追加規則，沒有回滾對方的修改。
- 使用者需要處理的事項：
  1. 若日後再接上 AI 密鑰，重跑 `node tools/theme-service.mjs` 與一次完整舞台，更新 Task 04 記錄。
  2. Task 05／17 需要可引用的來源（官方專輯資料、訪談、原始記錄）與人工判斷，本輪沒有可信來源可寫。
  3. 逐項人工視覺驗收（見各記錄的「待使用者人工視覺驗收」）。

## 受阻與外部條件

目前有一個經本輪執行確認的受阻項（Task 04 第一層真實 AI），其餘為缺來源的內容項。
登記時使用以下欄位，不記密鑰值、私有音頻或歌詞全文。

| 任務或子項 | 缺少什麼 | 已完成的獨立部分 | 恢復所需動作 | 下一個可繼續任務 |
| --- | --- | --- | --- | --- |
| Task 04 §7 整曲 AI 主題（真實模型） | `OPENAI_API_KEY` 或 `GEMINI_API_KEY`；本機 `.env.local` 兩者皆為空字串，服務日誌與 [AI 分析證據](evidence/ai-analysis.md) 都記錄了實際觀察到的 401 | 服務、分段覆蓋保證、schema 校驗、快取、降級、測試替身整條鏈路；舞台側已接上並實測會套用回來的主題 | 設定密鑰後 `node tools/theme-service.mjs`，再開一次舞台並更新 Task 04 記錄 | Task 04 其餘驗證（手機／橫屏、WebGL 降級提示、reduced-motion） |
| Task 04 §8 段落 sidecar 全量 | 時間（`node tools/analyze-audio.mjs --all` 約 1098 首） | 管線、schema、逐點查詢、本輪新增 `jay2000-1`（15 段） | 背景跑全量，或只跑要示範的曲目 | 其餘複核任務 |
| Task 05 有來源的生涯節點 | 可引用的發行事件與創作階段敘述（官方資料／訪談），以及人工判斷 | 年輪、年表（可點進專輯）、年代分期皆可用；`timeline` 資料已由管線產出 | 提供或授權來源後，把節點接到畫面上並記來源 URL 與日期 | Task 17 |
| Task 17 至少八首有來源的歌曲介紹／背景 | 同上：目前 1104 首 `description`／`story` 全空，源頭沒有內容 | `meta.mjs` 的 `songs` 寫法已備好（鍵 `<專輯id>-<序號>`），其餘欄位與版面皆已就緒 | 逐首寫入並記來源；沒有來源就留空 | Task 19／20 |

## 每項執行記錄格式

每完成一項新增一段，若再次修改同項則更新原記錄，不用多份相反狀態。

```text
任務：Task NN
狀態：進行中 / 部分受阻 / 實作驗證完成 / 可選已交付
日期及執行者：
開始時已有的能力：
實際效果及變更：
檔案與入口：
實際執行的命令與結果：
瀏覽器、真實 CSS 視口與資料狀態：
真實點擊、鍵盤、觸控及 reduced-motion 結果：
遇到的失敗、修復與回歸結果：
新增或既有問題的區分：
未驗證、受阻或平台限制：
待使用者人工視覺驗收：
下一步：
```

## Task 00 記錄

任務：Task 00 修復基線與建立真實驗收
狀態：實作驗證完成
日期及執行者：2026-10-15，本輪執行 Agent
開始時已有的能力：歌曲狀態列 `#msb` 與歌曲檔案皆已實作；兩處註釋缺陷仍在工作樹中（HEAD 可重現）。
實際效果及變更：
- `css/style.css`：`/* ── 25. responsive` 未閉合，且 `html.has-msb` 之後殘留 `────────────────── */`，
  兩者串起來讓整條 `@media (max-width: 1100px)` 被 CSS 解析器吞掉。修法是還原兩個分節抬頭，未動任何宣告。
- `artist.html`：`<!-- 播放列：` 被插進來的狀態列註釋截斷，`-->` 落在 `</div>` 之後，
  於是「音源優先取自有音檔…」渲染成頁面正文。修法是把播放列註釋移回獨立區塊。
- `js/app.js`：分開「目前瀏覽歌手」與「播放歌曲所屬歌手」。
  新增全站索引 `buildGlobalIndex()` / `ownerOfAlbum()` / `albumAny()`，專輯 id 全站唯一（實測 90 張無重複）。
  `trackOf()` 改為跨歌手解析並回傳 `artist`；`archiveHTML` / `songOf` / `eraOfYear` / `archiveNo` 收歌手參數；
  狀態列 `msbPaint` 與 `setMediaSession` 取該歌所屬歌手；`plQueueFor` / `stepArchive` 跨歌手取專輯；
  抽屜 `openSheet` 遇到別人的專輯時先就地切到那位歌手再開（抽屜是頁面層的歌手視圖）。
檔案與入口：`css/style.css`、`artist.html`、`js/app.js`；資源版本戳 `?v=c9a18617`。
實際執行的命令與結果：
- `npm run lint`：本輪改動檔 0 問題；其餘問題來自 `.agents/tmp-*.mjs`（未追蹤的勘察腳本）與 `stage/`（另一位寫入者）。
- `npx prettier --check artist.html css/style.css js/app.js`：全通過。
- `npm run stamp`：`index.html` / `artist.html` 更新為 `?v=c9a18617`。
瀏覽器、真實 CSS 視口與資料狀態：
- 用 MCP 共用瀏覽器（msedge，視窗帶 0.75 縮放），所有數值以頁內 `innerWidth` 自證，不採請求值。
- 修前 / 修後：把 `git show HEAD:css/style.css` 注入頁面解析，`@media (max-width:1100px)` 子規則 0 → 21（總規則 762）。
- CSS 390（實測 `innerWidth 391`、`devicePixelRatio 0.75`）：`.hero-grid` 單欄 337.2px、`overflowX 0`。
- 修前 `artist.html` 有一個 `BODY` 直屬文字節點「音源優先取自有音檔…-->」；修後同類文字節點 0 個。
- 資料為公開態（`jay-chou` 175 曲，帶 `local` / `lyrics` 欄位者皆 0）。
真實點擊、鍵盤、觸控及 reduced-motion 結果：
- 真實指標點播放鈕（`data-play=jay2000:1`）：`audio` 元素 1 個、`paused=false`、`currentTime` 1.81s、卡片顯示「可爱女人 / 周杰伦 / 《Jay》」。
- 兩次真實點擊切到林志炫：頁面歌手變林志炫，`audio` 仍 1 個、`paused=false`、`currentTime` 5.37s、`src` 未變、卡片保留周杰倫那一首。
- 真實點擊卡片歌名（`click.target` = `BUTTON#msbTitle.msb-title`）：檔案開啟，題名「可爱女人」、署名「周杰伦」、`NO. 001 / 175 · Jay Chou`。
- `Esc` 關檔案後焦點回到 `#msbTitle`；歌詞舞台開著時 `Esc` 只關舞台，卡片留著、播放不斷。
- 本機態歌詞入口（在頁內把 sidecar 描述子貼進記憶體，不動 `js/data.js`）：舞台開啟，說明行 `Jay · 可愛女人 · 48 行`，
  當前句「想要有直升机」、下一句「想要和你飞到宇宙去」，`currentTime` 7.33s、`audio` 仍 1 個。
- 公開態同一入口：就地說明「這首沒有本機歌詞」，不開空舞台。
遇到的失敗、修復與回歸結果：
- 第一次真實點擊測試選到 `display: none` 的 `.cat-track` 播放鈕（`rect` 0×0），點擊落在頂欄。
  改成只挑可見元素後命中。這是測試腳本的問題，不是站點問題，記下來免下次誤判。
新增或既有問題的區分：三項都是既有缺陷（HEAD 可重現），本輪修復；無新增失敗。
未驗證、受阻或平台限制：
- 未跑 `npm run build:local` 重建 `js/data.js`（目前是公開態，重建會改動追蹤中的生成物並讓本機音檔欄位進入產物）。
  跨歌手那條本機態鏈路已用頁內注入驗證，重建成本機態後可再跑一次完整版。
待使用者人工視覺驗收：390px 首屏單欄的觀感、頁尾是否乾淨。
下一步：Task 01 歌曲檔案複核。

## Task 01／02／03／09 複核記錄

任務：Task 01 歌曲檔案、Task 02 歌曲資料結構、Task 03 歌曲狀態列、Task 09 歌曲列表檔案化
狀態：四項皆「已符合」，保留既有實作；其中 Task 03 的跨歌手入口由 Task 00 修復後成立
日期及執行者：2026-10-15，本輪執行 Agent
開始時已有的能力：四項在本輪開始前都已實作並有歷史驗收記錄（見根 `AGENTS.md` 的驗證快照）。
實際效果及變更：本輪只修 Task 03 依賴的跨歌手身份解析（記在 Task 00），其餘不動。
檔案與入口：`artist.html`（`.sarch` / `#msb`）、`js/app.js`、`js/lyrics.js`、`js/data.js`（生成物，未改）。
實際執行的命令與結果：
- `node .playwright-mcp/check-02.mjs`（直接載入 `js/data.js` 逐筆核對契約）：8 位歌手、90 張專輯、1104 曲、1104 筆 `song`，
  唯一 `song.id` 1104、零問題；`song.no` 每位歌手 1..N 連續無缺號；`cover` 檔全部存在；`tint` 皆 3 分量；每張專輯都有 `theme.accent` / `accentOn`。
- `js/data.js` 1146131 bytes（1119 KB，公開態），掃描 0 個 Windows 絕對路徑、0 個 `file://`、0 個 `assets/audio` 參照、0 個疑似金鑰、0 個 `.lrc`。
- `npm run check:docs`：40 檔 143 連結 0 錯誤（`--exclude` 排除 `stage/vendored` 上游複本，理由見下）。
瀏覽器、真實 CSS 視口與資料狀態：
- MCP 共用瀏覽器，實測 `innerWidth 1440` / `innerHeight 901` / `devicePixelRatio 0.75`（請求值 1080×675，故以頁內讀值為準）。
- `main > section` 10 個；`.cat-track` 175 列；可見的列內歌名鈕 350 個（總表每列 2 個：編號欄播放鈕與歌名鈕）。
真實點擊、鍵盤、觸控及 reduced-motion 結果：
- 真實指標點總表第一列歌名鈕（`click.target` = `BUTTON.ct-name`）：檔案開啟，題名「可爱女人」、署名「周杰伦」、
  `第 1 / 10 首 · Jay`、`NO. 001 / 175 · Jay Chou`；三顆入口齊（播放／閱讀歌詞／查看完整檔案）；事實 6 列、署名 5 列；
  首曲「上一首」disabled、「下一首」可用；`#saScroll` 833 / 1024（自身可捲）；`.sa-acts` 底緣 845。
- 鍵盤：檔案開啟後連按 9 次 `Tab`，焦點全程留在 `#sarch` 內（`saBack → saNext → saClose → sa-act ×3` 循環），無外漏。
- `Esc` 關檔案後焦點回到開啟它的那一列（`data-archive="jay2000:1"`）。
- 淡出途中重開（鍵盤路徑：`Esc` 後 140ms 內對另一列按 Enter）：`hidden=false`、補回 `is-open`、`opacity 1`、內容換成新那一首。
  註：同一情境用真實指標點列是測不出來的——淡出中的模態仍蓋住頁面，點擊會落在它的封面上（實測 `click.target` = `IMG`），
  那是模態該有的行為，不是缺陷。
- Task 03 生命週期（真實指標）：載入時 `#msb` 隱藏；點播放（`jay2000:1`）→ 播放列升起、卡片出現「可爱女人／周杰伦」；
  再點另一列（`jay2000:3`）→ 卡片換成「星晴」，`is-playing` 標記在 `jay2000:3`，全程 `audio` 元素 1 個；
  真實點 `#plClose` → 播放列收起、`body.has-player` 移除、卡片淡出後 `hidden=true`。
- 卡片內控制項 0 個（`#msb input, #msb [data-play], #msb [type=range]` 皆 0），與 Task 03 規格一致。
遇到的失敗、修復與回歸結果：
- 兩次測試腳本自身出錯（選到 `display:none` 的播放鈕、以及對 `null` 讀 `textContent`），都是腳本問題，已改成只挑可見元素並加空值守衛。
- 站點本身：0 pageerror。
新增或既有問題的區分：任務檔案、資料、狀態列與列表四項都是既有實作；本輪沒有為它們新增程式碼。
未驗證、受阻或平台限制：
- Task 02 要求的「Task 04 主題與段落 sidecar 契約」由 Task 04 的寫入者負責，本輪不重複設計；
  目前 `js/data.js` 的 `schema.version` 為 2，`optional` 為 `credits/description/story/tags/lyrics`（1104 筆裡帶 `credits` 者 146 筆）。
- 逐曲 `description` / `story` 1104 首全空（源頭本來就沒有內容），屬 Task 17 的內容問題，不是程式失敗。
待使用者人工視覺驗收：檔案開啟的觀感、卡片在底部堆疊的觀感。
下一步：既有視覺與動效項複核。

## Task 04 記錄

任務：Task 04 Folia 完整舞台與兩層 AI
狀態：部分受阻。**本地歌詞舞台已實作並實測**、**三首代表歌曲的段落預設已驗證**、
**第一層「真實 AI 主題」仍未驗證**（缺密鑰）；三段式界定見本節末「Task 04 現狀」。
日期及執行者：2026-10-15，本輪執行 Agent
開始時已有的能力：
- `stage/` 獨立子專案已建置完成：`stage/dist/lyric-stage.js`（306 KB 入口）＋ 14 個模式 chunk ＋ `assets/lyric-stage.css`（199 KB）。
- `tools/` 本機受控 AI 主題服務與 `tools/analyze-audio.mjs` 已完成；`storage/segments/` 有預分析 sidecar。
- **缺口**：站點側沒有任何裝載器，`artist.html` 仍只接原本的三行舞台（`js/lyrics.js`）。
實際效果及變更（本輪新增）：
- 新增 `js/lyric-stage.js`（經典腳本，零依賴）：按需 `import()` 舞台產物、把站點 `#plAudio` 包成
  `payload.audio`（契約見 [Task 04 架構](task-04-architecture.md)）、Shadow DOM 隔離、三條入口收斂到 `open(albumId, n)`。
- `artist.html`：新增 `#stageFull` 舞台外殼（頂欄／渲染宿主／底部控制列：模式、背景、動效強度、恢復自動、狀態行）
  與 `js/lyric-stage.js` 的 script 標籤。
- `css/style.css`：新增 `30. full lyric stage` 分節（外框、控制列、窄屏）。
- `js/app.js`：`openLyricsFor` 與播放列 `#plLyrics` 優先走完整舞台，取不到才退回 `js/lyrics.js`；
  `plLoad` 在舞台開著時呼叫 `follow()`，舞台跟著真正在播的那一首走。
- `tools/theme-service.mjs`：補 loopback 白名單的 CORS 與 `OPTIONS` 預檢（沒有它瀏覽器直接擋掉
  `/theme` 與 `/segments`，舞台永遠停在「未接上段落分析」）。
檔案與入口：`js/lyric-stage.js`（新）、`artist.html`、`css/style.css`、`js/app.js`、`tools/theme-service.mjs`。
實際執行的命令與結果：
- `npx eslint js/lyric-stage.js js/app.js`：0 問題。
- `npm run stamp`：`?v=6e202fc4`（每次改 JS 後都重跑，避免新舊混版）。
- `npm run build:local`：1095.8 KB；1098 首有本機音檔、901 首有歌詞。
- `node tools/analyze-audio.mjs --only jay2000-1`：`status ok`、`durationSec 239.027`、`segmentCount 15`、`lyricsAvailable true`。
- `node tools/theme-service.mjs`：監聽 `127.0.0.1:8788`；日誌明確寫「沒有可用的模型供應器 → `/theme` 會回封面降級主題」。
- `curl -H "Origin: http://127.0.0.1:8099"` → `/segments/jj2004-1`：200 且帶 `Access-Control-Allow-Origin`；
  `Origin: http://evil.example` 不回 ACAO；`OPTIONS` 預檢 204。
瀏覽器、真實 CSS 視口與資料狀態：
- MCP 共用瀏覽器（msedge，0.75 縮放），所有數值以頁內 `innerWidth` 自證；資料為本機態。
- 舞台渲染尺寸：`#sfHost` / `.stage-full-root` / `.stage-root` 皆 2560×1306（真實 CSS 1440×979 的量測值），
  畫布 `1344×685`，`data-stage-webgl="true"`，`data-stage-degraded` 為空。
真實點擊、鍵盤、觸控及 reduced-motion 結果：
- 三條入口都走真實指標：狀態列「查看歌詞」、播放列「全屏歌詞」鈕、歌曲檔案 `.sa-lyrics` 鈕 → 都開得起來，
  標題／歌手／專輯／年份與 `#msb` 一致；全程 `audio` 元素 1 個、播放不中斷。
- 換歌：`plNext` 後舞台標題由〈可愛女人〉變成〈完美主義〉；120ms 內連點兩次 `plNext` 後是〈娘子〉，
  沒有殘留上一首的歌詞或主題。
- 暫停／恢復：`data-stage-paused` 由 `false → true → false`，`currentTime` 不再推進後又繼續。
- 14 模式逐項以真實 `<select>` 操作：`cadenza cappella claddagh classic diorama fume lumiere monet
  partita pendolo sonnet still tempera tilt` 全部回報 `data-stage-mode` 等於所選值、播放不中斷、
  `audio` 恆為 1；其中 `cappella`／`monet`／`partita`／`pendolo`／`sonnet`／`still`／`tempera`／`tilt`／`claddagh`
  量到實際歌詞文字（`textLen` 15–257），`still` 用 0 個 canvas（純文字模式）。
- 背景切換：`monet` 生效（`data-stage-background="monet"`）。
- 降級：陶喆全 131 首都沒有本機歌詞，點狀態列「查看歌詞」得到就地說明「這首沒有本機歌詞」、
  不開空舞台、播放繼續。
- 資源：連續開關舞台 20 次後，`style` 1 個、`.stage-full-root` 1 個、`.stage-root` 1 個、`canvas` 2 個、
  `audio` 1 個，均無累積；0 pageerror（僅上游 `ResizeObserver loop completed with undelivered notifications`
  警告級訊息，非本站程式）。
遇到的失敗、修復與回歸結果（本輪真實踩到並修掉的缺陷）：
- 動態 `import()` 相對「腳本 URL」解析 → `/js/stage/dist/lyric-stage.js` 404，舞台完全掛不上。
  改成以 `document.baseURI` 解成絕對 URL。
- `loadCss` 在 shadow root 還不存在時 `appendChild` → 樣式整個沒進去（`styleTags 0`）。
  抽出 `ensureShadow()`，並用查詢（而非 `firstChild`）判斷包裝層。
- 模式選單顯示 `cadenza` 而舞台跑 `classic`：選單第一項不等於上游預設模式。
  改用 `payload.mode || mod.getDefaultMode()`。
- shadow 包裝層高度 0（畫布 `2640×0`）：文件 CSS 進不了 shadow root，`.stage-full-root` 沒人給尺寸。
  在注入樣式前補 `:host` 與 `.stage-full-root` 兩條。
- 外殼標記順序寫成 host/bar/dock，而 `grid-template-rows` 是 `auto minmax(0,1fr) auto`，
  於是 `.sf-bar` 佔走 `1fr`（量到 1441px）。改成 bar/host/dock。
- `/theme` 請求形狀錯誤（送 `{songId,title,lyrics}`，服務要 `{song:{...},lyricsText}`）→ 服務回
  `song-id-missing` 降級，鏈路看似通、輸入其實是空的。修正後才拿到真實的段落與（可得的）主題。
- `/segments/<id>` 直接寫回應、繞過共用的 `sendJson`，漏了 CORS 標頭。在該路徑補上。
- 換歌時對同一宿主再次 `createRoot`（React 沿用舊根）→ 畫面停在前一首。抽出 `disposeStage()`，
  掛載前先卸載；並新增 `follow()`。
新增或既有問題的區分：上述 8 項都是本輪整合時新引入或新發現的；`stage/` 與 `tools/` 內部本身的缺陷
（見 [模式實測證據](evidence/stage-modes.md) 與 [AI 分析證據](evidence/ai-analysis.md)）不重複計算。
未驗證、受阻或平台限制：
- **第一層真實 AI 主題：受阻——本機沒有可用密鑰**（`OPENAI_API_KEY` 為空，服務日誌與
  [AI 分析證據](evidence/ai-analysis.md) 都記錄了實際觀察到的 401）。目前 `/theme` 一律回
  「封面派生」降級主題。**這條到第四輪收尾仍未驗證，不宣稱通過。**
  （本輪寫下時 `storage/theme-cache/` 有 2 筆 `model: test-double` 的測試替身，
  不是真實 AI 結果；第二輪已先實測「替身不會被誤認成真實 AI」再清空為 0 筆。）
- 未用真實 AI 驗證「歌詞超長時的分段分析與彙總」；替身只證明了鏈路。
- 段落變化（第二層）以真實音訊測量為依據，但只有少數曲目有 sidecar（本輪新增 `jay2000-1`，
  現共 9 首）；沒有 sidecar 的曲目在段落行顯示「未接上段落分析」，
  主題改走本地規則（第三輪起）。
- 未測手機／平板／橫屏下的舞台版面與觸控操作；未測 WebGL 不可用時本站入口的降級提示
  （模式層的降級已由 `docs/evidence/stage-modes.md` 逐模式證明）。
  → **版面與平台已於本檔「Task 05–20 複核記錄」量測；WebGL 降級已於 2026-10-15 第二輪實測觸發**
  （見 [模式實測證據](evidence/stage-modes.md) 第七節）。仍未驗證的是**真實觸控**（工具限制）。
- 未測 reduced-motion 下的舞台行為。→ **已於「Task 05–20 複核記錄」補測**。
待使用者人工視覺驗收：14 模式的實際觀感、逐曲配色是否合適、控制列在真實裝置上的可讀性。
下一步：Task 05 年輪與生涯時間軸。

### Task 04 現狀（第四輪收尾同步，2026-10-15）

上面是 Task 04 的歷史執行記錄；這一小節是**收尾時重新核對過的現狀**，
與 `DELIVERY.md` 12.2 同一份口徑。三件事分開講，不合併成一句「Task 04 完成」：

| 子項 | 狀態 | 判據（皆為實測） |
| --- | --- | --- |
| 本地歌詞舞台 | **已實作並實測** | 14 模式逐一以真實 `<select>` 切換後 `data-stage-mode` 等於所選值、播放不中斷、`audio` 恆為 1；三條歌詞入口（狀態列／播放列／歌曲檔案）都以真實指標開得起來；連開關 20 次後 `style`／`.stage-full-root`／`.stage-root`／`canvas`／`audio` 零累積，關閉後 shadow 內 `canvas` 由 2 降到 0；**主題服務完全關閉、無任何密鑰時舞台照常運作**（本地主題在掛載前解析完成，段落改讀靜態 sidecar） |
| 三首代表歌曲的段落預設 | **已驗證** | `jay2000-1` 可愛女人／`jj2004-1` 第二天堂／`ts2014-4` Out of the Woods：章節制逐段的主色、強度、背景與 sidecar 能量逐項相符；手動鎖定後主色與背景都不被段落覆寫；恢復自動回到本地主題與段落規則。逐項數值見 [段落驗證方案](evidence/segment-verification-plan.md) |
| 真實 AI 主題 | **仍未驗證（受阻）** | 本機無可用密鑰：`OPENAI_API_KEY`／`GEMINI_API_KEY` 皆空，服務 `/health` 回 `available: false`。封面派生與測試替身兩條路徑已分別實測、狀態列把三條路徑分開寫，但**真實模型結果從未被觀察到**，因此不宣稱通過；接上密鑰後要重跑一次端到端 |

其餘曲目的實際行為（記清楚，不誇大）：

- **其餘 6 首 sidecar 歌曲**（`chopin2005-10`、`jj2013-2`、`jj2015-11`、`lin1998-11`、
  `ts2010-10`、`ts2024-15`）：沒有逐段人工預設，走安全預設，
  **主要依靠能量驅動動效強度**；主色與背景來自歌曲／封面派生的本地主題。
  舞台狀態行照實寫「此曲無逐段人工預設（僅能量驅動）」。
- **1095 首無 sidecar 的曲目**（1104 總曲 − 9 首有 sidecar）：沒有段落資料，
  段落行顯示「未接上段落分析」，**主題使用本地主題**——未配置人工預設時走封面派生的本地規則
  （決定性運算，同一封面永遠同一組顏色），不會出現空白背景。
- 誠實界定：sidecar 的 `mode`／`background` 仍是 `null`、`theme` 仍是 `{}`、
  `provenance.modelJudgment: false`，所以**段落目前只驅動動效強度**，
  沒有宣稱模式／背景／情緒／配色有段落配置。

待使用者人工視覺驗收（Task 04 相關）：

- **手機底部控制區**（舞台 dock，391×845）：由 302px 增至 346px（新增「視覺主題」選單多佔一列），
  渲染宿主由 441px 降到 397px；無溢出、功能正常，屬真實版面代價，待判斷是否收窄。
- 14 模式與 6 背景的觀感、橫屏 845×391 的構圖（視覺化只剩約 24% 視窗高）、逐曲配色、
  人工預設的觀感配對。

## Task 05–20 複核記錄

任務：Task 05 年輪與生涯時間軸、06 專輯空間、07 動態環境光、08 轉場、10 指針空間互動、
11 材質光澤、12 動畫節奏、13 可選自訂指針、14 自然捲動、15 膠片材質、16 品牌導航、
17 歌手與歌曲內容、18 字體層級、19 行動適配、20 效能與公開交付
狀態：13 為「可選已交付」；06／09／14／15 為「已符合，保留」；07／08／16／18／19 為「已抽樣驗證，保留」；
05／17 為「部分符合／受阻」；20 為「實作驗證完成」，另列未量測項
日期及執行者：2026-10-15，本輪執行 Agent
實際執行的命令與結果：
- `npm run check`（lint + format:check + check:docs + check:eol + check:ps1）：**全通過**
  （eslint 0；prettier 全通過；連結 43 檔 149 連結 0 錯誤；換行 4507 檔 0 不一致；6 個 .ps1 全 ASCII）。
  過程修掉兩件既有問題：`stage/src/StageRoot.jsx` 的兩條 import 被 core `no-unused-vars` 誤判
  （JSX 識別字不算引用，已在 `eslint.config.js` 對 `stage/src/**` 啟用 `react/jsx-uses-vars`）；
  `stage/**` 12 個檔從未排版過，已 `prettier --write`（`stage/dev/evidence.json` 是機器產物，改列入 `.prettierignore`）。
- `npm run pack`：公開包 2463 檔 / 67.3 MB；引用檢查 313 個本地引用 0 缺失；
  舞台模組「完整且乾淨」；外洩檢查「乾淨」。
- `node _data/serve.mjs --root dist 8123`：公開包獨立啟動。
瀏覽器、真實 CSS 視口與資料狀態（公開包，8123）：
- 入口頁：`innerWidth` 自證、`title`「聲之年輪 · 歌手唱片陳列」、8 個 `.ld-group`、8 個 `.ld-tab`、`overflowX 0`。
- 真實點擊第 3 個編目項＋中央封面（`aria-label`「陶喆，进入专辑」）→ 進到 `artist.html?a=david-tao`：
  `main > section` 10 個、曲目列 131、年表 9、播放列存在、舞臺宿主 `#stageFull` 存在、`stage/dist/lyric-stage.js` 可取（HEAD 200）。
- 公開資料：`tracks 131`、`withLocal 0`、`withLyrics 0`、音源為 `https://audio-ssl.itunes.apple.com/…`
  （自有音檔與歌詞確實不在公開產物裡）。
- 真實點擊播放 → 官方試聽載入、`paused false`、`duration 10`、狀態列出現在「Airport Take Off」；
  再點狀態列歌詞入口 → 就地說明「這首沒有本機歌詞」、不開空舞台、播放不中斷；`audio` 元素 1 個。
本輪抽樣量測（真實 CSS 視口以 `innerWidth` 自證；MCP 瀏覽器 0.75 縮放，請求值已換算，實測值如下）：
- 19／18：9 檔視口（320、390、620、768、860、1100、1366、1440 與 844×390 橫屏）全部
  `overflowX 0`、可見文字 `<12px` 為 0；`.hero-grid` 在 1100 以上為 2 欄、1100 以下 1 欄；
  `main button`／`a[href]` 沒有低於 24px 高的可見目標。
- 15：`.grain` 恆為 1 層、`animation-name: none`（靜態）、`pointer-events: none`。
- 14：全頁 `position: sticky` 元素數為 0（展櫃已是原生橫向捲動）；`html { scroll-padding-bottom: 96px }` 生效。
- 16：品牌文字「声之年輪 SOUND ARCHIVE Jay Chou · Studio Albums」在窄屏寬 76px、桌面 221px，
  320px 下仍不與工具列重疊（無橫向溢出）。
- 06：`.fan-card` 每張卡自己的 `perspective()` 方案保留未動；八位歌手各 10–16 張、切換後無累積。
- 08／12：換歌手、開檔案、開舞台的既有轉場保留未動；**未做逐幀（rAF）時長量測**。
- 07／10／11：既有 `--amb` 取色、指標微傾與高光保留未動；**未逐項驗證**（見未驗證清單）。
- 05：年輪、年表（`.chrono-row` 都是 `data-open` 按鈕，點擊可開該張專輯抽屜）、年代分期皆可用，
  八位歌手切換後各自正確、無累積。**但 `DISCOGRAPHY.artists[].timeline`（逐年 count/albums/songs）
  在 `js/app.js` 裡完全沒有被引用**，也就是資料產生了卻沒接到畫面上；任務要求的
  「每位歌手至少兩個有依據的節點（年份＋簡短說明＋作品入口）」需要人工撰寫來源與文案，本輪未做。
- 13（可選自訂指針，新實作）：新增 `js/cursor.js`（零依賴、預設關閉、偏好存 `localStorage` 的 `jc-cursor`）、
  `css/style.css` 新增 `31. optional custom pointer` 分節、選單新增「自訂指針」開關（`role=menuitemcheckbox`）。
  實測：環境 `(pointer: fine) and (hover: hover)` 為 true、reduced/forced 為 false；
  **預設關閉**且不建裝飾節點；`body`／`html` 的 `cursor` 仍為 `auto`（**沒有**全域 `cursor: none`）；
  真實指標移到展品 `.fan-card` 上 → `cursor-on`／`cursor-hot` 成立、`.cur-dot` `opacity 1`、環 40px；
  移到頂欄語言鈕 → `cursor-on` 變 false（裝飾只在展品互動區）；`pointerleave` → 裝飾與熱態收起；
  開關 `aria-checked` 由 `false → true`、`localStorage` 為 `on`／`off`；重新載入後維持所選；
  兩層裝飾 `pointer-events: none`。
遇到的失敗、修復與回歸結果：
- `npm run check` 一開始紅：4 個 lint 錯誤（我的臨時腳本 2 個＋StageRoot 的 JSX import 誤判 2 個）、
  14 檔格式不合。已逐步修掉，現在全綠。
- `npm run pack` 一開始紅：「引用檢查：缺失 1 → `js/lyric-stage.js` → `assets/lyric-stage.css`」。
  原因是打包腳本把 JS 裡的 `'assets/…'` 一律按「頁面」基準解析，而裝載器的這條字串是相對
  `stage/dist/` 的（執行期用 `new URL(…, document.baseURI)` 解，實際檔案存在）。
  已在 `_data/pack-public.mjs` 補上規則：檔案內出現 `'stage/dist/'` 時，`'assets/…'` 改以 `stage/dist`
  為基準解析；並在舞台完整性檢查裡新增「`lyric-stage.css` 必須存在」的明確斷言（那是必要產物，
  少了舞台就沒有樣式）。修好後 0 缺失。
新增或既有問題的區分：check 與 pack 的紅燈都是本輪改動（新檔未格式化、新字串被舊規則誤解）造成的，
修法沒有放寬任何斷言或跳過檢查；`stage/**` 的排版是既有欠賬。
未驗證、受阻或平台限制：
- **未驗證**：Task 07 的環境光換色（需量 `--amb` 前後值與快速連切）、Task 10 的指標微傾／追光逐項行為、
  Task 11 的高光不遮內容與鍵盤聚焦回饋、Task 12 的逐幀動效時長與 reduced-motion 起始態、
  Task 14 的滾輪／PageDown／Home-End／觸控返回位置、Task 16 的 320px 鍵盤進出選單與回首頁、
  Task 19 的真實觸控走完（選歌手→選專輯→開檔→播放→歌詞→返回）與螢幕旋轉後尺寸更新。
  這些都是「既有實作、本輪未動」，狀態記為保留而非已驗證。
- **Task 20 未做**：首頁／歌手頁在舞台加入前後的資源與記憶體基線對比、長任務與舞台幀耗時、
  公開包 20 次以上開關舞台的資源釋放（本機態已測 20 次無累積，公開包未測）。
- **Task 17 受阻**：逐曲 `description`／`story` 1104 首全空（源頭沒有內容），
  任務要求的「至少八首有來源的歌曲介紹或背景」需要可引用的原始記錄與人工判斷，
  本輪沒有可信來源可寫，**不編造**；其餘未補作品維持空欄位。
- **Task 05 部分符合**：`timeline` 節點未接到畫面；有來源的創作階段敘述同上，缺人工輸入。
- `resize`/DPR：公開包以 `dist/` 為根啟動時，`stage/dist/lyric-stage.js` 的相對路徑正常（HEAD 200），
  但**未在公開包裡實際開過一次完整舞台**（公開包沒有歌詞，入口一律走「沒有本機歌詞」的降級）。
待使用者人工視覺驗收：全部模式的觀感、逐曲配色、自訂指針的手感、窄屏控制列的可讀性。
下一步：把「未驗證」清單逐項補測；補 `timeline` 的節點呈現與有來源的敘述（需使用者提供或授權來源）。

任務：Task 07 環境光換色、10 指標微傾、11 高光遮擋與鍵盤聚焦、12 逐幀動效時長、
14 滾輪／PageDown／Home-End、16 的 320px 鍵盤選單、05 年表節點、09 第三條入口、
04 的手機／橫屏／平板／WebGL 與 19 的真實觸控、以及兩處小字下限違規
狀態：實作驗證完成（逐項見下）；未完成的只有「真實觸控」與「WebGL 降級屬性」兩條，已登記
日期及執行者：2026-10-15，本輪執行 Agent（第二次補測）
實際執行的命令與結果：
- `npm run check` → 全綠（eslint 0、prettier 全通過、連結 43 檔 151 連結 0 錯誤、
  換行 4510 檔 0 不一致、6 個 .ps1 全 ASCII）。
- `npm run pack` → 2463 檔 / 67.3 MB；引用 313 個 0 缺失；舞台「完整且乾淨」；外洩「乾淨」。
- `npm run build` 後 `js/data.js` 的 SHA256 = `8596144C…C0D477F`，
  與本輪動工前**逐位元組一致**（本輪為了測舞台先切到本機態，測完已還原；見下「資料狀態」）。
本輪量到的實測值（真實指標 `page.mouse.click`；MCP 瀏覽器 0.75 縮放，數字以頁內自證）：
- **Task 12 逐幀動效**（頁內 rAF 取樣 `getComputedStyle`，依 AGENTS.md 的口徑，
  不用外面輪詢）：
  - 歌曲檔案：`.sa-scrim` 半亮 158.8ms / 全亮 581ms，`.sa-panel` 半亮 180.1ms / 全亮 720.5ms
    （各 331 幀）；四段錯峰 `transition-delay` 實測 0.04 / 0.12 / 0.18 / 0.24s、時長 0.6s。
  - 狀態列換歌（點第 1 首 → 第 6 首，`可愛女人` → `星晴`）：舊卡 412.2ms 起退、
    685.6ms 到 0、778.7ms 新卡起、1080.9ms 完全到位（共 364 幀）。合計仍在 500–800ms 宣告區間內。
  - 減少動效：第 1 幀（取樣起點 50.5ms）就已 opacity ≥ 0.999，
    `.msb` 的 `transition-duration` 為 `1e-06s` → 不做淡入、不等。
- **Task 07 環境光**：真實點右鄰封面後中央由《Jay》換《范特西》，
  `--amb` 由 `114, 97, 91` 變 `130, 58, 42`，正是 `fantasy2001` 的 `sourceAvg #823A2A`。
  八位歌手逐一載入後 `--amb` 都等於「`covers[0]` 所屬專輯的 `sourceAvg`」換算的三元組
  （陶喆 16,64,138／鄧紫棋 121,76,105／周杰倫 114,97,91／林俊傑 161,126,150／
  方大同 171,165,159／Taylor Swift 135,126,106／林志炫 202,181,158／薛之謙 170,166,162），8/8 相符。
- **Task 10 指標微傾／追光**：真實指標移進展櫃封面後 `--px/--py` 由空寫到 `25.0%/22.5%`，
  移到右下 `--rx 2.16deg`／`--ry -1.27deg`；移出展櫃區域後 `--rx`／`--ry` 被清空回正
  （`--px/--py` 依設計保留最後位置）。上限 2.2deg 未被突破。
- **Task 11 高光與聚焦**：全部 16 個 `.fan-sheen`（另有封面牆的）`pointer-events: none`；
  逐一把元素捲進視野後判中心點最上層：中央封面 → `IMG`（屬卡片內）、主視覺入口 → `SPAN`（屬按鈕內）、
  目錄分頁鈕 → `BUTTON.cv-btn`、頂欄語言鈕 → `BUTTON.lang`，四者都命中自己或其子節點，
  高光層沒有擋住任何一個可點元素。鍵盤聚焦中央封面時 `outline` 生效
  （`outline-width 2.909px`、`offset 2.909px`、色 `rgb(243,240,234)`）。
- **Task 14 自然捲動**：`body` 的 `overflow-x` 是 `clip`（不是 `hidden`，所以 sticky 不會被破壞）、
  全頁 sticky 元素 0 個；`mouse.wheel` 0 → 1600，`PageDown` → 2840，
  `End` → 16566（= `scrollHeight − innerHeight`），`Home` → 0。四者都正確。
- **Task 16 的 320px 鍵盤選單**：`innerWidth 320`（MCP 縮放已換算）下 `.nav` 為 `none`、
  品牌寬 76px；點選單鈕後選單開啟、`aria-expanded=true`、12 個項目、
  含回首頁連結、焦點落在選單內；`Esc` 關閉後焦點回到那顆鈕；`overflowX 0`。
- **Task 05 年表節點**（先點「年表」分頁，否則量到的是 `display:none` 的容器——這是既有坑）：
  `#chronoList` 16 列皆可見、第 4 列 `data-open=yeh2003`／標題「叶惠美」；
  **真實點擊** `click.target` 為 `SPAN.cr-main`，開出抽屜、標題「叶惠美」、11 列曲目、3 個官方連結。
- **Task 09 第三條入口（抽屜曲目列歌名鈕）**：真實點擊 `click.target` 為 `BUTTON.st-name`，
  歌曲檔案開啟、標題「以父之名」、計數「第 1 / 11 首 · 叶惠美」，
  並如設計把 `#sheet` 標成 `aria-hidden="true"`。
- **Esc 分層**：檔案開著時第一次 `Esc` → `#sarch` 收起但 `#sheet` 仍在；第二次 `Esc` → 抽屜收起。
- **Task 04 平台複驗**（本機態；舞台入口一律走「開抽屜 → 整張播放 → 播放列歌詞鈕」帶音訊的真實路徑）：
  - 桌面 1440×901：頂欄 1440×136、宿主 1440×605、控制列 1440×160、shadow 根 1440×605、canvas 2；
    14 模式、6 背景；控制項 `sf-close` 44×44、三個 `select` 36 高、`sf-auto` 36 高；
    `overflowX 0`、可見文字 <12px **0 個**、`audio` 1 個、播放中。
    真實點關閉鈕 → 收起；**收起後 shadow 內 `canvas` 由 2 變 0**（渲染器確實釋放）、
    `style/link` 1、`.stage-full-root` 1、`audio` 仍 1。
  - 平板 768×1024：宿主 768×732、控制列 185；同上全過。
  - 橫屏 845×391：頂欄 845×111、**宿主只剩 845×95**、控制列 185；無溢出、控制項仍可達。
    這裡誠實記錄：橫屏下視覺化只剩 95px 高（約視窗 24%），功能正常但觀感很擠，
    屬於設計取捨而非缺陷，留給人工視覺驗收判斷。
  - 手機 391×845：宿主 391×441、控制列 391×302（三個選單攤成兩列）、
    `sf-select` 最寬 272、狀態行佔滿一列；`overflowX 0`、無 <12px、無元素出界。
  - 減少動效（桌面）：舞台照常開啟並呈現，尺寸與對照組相同。
- **兩處小字下限違規（本輪修掉）**：
  - 我自己新加的舞台外框用了 `.72rem`／`.74rem`（實測 `sf-kicker` 11.52px、
    `sf-lab` 11.52px、`sf-status` 11.84px）。已全部提到 `.75rem`（12px）。
  - 抽屜「官方入口」那段是**既有**違規：`.sl-label` `.72rem`、`.sl-link` `.74rem`、
    `.sl-note` `.72rem`。先前的下限掃描只量 `main/header/footer`，抽屜關著時量不到，
    所以一直沒被抓到。已一併提到 `.75rem`。
    現在 `css/style.css` 與 `css/motifs.css` 掃 `font-size` 已無低於 12px 的宣告。
遇到的失敗、修復與回歸結果：
- 前幾次量舞台一直得到 `hidden: true`，一度看起來像「手機上舞台打不開」。實際有兩個獨立原因，
  都不是站點缺陷：
  1. **瀏覽器快取**：HTML 的 `?v=` 只涵蓋 `js/`／`css/` 檔的版本，**不隨資料內容變**。
     我從公開態切回本機態後瀏覽器仍用舊的 `data.js`，於是每首歌都沒有歌詞描述子，
     舞台照規格走「這首沒有本機歌詞」的降級。量測時以攔截改寫 `js/data.js` 的 URL
     （加唯一 query）強制重取即恢復正常。**這是本輪的量測陷阱，值得記進活躍坑**：
     判斷「是不是站點壞了」之前，先確認頁內 `DISCOGRAPHY` 的 `lyrics` 欄位有沒有值。
  2. **首次載入要下載 306 KB 模組 ＋ 199 KB 樣式**（`stage/dist`），
     冷快取時 5.5s 的等待不夠。耐心輪詢後（≤12.6s）就開起來了，
     暖快取時 900ms 內開完。這是「按需載入」的必然代價，不是回歸。
- 兩個我自己造成的量測錯誤，一併如實記錄，避免後人重踩：
  - 用「幾何中心」點主視覺右鄰封面時，命中真相是**中央那張**（`elementFromPoint` 回 `IMG`，
    中央卡 `:hover` 為真、右鄰為假），所以連點六次都沒有換片，看起來像功能壞了。
    改用沿卡片內縮、以 `elementFromPoint` 找「真的屬於右鄰」的點（取到 0.5/0.1 位置）後，
    一次就換片成功、`--amb` 也跟著換。這正是 AGENTS.md 已記載的 3D 命中陷阱，本輪再次應驗。
  - 判 `--amb` 對不對時，我原先假設「`covers[0]` 必定屬於 `albums[0]`」，
    於是 taylor-swift／terry-lin／xue-zhiqian 三位被判成不符；
    改成「以 `covers[0].id` 去 `albums` 裡查真正的擁有者」後，8/8 相符。
    錯的是我的期望值算法，不是站點。
資料狀態（重要）：
- 本輪為了測舞台的手機／橫屏／平板／減少動效，先跑 `npm run build:local`（折入自有音檔與歌詞），
  測完已跑 `npm run build` 還原公開態，並以 SHA256 對帳確認與動工前**逐位元組一致**
  （`8596144C…C0D477F`，1238592 bytes）。
- 附帶確認一項事實（原本只是猜測）：`?v=` 版本戳**不含 `js/data.js` 的內容**。
  所以「改了資料但沒重跑 stamp」時，使用者瀏覽器可能仍用舊資料。
  公開部署時 `data.js` 走一般 HTTP 快取，這是既有行為，若要嚴格可考慮讓 `data.js` 也帶版本戳。
未驗證、受阻或平台限制：
- **真實觸控全鏈路（Task 19）仍無法量測**：這個瀏覽器 context 沒有開 `hasTouch`，
  `page.touchscreen.tap` 直接報 `hasTouch must be enabled on the browser context`。
  這是**工具限制**，不是站點限制；我沒有改用 `element.click()` 假裝通過
  （那會掩蓋真實命中問題，正是 AGENTS.md 禁止的）。窄屏的溢出、字號、命中與選單已用真實指標驗過。
- **WebGL 降級屬性未觀察到**：把 `HTMLCanvasElement.prototype.getContext` 對
  `webgl/webgl2` 打成 `null` 後舞台仍正常開啟並播放（預設 `classic` 模式用 2D canvas，
  不需要 GL），但 `data-stage-webgl`／`data-stage-degraded` 在 shadow 根上讀到 `null`，
  所以「沒有 WebGL 時收斂 GL 背景並寫出原因」這條**沒有被實測觸發**。
  要驗它得先選一個需要 GL 的模式／背景，或直接查 `stage/src/capabilities.js` 的掛載點。
  → **2026-10-15 第二輪已補測並通過**：以隔離背景層的方式觸發 `diorama`／`lumiere`，
  兩者於渲染器啟動前替換成 `classic` 並寫出 `no-webgl-mode-fallback:<mode>`，
  錯誤邊界不再被觸發；`pendolo`／`still` 不受影響。
  逐模式數值見 [模式實測證據](evidence/stage-modes.md) 第七節。
- 橫屏下視覺化只剩 95px 高（觀感問題，功能正常，待人工判斷）。
待使用者人工視覺驗收：14 模式在四種平台的觀感、橫屏構圖、逐曲配色、
自訂指針手感、以及抽屜「官方入口」那段字級提升後的版面平衡。

## 本輪整體交付

- [x] Task 00–20 的狀態與實際程式一致，已完成項都有本輪證據（未完成的見上節「未驗證」）。
- [x] Folia 模式清單、上游版本、依賴及許可記錄可查（`stage/README.md`（模組原始碼不入庫）與 `stage/vendored/folia/MANIFEST.json`）。
- [x] 完整歌曲段落樣本與三條 AI 路徑都有證據；**真實 AI 受阻已明列**（缺密鑰，未驗證），
      替身與封面降級都標清楚了。這條講的是「受阻與降級有證據」，不是「真實 AI 有證據」。
- [x] 主站與舞台的八位歌手、跨歌手播放及三條歌詞入口驗證通過（見 Task 00／01／03／04 記錄）。
- [x] 桌面、平板、手機及橫屏的功能、版面數值與可訪問性檢查完成：
  9 檔視口 + 舞台四平台（1440×901／768×1024／845×391／391×845）皆無溢出、無 <12px、
  控制項皆 ≥36px 高、關閉後 canvas 由 2 降到 0。
  **唯一缺口**：真實觸控手勢無法在此瀏覽器 context 量測（`hasTouch` 未開），已登記。
- [x] 公開產物重啟驗證、私有資料排除及整體專案檢查完成
      （`npm run check` 全綠、`npm run pack` 三項檢查全過、`--root dist` 起服務後實測可用）。
- [x] 啟動 URL、命令、變更範圍、剩餘事項及人工驗收入口已交接（見本檔「當前接手點」與最終回覆）。

## 第三輪：本地視覺主題系統（2026-10-15，本輪執行 Agent）

任務：把歌詞舞台從「以外部 AI 服務為核心依賴」改成「完全本地可用」，
AI 降為可選精修；同時修掉舞台產物的版本快取問題，並為 3 首代表歌曲補上
逐段人工預設與完整驗收。**不重寫 Folia 舞台、不刪既有模式與交互、不改上游複本。**
狀態：實作與實測完成；真實 AI 仍受阻（不宣稱通過）。

### 一、舞台產物的版本快取（先前登記為未處理項，本輪修掉）

問題：`stage/dist/lyric-stage.js` 與 `stage/dist/assets/lyric-stage.css` 是**固定檔名**，
由 `js/lyric-stage.js` 以固定 URL 動態載入，HTML 引用不到它們。
只蓋 HTML 的章（`?v=`）對它們無效——重建舞台後瀏覽器仍會沿用舊模組。

修法：
- `_data/stamp-assets.mjs` 的內容雜湊**納入 `stage/dist/**`**（整棵樹，排序後逐檔取內容）。
- 版本號同時寫進 `js/lyric-stage.js` 的標記常數
  `/* stamp:stage-version */ var STAGE_VERSION = '…'`，由 `stageUrl()` 接到兩個產物 URL
  （`stage/dist/lyric-stage.js?v=<版本>` 與 `…/assets/lyric-stage.css?v=<版本>`）。
- **自引用怎麼避免**：`STAGE_VERSION` 的**值不進雜湊**——算雜湊前先把那一行歸一化；
  否則會變成「寫進去 → 內容變 → 雜湊變 → 再寫」永遠不收斂。

實測：
- 連跑兩次 `npm run stamp`：第二次「0 個檔案有變動」，值不變 → **收斂**。
- 對 `stage/dist/lyric-stage.js` 附加一行註解（受控變更）→ 版本由 `e06bc055` 變 `f50ace0d`。
- 重建還原後 → 版本回到 `e06bc055`（雜湊確實取內容，不是取時間）。
- 瀏覽器實際請求：`stage/dist/lyric-stage.js?v=e06bc055`、
  `js/lyric-stage.js?v=e06bc055`、`moduleUrl()` 亦帶同一版本 → 三者一致。

### 二、架構調整：AI 從核心依賴降為可選精修

- **新增 `js/stage-themes.js`**（零依賴經典腳本）：5 個人工預設主題
  （憂傷／溫暖／懷舊／明亮／激昂）＋逐曲人工預設＋逐段人工預設（章節制）
  ＋封面取色的**本地規則**（背景、文字配色、環境光）。
- 舞台啟動改為**先解析本地主題**（不需要網路、不需要服務、不需要密鑰），
  再並行問兩件「可選」的事：AI 精修主題、段落。
- **AI 只在真的回了模型結果時才覆蓋本地主題**：`isRealAiTheme()` 逐一排除
  封面降級（`source cover`）、測試替身（`model test-double`）、服務沒開。
  這一條是「不得在沒有真實 AI 響應時顯示 AI 分析成功」的唯一判據。
- 段落取得改為**兩段式**：先問服務（可能更新），失敗就讀
  `storage/segments/<id>.json` 靜態檔；因此把該目錄納入公開打包
  （`_data/pack-public.mjs`）。發布前確認過 sidecar **不含歌詞原文與本機路徑**
  （`lyrics` 欄位只有 `available`／`lineCount`／`firstLineTime`／`lastLineEnd`／
  `lyricCharCount`／`textTag`／`regionCount` 這些統計；全檔只有 2 處連續漢字，
  都是那句 provenance 附註）。

### 三、使用者控制

- `artist.html` 舞台控制列新增「視覺主題」選單（跟隨歌曲＋5 預設）；
  手動選擇即鎖定主題，**背景一併鎖住**（背景是主題觀感的一部分）。
- 「恢復自動」維持既有語意：清三把鎖、還原歌曲自身的本地主題與段落規則。
- `resumeAuto()`／`setIntensity()`／`getState()` 三個介面**沒有回退**，
  本輪只在載入器側新增呼叫點。

### 四、本輪修掉的自建缺陷（都先被實測到）

1. **狀態列停在掛載瞬間的值**：段落覆寫後不刷新，實測第二天堂第 0 段套的是
   憂傷 `#6f8bb5`，狀態列卻寫歌曲級的激昂 `#e05c4a`。
   改為兩段式狀態列（訊息＋摘要），摘要由 `syncFromState` 每次現算。
2. **摘要讀 null 崩潰**：`themeLine` 讀了 `null.mood`，例外沿 React 提交往上冒，
   把 `mountStage` 的 then 鏈打斷——**主題選單因此永遠是空的**（實測 `selectOptionCount: 0`）。
   修法：摘要計算整段包 try/catch（它只影響一行字，不能影響舞台），並補 null 保護。
3. **手動鎖定主題後背景仍被段落改掉**：跳到 190 秒時背景由 `latent` 變 `monet`。
   改為背景套用也受主題鎖約束。
4. **同一行自我矛盾**：訊息說「憂傷」、摘要說「懷舊」——手動切換後沒更新摘要來源。
   改為手動切換時同步 `setStatusSource()`，並修正 `presetId` 的回退條件。
5. **「載入舞台…」永久留在狀態列**：舞台就緒後沒有清掉這則過場訊息。
6. **變數遮蔽**：`var fallback = local.theme` 與模組層的 `fallback()` 同名，
   會讓「舞台載入失敗」那條路徑靜默拿到物件而不是函式；改名為 `localTheme`。

### 五、三首代表歌曲的實測（主題服務完全關閉、無密鑰）

逐項數值見 [段落驗證方案與結果](evidence/segment-verification-plan.md)。摘要：

- `jay2000-1` 可愛女人（0.110–0.551，無 chaotic）：70s→`#d98f56` normal、
  100s→`#b9925e` normal、185s→`#d98f56` normal、232s→`#b9925e` calm。
- `jj2004-1` 第二天堂（0.000–0.795，3 段 chaotic）：10s→`#6f8bb5` calm common、
  190s→`#e05c4a` chaotic monet、225s→`#e05c4a` chaotic nomand。
- `ts2014-4` Out of the Woods（0.036–0.713，無 chaotic）：開啟→`#5fc8d0` calm latent、
  70s→`#d98f56` normal、130s→`#5fc8d0` normal、232s→`#6f8bb5` calm common。
- 段落索引、能量、主色、強度、背景**逐項與 sidecar 能量和章節定義相符**，0 pageerror。
- 拖動進度條後立即取得該段落狀態，**不需重播**。
- 手動鎖定主題後跳段：主色與背景都維持手動值（`locks="t"`）。
- 恢復自動：`auto="true"`、`locks` 空、回到本地主題與段落規則。
- 切歌：舞台跟隨新歌；新歌無 sidecar → 走封面派生的安全預設。
- 關閉再打開：`canvas` 由 2／1 降到 0、`audio` 恆為 1。
- 四平台：1440×901／768×1024／391×845／845×391 全部 `overflowX 0`、無 <12px、控件 ≥36px。
- 無 WebGL：歌詞仍可見（199700 字）、無錯誤邊界、**0 個 Paper Shaders 錯誤**；
  章節指定的 `nomand` 自動收斂為 `common`；手選 `lumiere` 替換為 `classic`
  並寫出 `no-webgl-mode-fallback:lumiere`。
- 服務關閉時 6 個 8788 請求失敗，但**舞台照常運作**（段落改由靜態檔取得）。

### 六、仍受阻／未完成

- **真實 AI 主題**：無可用密鑰，`/health` 回 `available: false`。不宣稱通過。
- **其餘 6 首 sidecar 歌曲**沒有逐段人工預設，走安全預設（只有能量驅動強度）。
- **1095 首無 sidecar 的曲目**：沒有段落資料，只套歌曲／封面主題。
- **手機 dock 由 302px 增至 346px**（新增控件多佔一列），宿主由 441px 降到 397px；
  無溢出、功能正常，屬真實版面代價，待人工視覺驗收。
- 人工預設的**觀感配對**是審美判斷，待維護者確認；逐曲情緒標籤無來源，不編造。

## 第四輪：文檔與交付收尾（2026-10-15，本輪執行 Agent）

任務：不再改程式，只做交付收尾——清除已過期的版本戳結論、把 Task 04 的狀態講準、
記清楚其餘曲目的實際行為與待人工驗收項，然後重跑文檔與自動化檢查、出最終包。
狀態：完成。**本輪沒有修改任何業務邏輯、沒有新增依賴**，`tools/**`、`storage/**`
與站點執行期檔案都未動。被寫入過的只有版本戳複驗碰到的三個檔案
（`stage/dist/lyric-stage.js` 追加探針、`js/lyric-stage.js` 的版本常數、兩個 HTML 的 `?v=`），
複驗後逐位元組還原，工作樹與複驗前一致。
另外依複核建議補了一行 `.gitignore`（忽略 `__pycache__/`，見第五節），
這是本輪唯一的非文檔改動。

### 一、清掉的過期結論（本輪的主要目的）

| 落點 | 原本寫的 | 改成 |
| --- | --- | --- |
| `DELIVERY.md` 10.6 | 「`stage/dist/**` 不在 `?v=` 版本戳範圍內，重建後瀏覽器可能沿用舊模組」 | 「已修，第四輪已複驗」＋機制與數值（該檔 12.1） |
| 本檔「第二輪」最後一條坑 | 同一句話，且登記為未處理項 | 「第三輪已修、第四輪已複驗」＋複驗數值 |

同時把兩件容易被混為一談的事分開寫：`stage/dist/**`（舞台產物）已在版本戳範圍內；
**`js/data.js` 的資料內容仍不在**——那是既有行為，仍留在「待辦」。

### 二、版本戳機制的複驗（命令與實際觀察到的輸出）

| 步驟 | 命令 | 結果 |
| --- | --- | --- |
| 收斂 | `npm run stamp` 連跑兩次 | 兩次都「0 個檔案有變動」，版本 `bb4d1762` |
| 內容變更 | 追加 `/* stamp convergence probe 2026-10-15 */`（**無換行**）到 `stage/dist/lyric-stage.js` 後 `npm run stamp` | 版本變 `75484f83`；`index.html`／`artist.html`／`js/lyric-stage.js` **三處同步**（追加後該檔 SHA256 `21AA0BCD…35E41`） |
| 還原 | 還原該檔原始位元組後 `npm run stamp` | 版本回到 `bb4d1762` |
| 位元組對帳 | 四個檔的 SHA256 複驗前後比對 | 逐一相同（`stage/dist/lyric-stage.js` 為 `DB3DB351…FCC57`） |

複驗方式是「先備份到暫存、驗完還原」，不是改完留著：複驗後工作樹與複驗前一致。
追加的那行**逐字記在上表**，第二次複驗用同一串位元組得到同一個 `75484f83`——
只寫「加一行註解」而不寫加了什麼，別人是重現不出這個值的。

### 三、Task 04 狀態的同步

- 任務總表第 04 列與 Task 04 記錄的「狀態」行都改成三段式界定：
  **本地歌詞舞台已實作並實測**、**三首代表歌曲的段落預設已驗證**、
  **真實 AI 仍未驗證**（缺密鑰）。
- Task 04 記錄末新增「Task 04 現狀」小節：三件事分開講，並記下其餘 6 首 sidecar 歌曲
  （主要依靠能量驅動）、1095 首無 sidecar 曲目（使用本地主題）與手機底部控制區的待驗收項。
- Task 04 記錄裡已被後續輪次補測的「未驗證」條目逐條加註（平台版面、reduced-motion、
  WebGL 降級），不留下與後面章節互相矛盾的說法。

### 四、本輪重跑的檢查

| 命令 | 結果 |
| --- | --- |
| `node --test "tools/test/*.test.mjs"` | **85 項全過**、0 失敗、0 略過（複驗兩次 0.55 s／0.82 s） |
| `npm run check:docs` | 48 檔 / 211 連結 / 0 錯誤 / 0 警告 |
| `npm run check:eol` | 4514 檔 / 0 不一致 / 0 寫入 / 1641 略過 |
| `npm run format:check` | 全通過 |
| `npm run lint` | 0 問題 |
| `npm run check:ps1` | 6 檔全純 ASCII |
| `npm run stamp` | 收斂於 `bb4d1762`，0 個檔案有變動 |

**「85 項全過」只說明已覆蓋的測試場景符合預期，不等於站點已完全驗收。**
沒有被自動化證明、必須另外驗的三類：**手機端視覺觀感**（只量過溢出／字號／命中／尺寸，
觀感待人工驗收）、**真實 AI 接入**（端到端從未被觀察到）、
**更多歌曲的段落效果**（只有 3 首有逐段人工預設、9 首有 sidecar，其餘 1095 首只套本地主題）。
把這句寫進交付說明（`DELIVERY.md` 12.5）是為了不讓測試綠燈被讀成驗收完成。

### 五、收尾後補的一行 `.gitignore`（唯一的非文檔改動）

複核提出：`npm run check:docs` / `check:eol` 跑完會在 `scripts/__pycache__/` 留下
Python 位元組碼快取，`git status` 每次都多一條未追蹤項。處理方式：

- `.gitignore`「臨時產物」段新增 `__pycache__/`；
- 已產生的 `scripts/__pycache__/check-markdown-links.cpython-314.pyc` 從工作樹刪除
  （可重建，下次跑檢查會再生成但已被忽略）；
- 站點執行期檔案、測試、`stage/`、`tools/`、`storage/` 未動，`npm run check` 全套重跑仍全綠。

### 六、最終包

`专辑展示-最终版-20261015.zip`（與專案目錄同層）：**4464 個檔案**，
收錄專案工作樹扣掉 `node_modules/`（含 `stage/node_modules/`）、`.git/`、
根目錄 `dist/`（可重建的公開產物）、`.playwright-mcp/`、`__pycache__/`
（跑檢查腳本時 Python 留下的位元組碼快取，已加進 `.gitignore` 並從工作樹刪除）與 `assets/audio/`；
`stage/dist/` 與 `stage/vendored/` 都在包內。包解開後對 4464 個檔案逐一算 SHA256
與工作樹比對，**4464/4464 逐位元組相同、0 缺失**；空的 `storage/theme-cache/` 目錄也在。

## 交付摘要

- 啟動：`npm run serve` → `http://127.0.0.1:8099`（入口頁 index.html；歌手頁 `artist.html?a=<歌手id>`）。
- 本機聽歌：`npm run listen`（登記自有音檔後按本機態建置）。
- 完整舞台要另開本機服務：`node tools/theme-service.mjs` → `127.0.0.1:8788`（可選；沒有它舞台仍可用，只是沒有 AI 主題與段落）。
- 公開交付：`npm run pack` → `dist/`（實測 2463 檔 / 67.3 MB，含音檔與歌詞排除檢查）。
- 檢查：`npm run check`（lint + format:check + check:docs + check:eol + check:ps1）。

## 第二輪：關鍵問題修復（2026-10-15，本輪執行 Agent）

任務：交付後複核提出的五個關鍵問題——恢復自動的語意、AI 狀態的誠實度、
段落驅動的實證、無 WebGL 的模式降級、以及完整回歸與文檔一致。
狀態：實作與實測完成；未完成的只有「真實 AI 端到端」與「真實觸控」兩條（已登記）。
日期及執行者：2026-10-15，本輪執行 Agent。

### 修了什麼（每個都對應一個實測到的缺陷）

1. **「恢復自動」按鈕其實是加鎖**（`js/lyric-stage.js`）
   原碼：`handle.setMode(sfMode.value, { lock: true })`——`lock: true` 是**再鎖一次**，
   與「恢復自動」相反；`aria-pressed` 還被無條件寫成 `'true'`。
   現在：新增舞台側真正的解鎖入口 `resumeAuto()`，清三把鎖（模式／主題／強度）、
   還原自動主題與推薦模式、**依當前播放時間**重算段落並以序號強制重套一次
   （所以不必從頭播放）。`aria-pressed` 改由舞台回報的狀態驅動（`payload.onState`），
   手動選模式／調強度會變 `false`，恢復自動會變 `true`。
2. **手動調強度會把主題永久鎖死**（`js/lyric-stage.js`、`stage/src/StageRoot.jsx`）
   原碼用 `applyTheme({...灰階...}, { source: 'manual' })` 改強度，副作用是把主題一起鎖住，
   之後按「恢復自動」也回不到 AI／封面主題。
   現在：新增 `setIntensity()`，**只鎖強度不鎖主題顏色**；三把鎖彼此獨立。
   實測：手動調強度後主色仍是 `#c46ec2`（沒有被灰階覆蓋）。
3. **整曲主題強度永久蓋住段落強度**（`stage/src/StageRoot.jsx`）
   實測：段落能量 `0.020`／`0.000`（應 `calm`）卻始終顯示 `normal`——段落索引與能量都對，
   只有強度不動。根因是優先序寫成 `intensityOverride ?? segmentIntensity`，
   而裝載器一進來就用服務回傳的整曲強度寫滿 `intensityOverride`。
   現在：手動鎖定 → 手動值；未鎖定且有段落 → **段落優先**；
   未鎖定且無段落 → 回落整曲主題強度。
4. **`lumiere` 在無 WebGL 時靜默失敗**（`stage/src/capabilities.js`、`stage/src/StageRoot.jsx`）
   實測：無 GL 時 `diorama` 觸發錯誤邊界（有說明），而 `lumiere` **連套用都沒完成**、
   畫面停在舊模式且沒有任何提示——靜默失敗比拋錯更糟。
   現在：新增模式層能力表 `WEBGL_MODES = {diorama, lumiere}` 與 `WEBGL_FREE_MODE = 'classic'`，
   在**渲染器啟動前**替換，並把 `no-webgl-mode-fallback:<mode>` 寫進 `data-stage-degraded`，
   由站點翻成「這台裝置沒有 WebGL，「微縮」已改用經典」。
   實測：`diorama` 的錯誤邊界**不再被觸發**；`lumiere` 變成明列替換。`pendolo`（自帶
   Canvas2D 回退）與 `still`（純 DOM）維持不變——不因為預設模式是 2D 就宣稱全部通過。
5. **AI 狀態與測試替身分不開**（`js/lyric-stage.js`）
   原碼只看 `theme.provenance.source === 'ai'` 就寫「主題：AI」，
   而**測試替身的輸出正是 `source: 'ai'` ＋ `model: 'test-double'`**，還會進快取
   （快取命中時 `source` 又被改寫成 `'cache'`）。
   現在：一律以服務的 `meta.testDouble` 與 `theme.model` 判定，並分辨 `'cache'`；
   三條路徑分別寫成「主題：真實 AI」／「主題：測試替身（非真實 AI）」／
   「主題：封面派生（未接上真實 AI，無可用金鑰）」，快取命中另加「· 快取命中」。
6. **空物件 `{}` 被當成段落主題**，狀態列因此誤報「主題：段落覆寫」。
   現在改判 `Object.keys(theme).length`。

### 三條路徑的實測結果（分開列，不合併）

- **封面派生（本機無密鑰，`provider.kind = none`）**
  `POST /theme` 回 `reason: provider-unavailable`；狀態列：
  「主題：封面派生（未接上真實 AI，無可用金鑰） · 段落 15 段（音訊測量，驅動 動效強度） · 信心 20%」。
  **不會**被寫成已完成 AI 分析。
- **測試替身（`THEME_PROVIDER=stub`，`isTestDouble: true`）**
  先清空快取再跑。狀態列：「主題：測試替身（非真實 AI）」，
  且主題**真的落到舞台**：`data-stage-mode=still`、`data-stage-background=latent`、
  `data-stage-intensity=calm`、`data-stage-theme-accent=#7d7dd4`，三個選單同步顯示；
  0 pageerror。跑完已再次清空快取（`POST /theme-cache/clear {"all":true}`，`storage/theme-cache` 現為 0 筆）。
- **真實 AI**：**仍未接通**。`OPENAI_API_KEY`／`GEMINI_API_KEY` 皆為空，
  服務 `/health` 回 `available: false`、`configReason: OPENAI_API_KEY 是空的`。
  這一條不宣稱通過。

### 段落驅動的實測（`storage/segments/jj2004-1.json`，18 段，266 秒）

- 拖到 10 秒 → 段 0、能量 `0.020` → 強度 `calm`；
  拖到 190 秒 → 段 12、能量 `0.678` → `normal`；
  拖到 262 秒 → 段 17、能量 `0.000` → `calm`。
  三者都與 `intensityFromEnergy()` 的門檻（`<0.34` calm、`>0.72` chaotic）一致。
- **拖進度條後立即取得正確段落狀態**（不需重播）；段落索引與能量隨播放時間前進
  （`jay2000-1` 播放中段 0 → 段 1）。
- 手動鎖定強度後，拖到 calm 段仍維持 `chaotic`（`data-stage-locks="i"`）；
  按恢復自動後回到段落的 `calm`（`auto=true`、`aria-pressed=true`）。
- **誠實界定**：sidecar 的 `mode`／`background` 仍是 `null`、`theme` 仍是 `{}`，
  `provenance.modelJudgment: false`（附註「不含模型的情緒判斷」）。
  **所以段落目前只驅動動效強度**，模式／背景／情緒／配色沒有段落配置。
  狀態列照實寫成「驅動 動效強度」，沒有宣稱其餘三項有內容。

### 回歸實測（本機態，MCP chromium，頁內自證）

- 舞台：canvas 2、無錯誤邊界；`#plLyrics` 關閉後 **canvas 由 2 變 0**、`audio` 仍 1、
  播放不中斷、`aria-pressed` 變 `false`；拖到 150 秒時歌詞行號 `24`、`segment 9`、
  文字節點 3（歌詞確實可見並隨時間推進）。
- 歌曲檔案：真實點擊開啟（「星晴」、`第 3 / 10 首 · Jay`），`Esc` 關閉成功。
- 狀態列 Mini Song Bar：可見、標題正確。
- **跨歌手切換**：真實點擊選單項（`artist.html?a=terry-lin`）→ 就地換資料不整頁重載，
  曲目數 175 → **126**、`data-artist` 換為 `terry-lin`、年表 10 列、
  `currentTime` 由 2.1 持續到 7.6 秒（`paused` 恆為 false）、0 pageerror。
- 四平台（1440×901／768×1024／391×845／845×391）：`overflowX` 皆 0、可見文字 <12px 皆 0。

### 本輪新增的坑（已記進上一輪的活躍坑清單）

- **能力判斷有兩個層次，不能只做一層**：背景層與模式層的失敗方式不同
  （背景同步拋錯、`lumiere` 靜默不套用）。只靠錯誤邊界會漏掉靜默失敗，
  只做背景層判斷會讓 `diorama` 白觸發一次邊界。
- **優先序寫反＝功能等於沒接上**：`intensityOverride ?? segmentIntensity` 讓
  「自動帶進來的值」蓋住「應該更細的來源」。這一條只有把段落拖到極端值才看得出來。
- **`stage/dist` 不在 `?v=` 版本戳的範圍內**（第二輪的觀察，**已於第三輪修掉、第四輪複驗**）：
  它由 `js/lyric-stage.js` 以固定 URL 動態載入，HTML 引用不到，所以當時重建舞台後
  瀏覽器可能沿用舊模組，量測時需加唯一 query 強制重取。
  現在的機制：內容雜湊納入 `stage/dist/**` 整棵樹，版本號寫進 `js/lyric-stage.js` 的
  `STAGE_VERSION`，由 `stageUrl()` 接到兩個產物 URL。第四輪複驗數值見「第四輪」一節。
  **仍不在版本戳範圍內的是 `js/data.js` 的資料內容**（那是另一條，見「待辦」），
  兩者不要混為一談。

