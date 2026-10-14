# js/ — 腳本手冊

- 職責：資料出口與全部檢視邏輯
- 被誰依賴：入口頁 `index.html` 載入 `data.js` + `landing.js`；
  歌手頁 `artist.html` 依序載入 `data.js`、`lyrics.js`、`app.js`

## 檔案

### `data.js`（生成物，勿手改）

- 產生者：`_data/build.mjs`，指令 `npm run build`
- 形狀：`window.DISCOGRAPHY = { toSimplified, order: [歌手id], schema, artists: { 歌手id: 展示集 } }`
  - `schema` 是歌曲檔案資料模型的契約宣告（`version`、`required`、`optional`、
    `lyricsLine`、`lyricsInline`）。要判斷欄位形狀時讀它，不要靠猜
- 每個展示集含原「歌手全集」的 `albums` / `tracks` / `eras` / `collaborators` /
  `longest` / `shortest` / `growth` / `gaps` / `signature` / `distribution` / `stats` /
  `toSimplified`，另加身份欄位 `id` / `name` / `en` / `seal` / `tagline` /
  `taglineEn` / `intro` / `heroFan` / `covers` / `tint`，以及年份時間軸 `timeline`。
  `covers` 仍在使用中：入口頁 `landing.js` 取每位歌手 `covers` 前三張組成封面組；
  `heroFan` 只在歌手頁主視覺還是「精選五張」時用過，改成走完 `albums` 的輪播後
  已無取用者（保留是為了不改資料契約，新渲染不要再依賴它）
- 每首曲目另帶一份 `song` 紀錄（見 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
  的「歌曲檔案」）：`id` `no` `title` `artist` `album` `albumId` `year` `duration`
  `durationSec` `cover`，四個署名欄位 `lyricist` `composer` `arranger` `producer`
  恆存在（空字串＝未收錄），選填 `credits` / `description` / `story` / `tags` / `lyrics`。
  未收錄的選填欄位不寫進產物
- `timeline` 是「某一年發行了哪些作品」的索引：
  `[{ year, count, albums: [專輯id], songs: [song.id] }]`，依年份排序
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
| 主視覺輪播 | `renderFan` `fanPaint` `fanGo` `fanOffset` `fanHover` `resetFanShift`（走完 `albums`，點兩側翻、點中央開抽屜、方向鍵／Home／End；懸停或聚焦時該張跳出來、其餘照視覺方向讓開；換片是 `is-shifting` → 換位 → `is-arriving` 的兩階段狀態機） |
| 環境光 | `setAmbient`（把當前專輯的 `sourceAvg` 以 `"r, g, b"` 寫進 `#hero` 的 `--amb`，CSS 端以 `rgba(var(--amb), α)` 消費） |
| 各展示面 | `renderAll` `resetHosts` `renderFigures` `renderMarquee` `renderRings` `renderRack` `renderChrono` `renderEras` `renderWall` `renderGrowth` `renderGaps` `renderBars` `renderFacts` `renderRanks` `renderCollab` `renderPicks` `renderChapters` |
| 展櫃捲動 | `measureRack` `paintRackFromScroll` `rackStepBy`（原生橫向捲動；拖曳、左右箭頭、←→／Home／End 共用一條路徑） |
| 曲目總表 | `buildIndex` `renderCat` `renderCatBase` |
| 抽屜 | `openSheet` `closeSheet` `stepSheet` `trapFocus` |
| 歌曲檔案 | `archiveNo` `songOf` `eraOfYear` `creditRowsHTML` `extraCreditsText` `proseHTML` `CREDIT_ROLES` `trackCollab` `archiveHTML` `saSay` `saPaintNav` `openArchive` `closeArchive` `stepArchive` `openLyricsFor` `bindArchive` `trapArchiveFocus` `setLive` `ambTriple` `trackActions` `trackNameButton` |
| 播放 | `trackOf` `syncPlayingRows` `plPaint` `plLoad` `plSelect` `plStep` `plClose` `setMediaSession` `initAudio` `syncRangeFill` |
| 歌曲狀態列 | `msbNodes` `msbPaint` `msbShow` `msbHide` `msbPlaying` `msbFocus`（底部「當前檔案卡」`#msb`：只在「點了一首歌」時出現，見下節） |
| 歌手外觀 | `applyArtistChrome`（品牌、題名、眉題，以及檔案層 `#haEn`／`#haMeta`／`#haNote` 與年表軸 `#heroAxis` 的渲染都在這裡） `bindArtistSwitch` `applyArtist` |
| 揭示 | `observeReveals` |
| 其他 | `toast` `magnetize` `bindChrome`（內含 `bindSleeve`） `bind` `init` |

就地在歌手間切換：

- `init()` 與 `applyArtist(id)` 共用 `renderAll()`，不各留一份渲染清單
- `applyArtist()` 先 `resetHosts()` 再重繪，最後 `syncPlayingRows()` 重新標記正在播的那列；
  `<audio>` 不重建，所以換歌手時播放不中斷
- `resetHosts()` 清的是 `appendChild` 型宿主（`APPEND_HOSTS`）與模組級 `index`／`fanCards`／
  `cards`／`ringNodes`／`legendNodes`／`ringsLive`；`buildIndex()` 自己也清 `index`
- 換歌手用 `history.pushState` 更新 `?a=`，`popstate` 就地套用，不觸發整頁導航
- `resetFanShift()` 在換歌手時收回換片狀態機的全部狀態（兩個計時器、`fanPending`、
  `fanShiftBusy`、`heroArt` 上的 `is-lit`）。留著上一位歌手的計時器，它會在新資料上
  補跑一次 `fanPaint()`，把新歌手的輪播多推一格

歌手頁的檔案層與年表軸（都在 `applyArtistChrome()` 內）：

- 檔案層 `.hero-archive`：`#haEn` 取 `JC.en`（缺就退回 `JC.name`）；
  `#haMeta` 由 `stats` 拼成「2000 至 2026 · 16 ALBUMS · 175 WORKS」；
  `#haNote` 取 `lastSentence(JC.intro)`，即 `intro` 的**末句**，不新增手寫文案。
  `#heroEyebrow` 只留 `tagline`，不再重複拉丁名（同一個拉丁名曾在首屏出現兩次）
- 年表軸 `#heroAxis`：每張專輯一道 `.ha-alb` 刻痕、每個階段起點一顆 `.ha-dot` 圓點與
  `.ha-year`、階段名 `.ha-title`；位置 = `(year − from) / (to − from)` 寫進 `--p`
  （年份運算在 JS，CSS 只負責畫）。末階段 `to > from` 時另立一個 `--p: 100%` 的端點標記，
  否則端點會與該階段自己的標籤疊在同一個位置。刻痕與圓點 `aria-hidden`，
  整條軸以 `aria-label` 交代。實測林志炫 14 個子項、周杰倫 5 個年份標籤（2000/2005/2010/2022/2026）
- `bindSleeve(host)`：展櫃與封面牆共用的指標追蹤，同一條 rAF 內寫 `--px`／`--py`
  （聚光位置）與 `--rx`／`--ry`（微傾，上限 2.2deg）；`pointerleave` 時清掉角度。
  熱路徑只讀一次 `getBoundingClientRect`，`pointerType === 'touch'` 與減少動效下不介入

歌曲檔案（Song Archive）：

- 讓「歌」成為獨立入口：點歌名不再是播放或展開清單，而是進到一首歌的檔案空間。
  三條入口都走 `data-archive="albumId:n"` 與同一個出口 `openArchive(albumId, n)`：
  曲目總表的歌名鈕、抽屜曲目列的歌名鈕、代表曲（`.pick`）
- 曲目列改成檔案式條目並長出懸停動作：編號欄是播放鈕、歌名是檔案入口，
  另有三個指標捷徑（`▶ 播放`／`◎ 閱讀歌詞`／`→ 查看檔案`）由 `trackActions(a, t)`
  產生。它們是 `span` 加 `aria-hidden`，**不進 Tab 序**：鍵盤與讀屏走的是編號欄播放鈕
  與歌名鈕，所以每列恰有 2 個 Tab 停點。`trackNameButton(a, t, cls)` 是曲目總表與
  抽屜曲目列共用的歌名鈕建構子
- 檔案是疊在抽屜之上的模態（`z-index` 1000；抽屜 990、歌詞舞台 1002、播放列 1005、
  提示條 1010）。開啟時把還在底下的抽屜標 `aria-hidden="true"`，關檔後還原
- 內容由 `archiveHTML(a, t)` 產生；每一首歌的檔案紀錄走 `songOf(a, t)`：
  `t.song` 存在就直接用（`build.mjs` 產出的每首歌自帶紀錄：`no` `title` `artist`
  `album` `year` `duration` `cover`，四個署名欄位 `lyricist`／`composer`／
  `arranger`／`producer`，以及選填的 `credits`／`description`／`story`／`tags`），
  不存在就由曲目與專輯就地補出同樣的形狀——HTML 更新而 JS 還是快取的舊版時，
  畫面與從前一致。`eraOfYear(y)` 找出這首歌落在哪個年代分期；`archiveNo(a, t)` 給
  全歌手目錄的筆次（`song.no` 優先，沒有才自己數），`trackCollab()` 從歌名抽合作者。
  資料模型與理由見 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) 的「歌曲檔案」
- 創作資訊分兩欄（`.sa-notes`）：左邊是這首歌的事實表（`曲序`／`發行`／`出版`／
  `長度`／`音源`／`歌詞`／`合作`／`選錄`），右邊是署名欄 `.sa-credits`。
  署名欄只放四個規範角色（`CREDIT_ROLES` 定順序，`creditRowsHTML(s)` 產生；
  四個都沒有時留一列「署名／未收錄」）。**其他署名**（混音／母帶／吉他／OP…）
  不放這一欄：它們的值常帶錄音室與城市（實測「Randy Merrill at Sterling Sound
  (New York, NY)」），塞進兩百多像素寬的欄位會折成三四行，把底部兩個入口頂出首屏
  （實測 `.sa-acts` 底緣 845 → 1049）。`extraCreditsText(s)` 把它們整理成一行，
  放到入口之後的補充區。**這一行多數時候不存在**：實測 1322 筆 `song` 記錄裡
  只有 162 筆帶其他署名（`credits.json` 816 條裡 146 條），所以補充區平常
  只有逐曲文案與時代背景
- 補充區 `.sa-story` 在**兩個入口之後**：`其他署名`、`歌曲介紹`、`創作背景`、
  `時代背景 · <分期名>`。逐曲文案的長度不可預期，放在入口之前一填上文案就會把入口
  推下折線；`時代背景` 取 `eraOfYear()` 的分期說明（既有編輯層文案，不新增）。
  四段都空時整個區塊不產生
- 關閉有 900ms 收尾：先移除 `is-open` 等淡出跑完，才設 `hidden` 並清空內容。
  守衛用序號 `saSeq` 而**不是** `saOpen()`：收尾期間 `hidden` 還是 false，
  用後者會恆為真、檔案再也收不掉。淡出途中重開要補回 `is-open`，
  否則內容換好卻停在透明態
- `Esc` 的先後：檔案開著而歌詞舞台也開著時，先關舞台、檔案留著。所以 `bindArchive()`
  必須在 `initAudio()` 之前呼叫（兩支都在 capture 階段的 `document` keydown 上，
  先註冊者先處理），且舞台開著時檔案整支讓路
- 換歌手（`applyArtist`）以 `{ instant: true, keepFocus: true }` 就地收起檔案，
  免得它指著上一份目錄
- 顏色沿用兩條既有通道：`--accent` 取該張專輯派生的色（與抽屜面板同一條規則），
  封面平均色走 `--amb` 只做低透明度光暈。`ambTriple()` 由原 `setAmbient()` 拆出，
  兩者共用同一個十六進位解析出口
- 頂列 `saPaintNav(hit)` 寫第幾首／共幾首與專輯名，`#saPrev`／`#saNext` 到端各自
  `disabled`；`stepArchive(d)` 只在該張專輯內走。`saSay(msg)` 是檔案底部的就地說明
  （不開空舞台、不彈 toast 蓋住檔案），寫入後把底部帶進視野；
  文字一律經 `setLive()` 清掉 `localize()` 的原文快取
- `openLyricsFor(albumId, n, note)` 是「閱讀歌詞」的出口：先把這首載進播放列
  （歌詞要跟著音訊走，已在播的同一首不動播放狀態），再交給 `JCLyrics.openFor()`

歌曲狀態列（Mini Song Bar，`#msb`）：頁面底部的「當前音樂檔案卡」。它不是播放器，
一格播放控制都沒有，只交代現在讀的是哪一首與歌詞入口（樣式見
[../css/README.md](../css/README.md) 的 29 節）：

- 顯示時機是「使用者點了一首歌」，兩條路徑都收斂到 `msbFocus(albumId, n)`：
  點歌名／代表曲開檔案（`openArchive()` 內）與按下播放（`plLoad()` 內）。
  事件層不各判一次，所以曲目總表、抽屜、代表曲、年輪讀數、隨機試聽都自動跟上
- 卡片指著的是「上一次被點開或被播放的那一首」，`msbRef` 保存 `{ album, n }`。
  同一首再點一次不重播動畫；換歌才走兩段錯峰
- 收起的三條規則：關閉播放列（`plClose()`，當前曲目清空）一起淡出；
  就地換歌手時若那一首不是正在播的那一首就收起（`msbPlaying()` 為真時留著，
  與播放列「不因換歌手而清空」一致）；關檔案**不**收起——它是頁面層的常駐狀態
- 內容四項（歌名／歌手／專輯／年份）與兩顆入口的名字都走 `setLive()`／`dropAttr()`，
  否則切換繁簡會還原成上一首的歌名（與 `syncPlayingRows` 同一條理由）
- 它的兩顆入口都不自己做事：歌名 → `openArchive(msbRef.album, msbRef.n)`，
  「查看歌詞」→ `openLyricsFor(msbRef.album, msbRef.n)`（沒有本機歌詞檔時就地彈
  toast 說明，與檔案的閱讀歌詞完全同一條路徑）
- 動效是類別驅動的兩階段狀態機（與主視覺換片同一套寫法）：
  `is-swapping`（舊卡 .36s 往上退）→ 換內容 → `is-entering`（新卡 .36s 從下面進來），
  合計約 720ms；出現／消失是 `.6s` 淡入淡出。**換歌那兩段一定要兩次 rAF**：
  同一個 frame 內加類又移類不會產生樣式重算，新卡會變成從上一階段的 -8px 浮回 0
  （實測值，見 [../AGENTS.md](../AGENTS.md) 的活躍坑）
- 收起用序號 `msbSeq` 守衛收尾計時器（同 `saSeq` 的理由），淡出途中又被叫回來時
  作廢上一輪；`REDUCED.matches` 時不排隊等那 .36s，內容直接換掉
- 讓位：`body.has-msb`／`html.has-msb` 兩個類別由 `msbShow()`／`msbHide()` 切換，
  CSS 端據此加底部內距與 `scroll-padding-bottom`，所以卡片不遮正文、也不遮焦點落點

### `lyrics.js`（歌手頁全屏歌詞，手寫，IIFE，無依賴）

- 職責：解析逐行 LRC 並驅動全屏歌詞舞台（`#lyricStage`），對外只暴露 `window.JCLyrics`
- 資料來源：`song.lyrics`（一個 sidecar 描述子 `{ source, format }`，只有
  `npm run build:local` 才會寫入；公開產物連這個鍵都沒有）。
  歌詞檔是與音檔同目錄的 sidecar `.lrc`，由 `_data/local-audio.mjs` 一併登記；
  歌詞**文本不進 data.js**——它是第三方版權文本，逐首內嵌也會讓產物多出約 2 MB
- 取檔（`loadFor(albumTitle, track)`，歌詞文本的唯一入口）只有一條路：
  用 `XMLHttpRequest` 讀 `track.lyrics` 指的 sidecar `.lrc`。
  `status` 非 0 也非 200 時視為取不到，交給 `settlePending()` 走「這首沒有歌詞」的去路。
  這一條路在 `file://` 下被 CORS 擋掉，**所以那個協定下歌詞讀不出來**（`http://` 下正常），
  歌詞舞台在 `file://` 拿不到文本
- 盤上另有 `js/lyrics/<專輯id>.js`（`window.LYRICS["<專輯id>-<序號>"] = "<LRC 全文>"`，
  只有本機態、gitignored），但取檔路徑完全不碰它們：`_data/build.mjs` 對該目錄只做
  「公開建置時整個刪掉」一件事，**沒有任何生成者**，`js/lyrics.js` 也沒有載入者，
  兩頭都是死的（見 [../AGENTS.md](../AGENTS.md) 的待辦）。`window.LYRICS` 因此
  不是任何一條取檔路徑的一部分，公開產物更沒有它
- 一行歌詞的規範形狀：`{ time, text, end }`。`time` 是秒（數字，便於比較與掃光插值），
  `text` 是該行文字，`end` 由解析器從下一行的 `time` 補出（最後一行給 4 秒）。
  `parseLrc()` 產出它，舞台內部直接消費，沒有第二套形狀；這個形狀也宣告在
  `DISCOGRAPHY.schema.lyricsLine`
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
- `openFor(albumTitle, track, onFail)`：歌曲檔案的歌詞入口。檔案按下「閱讀歌詞」時
  歌詞未必已解析完（`plLoad` 的預載是非同步的），所以把兩件事分開講：
  回傳 `false` 代表這首沒有歌詞（或舞台不在這一頁），呼叫方拿 `onFail` 就地說明；
  回傳 `true` 代表已受理，解析完成後自己開舞台。`cancel()` 作廢這筆待開請求，
  檔案關掉時由 app.js 呼叫，免得舞台自己彈回來
- `loadFor(albumTitle, track)`：簽名由 `(albumId, albumTitle, track)` 收成兩參數。
  `albumId` 從未被使用，留著一個不讀的參數只會讓呼叫端多傳一個錯的位
  （`openFor` 一度就因此傳錯位，被當成「這首沒有本機歌詞」）

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

主要函式：

| 函式 | 職責 |
|---|---|
| `statsText` | 拉丁式統計「9 ALBUMS · 131 WORKS」，數字全取 `stats`，不寫死 |
| `noteText` | 取 `intro` 的**末句**（以「。」切分、去空白）；不得自創文案，資料缺 `intro` 時留白 |
| `ambientOf` | 環境光色：`covers[0]` 所屬專輯的 `sourceAvg` → `"r, g, b"`；找不到或色值不合法時退回 `theme.accent`，兩者皆無則交還 CSS 預設 |
| `flashSwitch` | 真正切位時給 `.ld-hero` 加 `is-switching`，`SWITCH_MS = 400` 後移除；減少動效下不加 |
| `select` / `step` / `paint` | 切位、位移與整台重繪；動態文字一律走 `setText`／`setAttr` 記繁體原文 |
| `settle` | 三階段入場的收尾：移除 `html.ld-booting`、加上 `is-ready`；`BOOT_MS = 3400`，減少動效下立即呼叫 |

三階段入場（品牌 → 唱片架 → 資訊區）由 CSS 的 `animation-delay` 排程，JS 只切類。
先前的雙 rAF 立即收斂已移除：那等於把整段動畫截斷在起點。

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
- 三階段入場 / `settle` → 額外實測：`BOOT_MS`（3400ms）到期後同時移除 `ld-booting`
  並加上 `is-ready`，基礎態完全可見；`prefers-reduced-motion` 下**立即**收斂、不等待
- 環境光 / `ambientOf` → 額外實測：`--amb` 隨歌手變化，且等於該歌手 `covers[0]`
  所屬專輯的 `sourceAvg`（八位歌手逐一比對）；找不到專輯時退回 `theme.accent`
- 檔案層 / 年表軸 → 額外實測：八位歌手的 `#haEn` 與 `#haMeta` 皆為該歌手正確值；
  年表軸子項數 = 專輯數 ＋ 階段數（＋末階段端點 1），`--p` 落在 0–100% 之間
- 歌曲檔案 / `openArchive` / `bindArchive` → 額外實測：三條入口都能開；
  `#saPrev`／`#saNext` 與 ←→ 在專輯內翻頁、到端 `disabled`；`Esc` 先關舞台再關檔案；
  `→ 查看完整檔案` 換手到抽屜且不殘留；換歌手時檔案收乾淨
- 歌曲檔案的資料模型 / `songOf` / `creditRowsHTML` / `extraCreditsText` → 額外實測
  （獨立 1:1 chromium，8 位歌手 × 4 首＝32 樣本：首曲／其他署名最多／代表曲／歌名最長）：
  署名欄與補充區**對首屏折線零成本**——把它們與「事實表獨占整欄」兩種狀態各量一次，
  `.sa-acts` 的 `top` 差為 0、`.sa-craft` 高度完全相同（若把其他署名留在署名欄，
  底緣會由 845 漲到 1049，所以那條界線要守著）；結尾 `actsBottom` 落在 845–998，
  超過 900 的那幾首全是**既有**因素（2–3 行的長歌名把 `.sa-head` 撐高），不是這次改動
- 舊產物相容 / `songOf` → 額外實測：把 data.js 回應尾端接一段 `delete track.song`
  再載入（**不要**用字串替換去改產物，`credits` 的巢狀大括號會让它變成語法錯誤，
  量到的會是「資料沒載入」而不是「缺欄位」）：檔案照樣開得起來、標題與編號正確、
  署名區顯示「未收錄」、其他列不變、0 pageerror
- 繁簡切換 / 檔案署名 → 額外實測：切到簡體時署名一起轉
  （薛之謙→薛之谦、宋濤→宋涛、韓陽→韩阳，實測 `data-lang` 由 `t` 變 `s`）
- 曲目列 / `trackActions` → 額外實測：靜置 `opacity: 0`、真實指標懸停後 `opacity: 1`、
  移出回 0；每列 Tab 停點恰為 2（播放鈕＋歌名鈕）
- 主視覺的縱深 → 額外實測用**真實指標**（`page.mouse.click`）與命中取樣，
  不能只用 DOM 斷言：`document.elementsFromPoint` 會回報被遮住的卡片
- 歌曲狀態列 / `msbFocus` / `msbShow` / `msbHide` → 額外實測（獨立 1:1 chromium）：
  載入時不存在；點歌名與按播放都會出現；換歌是「舊卡退到 −8px → 換內容 →
  新卡由 ＋8px 進來」且總時長 500–800ms；出現是 `.6s` 淡入（量到完全到位）；
  同一首再點不重播；關播放列會淡出、切換歌手（非正在播那首）會收起；
  卡片與播放列不重疊（桌面 18px 間隙、390px 貼齊上緣）；捲到頁底仍留淨空；
  繁簡切換時四項內容與兩顆 `aria-label` 一起轉；減少動效下不做位移與等待。
  **動效取樣一律在頁內用 rAF 逐幀讀 `getComputedStyle`**：在外面輪詢會被
  往返時間吃掉，抓不到換歌的最遠點（實測會誤判成 −0.11px）
- 新增頂層函式 → 同步更新上表

## 已知坑

- 背景分頁的 CSS transition 會凍結，用自動化驗樣式前必須先讓頁面置前
- app.js 的 localize 以 WeakMap 快取原文；動態覆寫 `aria-label` 等屬性前須先清快取，
  否則切換語言會還原成舊值。landing.js 同樣以 WeakMap 記原文，因此動態內容一律走
  `setText` / `setAttr` 重設原文——否則切換歌手後再切語言會還原成上一位歌手
- 入口頁與歌手頁共用 `jc-lang`；兩頁的 `<html data-lang>` 由各自的腳本維護
- 入口頁的 `main` 帶 `.ld-main` 類，抵掉全站 `main { padding-top: var(--nav-h) }`：
  入口沒有固定頂欄，那份讓位會把首屏內容推到折線下方

- 進場的兩段錯峰**必須用兩次 rAF**：在同一個 frame 內 `classList.add('is-entering')`
  又 `remove` 不會產生樣式重算（加與移之間瀏覽器根本沒有機會算樣式），
  維持 `transition: none` 的「起始態」從未成立，內容於是從上一階段的結束值浮回 0
  （實測 −5.86 → 0），而不是從下面進來。rAF 回呼跑在該 frame 的樣式計算之前，
  所以要一次讓它畫、一次才移除。逐幀取樣要在**頁內**用 rAF 讀 `getComputedStyle`：
  在外面輪詢會被往返時間吃掉，抓不到最遠點（實測會誤判成沒問題）

- 換歌的兩段錯峰**必須用兩次 rAF**：在同一個 frame 內 `classList.add('is-entering')`
  又 `remove` 不會產生樣式重算（加與移之間瀏覽器根本沒有機會算樣式），
  維持 `transition: none` 的「起始態」從未成立，新卡於是從上一階段的 −8px 浮回 0
  （實測 −5.86 → 0），而不是從下面進來。rAF 回呼跑在該 frame 的樣式計算之前，
  所以要一次讓它畫、一次才移除

使用約束見 [AGENTS.md](AGENTS.md)。
