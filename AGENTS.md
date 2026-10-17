# 声之年轮 — 维护索引

多歌手唱片陳列站：以年輪與數據陳列歌手的完整錄音室目錄。
現收錄周杰倫、陶喆、Taylor Swift、林志炫、薛之謙、林俊傑、方大同、鄧紫棋。零執行期依賴，無建置步驟，
`index.html` 選歌手、`artist.html` 陳列。

## 全局規則

- 站點主體不得引入執行期依賴；新增依賴只允許進 `devDependencies`。
  使用者於 2026-10-15 確認的 Task 04 完整 Folia 歌詞舞台是定向例外：
  可在獨立、按需載入的舞台模組內使用必要執行期依賴與獨立建置，
  不擴展到首頁及歌手頁主體；範圍與驗收見 [完整升級待辦](docs/upgrade-roadmap.md)。
- `js/data.js` 是生成物，禁止手改；改資料一律改 `_data/artists/<id>/` 後重跑
- 新增歌手 = 新增 `_data/artists/<id>/` 資料夾 + `npm run build`，不改 `build.mjs`
- 不得自創名稱：歌手名用通行譯名（拉丁歌手直接用其英文名），
  主視覺題名 `heroTitle` 用歌手本名；不得為歌手編造名號、別稱或詩化題名
- 文案以繁體撰寫，執行時由 `localize()` 轉簡體；預設顯示簡體
- 主題分三層：站點層（深墨底、顆粒、品牌）全站共享；
  歌手層（強調色、印章、題名、母題）由 `meta.mjs` 的 `theme` 聲明；
  專輯層（抽內強調色）由封面派生，構建期算好對比。
  同一歌手頁內只有一個強調色；入口頁中性底，以各歌手的強調色作點綴
- Task 04 的全屏歌詞舞台可使用逐曲主題與原模式所需字體、光影；
  此例外僅在舞台內生效，退出後恢復目前瀏覽內容的站點主題，詳見
  [Task 04 規格](docs/task-04-folia-stage.md)
- 母題裝飾寫進 `css/motifs.css`，鉤子是根元素 `data-motif`；只做氛圍，不改版式、
  不動正文對比度，裝飾色一律取 `var(--accent)`
- 圓角兩個檔位：控制項 `--r-pill`、面與圖 `--r`。**明列例外**是入口的 `.ld-cta`
  與歌手頁 `.hero-cta` 內的按鈕：它們是**文字型按鈕**（透明底、無圓角、hover 時底部
  長出 1px 強調色細線，`.ld-cta` 的箭頭是文字符號 `→` 而非 svg），
  其餘圖示型控制項（頂欄、展櫃箭頭、播放列、抽屜）仍一律 `--r-pill`
- 字體四族各司一職：Noto Serif SC（中文標題）、Cormorant Garamond（拉丁銘牌，自託管）、
  Bodoni Moda（數字與年份）、Noto Sans SC（正文與控制項）
- 可見文案禁用 emoji 與破折號

## 常用指令

```powershell
npm run serve          # http://127.0.0.1:8099
npm run build          # 遍历 _data/artists/* 重生成 js/data.js（略過自有音檔，产物可公开）
npm run build:local    # 同上，但折入 assets/audio 里的自有音档，供本机整首播放
npm run listen         # 登记自有音档后直接按本机态构建；听歌用这条
npm run pack           # 打包可公开发的 dist/（不含本机音档与歌词）
npm run stamp          # 给 HTML 的 js/css 引用刷版本号，防混版卡死
npm run lint           # ESLint
npm run format         # Prettier 寫入
npm run check          # lint + format:check + check:docs + check:eol + check:ps1
npm run hooks:install  # 啟用 .githooks（新複製倉庫後跑一次）
```

檢查選擇：

| 改動類型 | 跑什麼 |
|---|---|
| `css/` `js/` | `npm run lint` + 站點 E2E |
| `_data/` | `npm run build` 後比對 `js/data.js` 與站點 E2E |
| `*.md` | `npm run check:docs` + `npm run check:eol` |
| 根設定檔 | `npm run check` 全套 |

## 提交規範

判據：每個提交單獨取出，都要能編譯、能測、能回滾；拆不動就合併，假拆分比真合併危險。

- 一個改動一個提交，不在同一提交裡混入無關改動
- 提交信息格式 `<type>(<scope>): <subject>`，scope 取模組名（`ui` / `rings` / `docs`）
- 提交信息寫清「做了什麼、為什麼、怎麼驗」，不寫流水賬
- 動手前先預判：每個提交單獨 checkout，`npm run lint` 與站點 E2E 都要能過
- 禁止拆出前向依賴的提交：被調用的函數必須與調用方同提交，或先引入舊行為的函數、後一個提交再改行為
- 同一 hunk 拆給多個提交時，共享的上下文行不能只歸一家，否則後續提交的 `git apply` 會失配
- 文檔同步歸入同一提交；一次同步跨多個改動時，`docs:` 提交緊隨其後

## 驗證快照

CI 在 push 後自動執行；本節數字與 CI 結果互相校對，發現漂移先報告再改。

- 歌手 8 位：david-tao（9 專輯/131 曲）、gem（6/70）、jay-chou（16/175）、jj-lin（14/169）、khalil-fong（10/128）、taylor-swift（12/174）、terry-lin（10/126）、xue-zhiqian（13/131），共 1104 曲全部可試聽
- 自有音檔：1104 曲中 1098 首可整首播放（99.5%）、901 首有歌詞；其餘只有官方 30 秒試聽
  （陶喆缺 5 首：不一樣、今天晚間新聞、桂冠英雄、沙灘 (Acappella Version)、沙灘 (Guitar Version)；
  Taylor Swift 的 8 秒口白 outro 來源目錄也沒有這個檔）。
  同名不同錄音的槽位已逐首核對時長，
  含林志炫〈Miss Mama〉（4:31 與 3:46 兩版）與〈有些女人不能碰〉（4:47 與 5:02 兩版）；
  音檔與歌詞都是 gitignored 的 sidecar
- 曲目序號 `n` 在每張專輯內連續唯一：雙 CD 精選曾按碟重編而撞鍵（兩首歌共用一個音檔），
  現由 `build.mjs` 統一重編，碟號另存 `disc`
- 主題三層實測：八位歌手各有強調色與母題（halftone / prism / ink / ripple / groove / midnight / aria / neon），
  對比度 4.67:1（jay-chou）至 9.82:1（david-tao）；同歌手每張專輯抽屜色從封面派生，多數互不重複
  （已知例外：taylor-swift 的 ts2017 與 ts2020a 同為 `#616161`，xue-zhiqian 的 xue2017 / xue2018 / xue2022 同為 `#616161`）
- 入口頁是一台唱片架：八位歌手可逐一選中，姓名、統計、強調色與 `href` 同步；
  無參數或無效 `?a=` 回入口，已刪歌手的殘留選擇回退首位。
  切換只靠點兩側封面、點舞台空白處（左退右進）與拖曳，不設左右箭頭與序號計數；
  點中央那張已選中的封面等同「進入專輯」，直接進該歌手頁
- 歌手頁主視覺是可左右翻的專輯輪播：中央為當前專輯、兩側各兩張（其餘 `hidden` 且不下載），
  點兩側翻到中央、點中央開啟該專輯抽屜、方向鍵與 Home／End 可操作；
  實測點右鄰封面後中央由《散了吧》變成《蒙娜麗莎的眼淚》，再點中央開出 12 首的抽屜。
  滑鼠停在任一張（或鍵盤聚焦）時該張放大跳出來，其餘照**視覺方向**往外讓開
  （實測最右那張被指到時，其餘四張位置全部左移 40–55px；移出即精確回位。
  注意「其餘四張大小不變」要判在縮放 `--fs` 上：讓開是橫向位移，
  而卡片帶著 `perspective` 投影，**投影寬度會漂 3–4px**，按 ±1px 嚴判會誤報）
- 主視覺的縱深是**每張卡自己的 `perspective(1400px)`**，不是祖先 `perspective` ＋ 子層
  `preserve-3d`：實測真實命中率 100%（獨立複現 68/68 點、12×8 網格、jay-chou、CSS 1440；
  另一輪為 1622/1622，林志炫，五張投影寬 376 / 291 / 230 / 243 / 299、與左欄文字間隙 58–70px）；
  換片停穩 ~1042ms。真實點右鄰後 `click.target` 為 `IMG`，中央由《Jay》變《范特西，開啟專輯》、**未誤開抽屜**
- 歌手頁「展櫃」是原生橫向捲動：頁面縱向捲動不被劫持，卡片要橫看再自己拖／按箭頭。
  實測 1440 寬下 `scrollWidth` 3778 / `clientWidth` 1906，拖曳 0→368（一張卡），
  右箭頭 0→368→736，左箭頭回 368，`End` 1872、`Home` 0，拖曳不誤開抽屜
- 切換歌手是**就地換資料**，不整頁重載，所以正在播的歌不會中斷：
  實測連切八次（走完八位再回首位）`paused` 恆為 false、`currentTime` 由 1.3 持續到 8.8 秒，
  且每次切片後曲目數／年輪／卷宗／年表／年代／封面牆／精選皆為該歌手正確值、零累積
- 歌手頁 `main` 下 10 個 `<section>`（三視圖合併後實測八位歌手一致）；展示面由 `renderAll()` 一次列全，
  就地換歌手與首次載入共用同一條路徑，無合作者標注的歌手（薛之謙）該區自動收起
  （檔案層與年表軸都放在既有的 `.hero-copy` 內，未新增 `<section>`）
- 播放列圖示（連續播放整張／全屏歌詞／關閉播放列等）滑鼠移上或鍵盤聚焦時顯示說明，
  文字直接取 `aria-label`（實測 12px、`::after` 的 opacity 由 0 變 1），翻譯與狀態變化自動跟上
- `eslint .` 0 問題；`prettier --check .` 全通過（2026-10-15 複驗：
  `stage/**` 12 個檔補排版後才全綠；`stage/dev/evidence.json` 是機器產物，已列入 `.prettierignore`）
- `check-line-endings.py` 4529 檔 0 不一致（這個數含 gitignored 的本機媒體與字體，
  會隨本機 sidecar 增減；口徑是「本機工作樹扣掉未追蹤的暫存檔」）；
  `check-markdown-links.py` 48 檔 216 連結 0 錯誤
  （已 `--exclude "*/stage/vendored"`：那是 Folia 上游逐字複本，不屬本站文檔網絡，
  它內部的相對連結指向沒被複製過來的上游文件）；
  `check-ps1-ascii.mjs` 6 檔全 ASCII
- Task 04 舞台：`stage/dist/lyric-stage.js` 311480 bytes ＋ `stage/dist/assets/lyric-stage.css` 199560 bytes；
  上游基準 Folia 0.7.18、commit `9a01e788…`、1798 檔 / 18872422 bytes（`stage/vendored/`，gitignored 可重建）。
  站點側實測（本機態，MCP chromium，`innerWidth` 自證）：三條歌詞入口都以真實指標開得起來；
  14 模式逐一以真實 `<select>` 切換後 `data-stage-mode` 等於所選值、播放不中斷、`audio` 恆為 1；
  shadow root 內尺寸 2560×1306、畫布 1344×685、`data-stage-webgl="true"`；
  換歌與 120ms 連點兩次 `plNext` 都跟得上；`data-stage-paused` 隨暫停／恢復切換；
  連開關 20 次後 `style`／`.stage-full-root`／`.stage-root`／`canvas`／`audio` 都不累積；
  無本機歌詞（陶喆全 131 首）就地說明、不開空舞台
- Task 04 舞台第二輪（2026-10-15，恢復自動與能力判斷）：
  舞台回報狀態走 `payload.onState`，`data-stage-*` 新增
  `auto`／`locks`／`intensity`／`theme-source`／`theme-accent`／`segment`／`segment-energy`／
  `mode-requested`。實測：手動選模式 → `auto=false`、`locks=m`、`aria-pressed=false`；
  手動調強度 → `locks=mi` 且主色**未**被灰階覆蓋；按恢復自動 → `auto=true`、`locks` 空、
  模式與強度回到歌曲自身的選擇、`aria-pressed=true`、可重複；
  段落強度依能量正確切換（`0.020`→calm、`0.678`→normal、`0.000`→calm），
  手動鎖強度後段落不再覆蓋。無 WebGL 時 `diorama`／`lumiere` 於渲染器啟動前換成 `classic`
  並寫出 `no-webgl-mode-fallback:<mode>`（錯誤邊界不再被觸發），
  `pendolo`／`still` 維持不變；`latent` 背景收斂為 `common`
- Task 04 舞台第三輪（2026-10-15，本地視覺主題系統）：AI 從核心依賴降為**可選精修**，
  舞台啟動只依賴本地解析（`js/stage-themes.js`：5 個人工預設＋封面派生的本地規則），
  段落改為「先服務、後靜態 `storage/segments/`」兩段式取得，服務全關也能運作。
  `isRealAiTheme()` 是「不得把非真實 AI 寫成 AI 分析成功」的唯一判據。
  新增 `data-stage-theme-source` 的取值 `preset`／`cover`／`segment`／`manual`／`ai`／`cache`，
  狀態列為**兩段式**（訊息＋摘要），摘要隨 `syncFromState` 每次現算。
  三首代表歌曲實測（服務完全關閉、無密鑰）：段落主色／強度／背景逐項與 sidecar 能量相符、
  手動鎖定後主題與背景都不被段落覆寫、恢復自動回到本地規則、切歌跟隨、關閉後 canvas 歸 0、
  四平台 `overflowX 0` 且無 <12px、無 WebGL 時歌詞仍可見且 0 個 Paper Shaders 錯誤。
  逐項數值見 [段落驗證方案](docs/evidence/segment-verification-plan.md)
- Task 04 兩層分析：`POST /theme` 在無密鑰時回 `reason: provider-unavailable` 的封面降級主題；
  `GET /segments/jay2000-1` 回 200 且帶 loopback CORS；`node tools/analyze-audio.mjs --only jay2000-1`
  產出 15 段（239.027 秒、歌詞可用）。**真實 AI 仍未接通**（見待辦）
- Task 13 可選自訂指針：預設關閉、偏好存 `localStorage` 的 `jc-cursor`；
  實測開關切換與記憶生效、裝飾只在展品互動區出現、`pointerleave` 收起、
  兩層裝飾 `pointer-events: none`、`body`／`html` 的 `cursor` 仍為 `auto`
- `npm run pack`：2463 檔 / 67.3 MB；引用檢查 313 個本地引用 0 缺失；
  舞台模組「完整且乾淨」；外洩檢查「乾淨」。以 `--root dist` 起服務後實測：
  入口 8 位歌手 → 真實點擊進入歌手頁（10 個 section、131 列、9 條年表）→
  官方試聽可播（`duration 10`）→ 狀態列歌詞入口就地說明「這首沒有本機歌詞」；
  公開資料 `withLocal 0` / `withLyrics 0`
- `file://` 與 `http://` 兩條路徑：入口 → 歌手 → 播放 全鏈路可用
  （2026-10-14 以 `file://` 逐位實測八位歌手：封面載入、曲目數與年輪數正確、`paused` 皆為 false。
  **歌詞在 `file://` 下讀不出來**：2026-10-15 實測 `XMLHttpRequest` 讀 sidecar `.lrc` 被 CORS 擋掉
  （`fetch` 同樣不行），而 `js/lyrics.js` 的取檔只有這一條路，所以那個協定下拿不到歌詞文本；
  公開產物不含歌詞）
- 全站小字下限 12px（實測 <12px 為 0）；歌手頁首屏露出下一段 23–36px。
  這一條的口徑是 `vh − nextTop`（hero 與 figures 之間 **gap = 0**，
  所以寫成 `nextTop − heroBottom` 會恆為 0）；`verify` 獨立複現 1440×900 → 36px、
  1366×768 → 31px，390×844 的 hero 高於視口，此檔不適用
- 全屏歌詞舞台：175 首周杰倫曲目全數登記到 sidecar `.lrc`（16 張專輯零缺失）；
  解析器濾掉標題頭行與製作人員行、保留副歌重複歌名；播放中掃光隨時間推進；
  `build:local` 才寫入歌詞欄位（公開產物逐位元組不含該欄位）
- 官方深鏈：專輯抽屜列出該歌手的官方入口（平台清單由 `meta.mjs` 的 `listen` 宣告）；
  Apple 用目錄自帶的 `collectionId` 直達專輯（90/90 張都有），其餘平台為搜尋連結
- 入口頁是單一舞台：中央封面組 + 兩側相鄰與遠端，中央封面 `--ld-cover` 為
  `clamp(196px, min(62vw, 40vh), 400px)`；實測 1440×900 → 360px、1366×768 → 307px、
  390×844 → 226px（舊記錄的「桌面 253–297px、窄屏 65%」已過時）。
  首屏四要素（品牌、中央封面、當前資訊、主操作）
  在 1366×768 與 390×844 都在折線以上。
  實測三檔折線（品牌底緣／舞台底緣／CTA 底緣，全部在折線以上、`overflowX = 0`）：
  1440×900 → 84 / 510 / 810；1366×768 → 80 / 442 / 735；390×844 → 78 / 349 / 636。
  獨立複現（`verify`，獨立進程 + 真實指標）另量 hero 底緣到視口底：1440×900 → 36px、
  1366×768 → 31px；390×844 的 hero 高 959 > 視口 844，「露出下一段」此檔不適用，
  只承諾四要素在折線以上（PASS）
- 入口頁年份軸線寬：桌面 300px、390px 下 132px；歌手編目條（8 個 `.ld-tab`）高度
  桌面 61px、390px 152px（兩列）
- 入口頁真實點命中（`verify`，獨立進程 + `page.mouse.click`）：自首位點右一
  david-tao → gem（+1）；自首位點右二 david-tao → jay-chou（**+2**，`click.target` 為 `IMG`）。
  修好前點右二只前進一位、`target` 是 `UL.ld-groups`
- 入口頁 `--amb` 八位（各自等於該歌手 `covers[0]` 所屬專輯的 `sourceAvg`）：
  16, 64, 138／121, 76, 105／114, 97, 91／161, 126, 150／171, 165, 159／203, 191, 175／
  87, 21, 30／142, 162, 188
- 8 位歌手檔案層實測（`#haEn` / `#haMeta`）：陶喆 David Tao／1997 至 2025 · 9 ALBUMS · 131 WORKS；
  鄧紫棋 G.E.M.／2009 至 2022 · 6 ALBUMS · 70 WORKS；周杰倫 Jay Chou／2000 至 2026 · 16 ALBUMS · 175 WORKS；
  林俊傑 JJ Lin／2003 至 2023 · 14 ALBUMS · 169 WORKS；方大同 Khalil Fong／2005 至 2024 · 10 ALBUMS · 128 WORKS；
  Taylor Swift／2006 至 2025 · 12 ALBUMS · 174 WORKS；林志炫 Terry Lin／1997 至 2020 · 10 ALBUMS · 126 WORKS；
  薛之謙 Joker Xue／2006 至 2024 · 13 ALBUMS · 131 WORKS
- 減少動效（`prefers-reduced-motion: reduce`）：入口頁 52ms 內即無 `ld-booting`、
  資訊區與切換列 `opacity` 為 1、`.ld-group` 的 transform 為 `matrix(1, 0, 0, 1, 0, 0)`；
  歌手頁 `.fan-sheen` 與 `.album-plate` 為 `display: none` / `transform: none`，
  檔案層與年表軸仍 `opacity` 1
- 開場動畫只在首次載入跑；就地在歌手間切換不重播開場，也不重新載入頁面
- 歌曲檔案三條入口（總表歌名鈕、抽屜曲目列歌名鈕、代表曲）都能開檔；
  1440×900 首屏內看得到底部入口：**32 樣本**（8 位歌手 × 首曲／其他署名最多／代表曲／
  歌名最長各一）實測 `.sa-acts` 底緣 845–998，其中 845–876 是絕大多數，
  超過 900 的 5 首全是**既有**因素（2–3 行的長歌名把 `.sa-head` 撐高，
  與署名／逐曲文案無關：把新增的兩塊隱藏後再量，`.sa-acts` 的 `top` 差為 0，
  `.sa-craft` 高度逐首相同）。390×844 與 1366×768 兩個入口都在折線下、
  要靠檔案自己捲（捲動容器 `scrollHeight` 1024–1291 > `clientHeight` 700–832）；
  兩種寬度都無橫向溢出、無 <12px 字
- 歌曲檔案的資料模型（每首歌自帶 `song`）：署名只放四個規範角色在署名欄，
  其他署名（混音／母帶／吉他…）走入口之後的補充區——它們的值常帶錄音室與城市，
  留在署名欄會把 `.sa-acts` 由 845 頂到 1049。
  **覆蓋率別當成普遍行為**：實測 1322 筆 `song` 記錄裡只有 162 筆帶其他署名
  （源頭 `credits.json` 816 條裡 146 條、共 386 列），所以多數檔案的補充區
  只有逐曲文案與時代背景、沒有「其他署名」那一行——看不到它不等於壞了。
  舊產物相容實測：把 data.js 回應尾端
  接一段 `delete track.song` 再載入，檔案照樣開得起來、署名區顯示「未收錄」、
  0 pageerror；繁簡切換時署名一起轉（薛之謙→薛之谦、宋濤→宋涛）
- 歌曲檔案淡入實測（獨立 1:1 chromium、以點擊時刻為基準）：兩輪各項落在
  `.sa-scrim` 半亮 194–310ms／全亮 424–511ms、`.sa-panel` 全亮 535–622ms、
  四段錯峰最後一段 650–736ms 到位（宣告值上界 840ms），整體落在 600–1000ms
- 曲目列的懸停動作：靜置 `opacity: 0`、真實指標懸停 `opacity: 1`、移出回 0；
  每列 Tab 停點恰 2 個（編號欄播放鈕、歌名鈕）；指標捷徑實際點擊可開檔（`→ 查看檔案` → 正確那一首）
- 歌曲檔案的歌詞入口三條路徑：未預載（pending 受理後自動開舞台，實測 完美主義 53 行）、
  已預載（星晴 55 行）、無歌詞檔（公開產物，就地說明「這首沒有本機歌詞」、不開空舞台）
- `Esc` 分層：歌詞舞台開著時先關舞台、檔案留著；檔案開著時 `Esc` 關檔案並把焦點還給開啟它的那一列
- `→ 查看完整檔案` 換手到抽屜：檔案即時退場、抽屜接手，焦點回到原本那一列
- 從抽屜進檔案時 `#sheet` 被標 `aria-hidden="true"`，關檔後還原
- 歌曲狀態列 Mini Song Bar（`#msb`，歌手頁頁面層，z-index 985）獨立實測 53 項全 PASS、
  0 pageerror（獨立 1:1 chromium、頁內 rAF 取樣、真實指標點擊）：載入時不存在；
  點歌名或按播放才出現；出現是 `.6s` 淡入（完全到位 523ms、0.95 在 378ms）；
  換歌是「舊卡退到 −8px → 換內容 → 新卡由 +8px 進到 0」兩段合計 714ms（落在 500–800ms）；
  同一首再點不重播；關播放列淡出（量到 opacity 0.757 的中間態才 `hidden`）、
  切到別的歌手（非正在播那首）收起；
  版面實測：桌面 332×62 置中貼底 18px、768px 306×62、390px 390×59 全寬貼底無圓角；
  有播放列時桌面留 18px 間隙、390px 貼齊播放列上緣（gap 0）；
  讓位 84／168px（390px 74／172px），捲到頁底仍有 44px 淨空（footer 底緣 776、卡片頂緣 820）；
  三檔皆無橫向溢位、卡片內無 <12px 字；25 字長歌名截斷成一行且卡片高度不變（仍 59px）；
  繁簡切換時四項內容與兩顆 `aria-label` 一起轉；減少動效下不做 14px 位移、不等那 .36s；
  卡片內沒有任何播放控制（`#msb input/[data-play]` 皆 0）；
  既有結構零回歸（`main` 下 10 個 `<section>`、175 列曲目、展櫃仍可捲、`Esc` 分層不變）
- 站點截圖 **20 張**，另有 [歌手入口概念參考](screenshots/concepts/)，見 `screenshots/`。
  一律 1:1 CSS 像素、獨立 `chromium.launch()` 拍攝（共用 MCP 瀏覽器視窗帶縮放，用它拍不到 1:1）。
  **全部 20 張已於 2026-10-17 按當前實現重拍**（品牌圖示改版後），尺寸與舊圖一致：
  1440×901 有 3 張（`18-landing`、`01-desktop-hero`、`20-lyric-stage`，T34）、
  1440×900 有 13 張（`02-album-detail`／`08-year-rings`／`09-eras`／`11-data`／`12-ranks`／
  `13-collaborators`／`14-signature-picks`／`15-player`／`16-sheet-player`／`17-offline-audio`、
  `10-cover-wall`，T37／T38）、`05-mobile-chronology` 300×700、`04-mobile-rack` 420×900、
  `06-offline-file-load` 1280×860、`07-desktop-chronology` 1600×1000、
  `03-mobile-hero` 300×700、`19-mobile-landing` 390×844。
  **取景／內容變化（不是只換文件）**：
  - T37（14 張）：`02-album-detail` 換成首張《Jay》抽屜（舊圖是另一張專輯）；
    `15-player`／`17-offline-audio` 是當前 hero 版式（舊版 hero 已改）；
    `04`／`05`／`07` 停在區塊起點（舊圖滾到列表中部）
  - T38（3 張）：`03-mobile-hero` 換成周杰倫頁（舊圖是薛之謙頁）；`10-cover-wall` 取景上移，
    讓兩行封面鋪滿視口（舊圖含區塊標題、封面較小）；`19-mobile-landing` 構圖未變，只有站徽換新
  - 理由：舊圖攝於 2026-10-12 至 10-14，**早於 2026-10-14 視覺升級與 2026-10-17 品牌改版**，
    要把圖拉回舊取景只能還原已不存在的版式
  `17-offline-audio` 在 `file://` 下拍，畫面上有 **2 條 `XMLHttpRequest` 報錯屬既有已知限制**
  （該協定讀不到 `.lrc`），圖本身正常，播放列顯示「本機音檔」。
  重拍口徑：視口內圖片 0 破圖、`overflowX` 0、0 pageerror（`17` 的兩條 XHR 除外）
- 截圖索引（`screenshots/`，檔名即主題，逐張對應）：入口 `18-landing`／`19-mobile-landing`；
  歌手頁主視覺 `01-desktop-hero`／`03-mobile-hero`；陳列面 `02-album-detail`／`04-mobile-rack`／
  `07-desktop-chronology`／`05-mobile-chronology`／`08-year-rings`／`09-eras`／`10-cover-wall`／
  `11-data`／`12-ranks`／`13-collaborators`／`14-signature-picks`；播放 `15-player`／
  `16-sheet-player`；離線 `06-offline-file-load`／`17-offline-audio`；歌詞舞台 `20-lyric-stage`；
  概念稿 `concepts/artist-selector-{desktop,mobile}`

## 待辦

- [ ] 補 `docs/postmortem/`（暫無值得複盤的事故）
- [ ] 決定是否把 `assets/fonts/` 212 個 subset 改為按需子集化
- [ ] 母題只做氛圍層；八套母題（halftone/prism/ink/ripple/groove/midnight/aria/neon）可再按人細修
- [ ] Task 04 第一層「真實 AI 主題」仍受阻：本機沒有可用密鑰（`OPENAI_API_KEY` 為空，
      服務日誌與 [AI 分析證據](docs/evidence/ai-analysis.md) 都記錄了實際觀察到的 401）。
      無密鑰時 `/theme` 回封面降級主題，舞台維持**本地主題**，狀態列照實寫
      「主題：本地規則（封面派生）」（第三輪改的措辭）；真實 AI 與測試替身另寫
      「主題：真實 AI（…）」「主題：測試替身（非真實 AI）」，三條路徑分開，不會互相冒充。
      `storage/theme-cache/` 已清空為 0 筆（先前那 2 筆是 `model: test-double` 的測試替身）。
      接上密鑰後要重跑一次端到端
- [ ] Task 04 段落 sidecar（`storage/segments/`）目前涵蓋 9 首
      （`jay2000-1` 239.027 秒 / 15 段，另有 chopin2005-10、jj2004-1、jj2013-2、jj2015-11、
      lin1998-11、ts2010-10、ts2014-4、ts2024-15）。
      **側car 的內容是機器產生的**（時間、能量、計數，不含歌詞全文與本機路徑），
      其餘曲目一律顯示「未接上段落分析」。全量要跑
      `node tools/analyze-audio.mjs --all`（1098 首，很久）
- [ ] `storage/theme-cache/` 目前是**空的 0 筆**（2026-10-15 第二輪收尾清掉）。
      先前那 2 筆是 `model: test-double` 的**測試替身**（`THEME_PROVIDER=stub`），
      不是真實 AI 結果；本輪已用 `POST /theme-cache/clear {"all":true}` 清空，
      並在清空前先實測過「替身快取被誤認成真實 AI」這條防線（狀態列照實寫
      「測試替身（非真實 AI）」）。接上密鑰後重跑端到端即可。
      這 0 筆與上面 9 個段落 sidecar 是 `storage/` 的全部內容
- [ ] Task 05 的 `timeline` 節點尚未接到畫面：資料管線已產出
      `[{ year, count, albums, songs }]`，但 `js/app.js` 沒有引用它；
      年輪／年表（`.chrono-row` 可點進專輯）／年代分期已可用
- [ ] Task 17 逐曲文案（`song.description` 歌曲介紹、`song.story` 創作背景）目前 1104 首全空；
      任務要求「至少八首有來源的介紹或背景」，缺的是可引用的原始記錄與人的判斷，
      沒有來源就不寫（不得編造）。寫法已備好（`meta.mjs` 的 `songs`，鍵 `<專輯id>-<序號>`）
- [ ] 本輪仍未驗證的兩條（其餘「未驗證」清單已於 2026-10-15 第二次補測中逐項量測完成）：
      1. **真實觸控全鏈路**（Task 19）——此環境的瀏覽器 context 沒開 `hasTouch`，
         `page.touchscreen.tap` 直接拋錯，屬工具限制；窄屏的溢出、字號、命中與選單
         已用真實指標驗過。要補測得換一個開了 `hasTouch` 的 context。
      2. **真實 AI 端到端**（Task 04 第一層）——本機無可用密鑰，`/health` 回
         `available: false`、`configReason: OPENAI_API_KEY 是空的`。
         封面派生與測試替身兩條已分別實測，且狀態列把三條路徑分開講
         （替身寫「測試替身（非真實 AI）」，不會被誤認）。WebGL 降級已於
         2026-10-15 第二輪實測觸發（見 [模式實測證據](docs/evidence/stage-modes.md) 第七節）。
      逐項數值見 [升級進度表](docs/upgrade-progress.md)
- [x] ~~`stage/dist/**` 不在 `?v=` 版本戳的範圍內~~ **已修（2026-10-15 第三輪）**：
      內容雜湊納入 `stage/dist/**`，版本號寫進 `js/lyric-stage.js` 的
      `/* stamp:stage-version */ var STAGE_VERSION`，由 `stageUrl()` 接到兩個產物 URL。
      自引用靠「算雜湊前把該常數歸一化」避免。
      第三輪的受控變更實測是 `e06bc055` → `f50ace0d` → 還原回 `e06bc055`
      （那是該輪產物的內容，現已不是當前值）。
      **第四輪複驗（2026-10-15，當前產物）**：連跑兩次 `npm run stamp` 收斂於 `bb4d1762`
      （0 變動）；把 `/* stamp convergence probe 2026-10-15 */`（無換行）追加到
      `stage/dist/lyric-stage.js` 後版本變 `75484f83`（三處同步），
      還原該檔後回到 `bb4d1762`，四個檔的 SHA256 複驗前後一致。
      瀏覽器實際請求 `stage/dist/lyric-stage.js?v=<版本>` 與 HTML 戳一致（第三輪實測）
- [ ] 橫屏（845×391）下舞台的視覺化只剩 95px 高（約視窗 24%）：功能與控制項都正常、
      無溢出，但觀感很擠。待人工視覺驗收判斷是否要另外調整橫屏比例
- [ ] `?v=` 版本戳**不含 `js/data.js` 的資料內容**（只涵蓋 `js/`、`css/` 檔的版本）。
      所以改完 `_data/` 重跑 `build` 但沒重跑 `stamp` 時，使用者的瀏覽器仍可能沿用舊資料。
      公開部署走一般 HTTP 快取，這是既有行為；要做嚴格快取控制就得讓 `data.js` 也帶版本戳
- [ ] `js/data.js` 已達 1096 KB（本機態）／1119 KB（公開態，八歌手）；gzip 226 KB
      （本機態大小隨登記的歌詞 sidecar 數變動）。
      每首歌自帶 `song` 紀錄（署名與逐曲文案的載體）是主要增量：raw +302 KB、gzip +36 KB。
      繼續擴充歌手時考慮按歌手拆檔或壓縮
- [ ] `file://` 下讀不到歌詞（已知落差，不是死代碼）：`js/lyrics.js` 取歌詞文本只有一條路，
      用 `XMLHttpRequest` 讀 sidecar `.lrc`，而該協定下 XHR 被 CORS 擋掉，
      **所以雙擊打開 `artist.html` 時歌詞取不到**（`http://` 一切正常）。
      Task 04 的 `js/lyric-stage.js` 同理走 XHR，`file://` 下會退回基本舞台並就地說明。
      2026-10-15 收尾：盤上殘留的 81 個 `js/lyrics/<專輯id>.js`（`window.LYRICS[…]`
      形式的歌詞全文、gitignored）已全數移除（現為 0 檔）；`_data/build.mjs` 只留一段
      防禦性刪除（公開建置時清空該目錄，免舊檔被複製出去），**既沒有生成者也沒有載入者**。
      要修就得生成側與消費側一起補（只補一側等於換一批死代碼）。
      設計紀錄見 [.agents/notes/2026-10-15-file协议歌词读取.md](.agents/notes/2026-10-15-file协议歌词读取.md)（狀態：已否決）
- [ ] 窄屏（≤620px）入口舞台的遠端封面（`data-off=±2`）是純死重：被相鄰封面 100% 包住，
      真實 `:hover` 命中 0／5016 點（幾何命中卻有 4980，DOM 斷言會假綠），且仍會下載封面。
      既有行為、非回歸；清理方向是窄屏把 `|off|=2` 一併標 `hidden`。
      窄屏選歌手走底部編目條，真實指標實測 8/8 全中
- [ ] 跑馬燈的無縫循環靠**兩份逐字相同的內容副本**：`tx ∈ [−週期, 0)` 的兩端落在同一格
      像素上，所以繞回不跳。這條成立的前提是**一個週期至少蓋滿當前視口**，
      否則繞回那一刻會露白。八位歌手實測最小的是 gem **4887px**（視口 1440），
      安全餘量充足；將來若某位歌手的 `signature`／歌名變少，使週期小於視口寬，
      就得**增加副本數**或改用其他填充策略（動態補足到至少一個視口寬）。**本輪不實作**；
      只要動到 `marqueeSongs()` 的取樣數或支援更窄的視口，就要回頭重算這一條

## 活躍坑

- **HTML 更新而 JS 還是快取的舊版**：舊腳本找不到已被刪掉的元素，會在
  `addEventListener` 拋錯、初始化中斷，整座唱片架停在「七張封面全疊在中央、
  歌名與統計空白、進入鈕只剩一個色塊」（實測就是這個樣子，維護者回報過）。
  HTML 的 `js/`、`css/` 引用一律帶 `?v=<版本>`，改過 `js/` 或 `css/` 就 `npm run stamp`
- 入口頁拖曳若在 `pointerdown` 就 `setPointerCapture`，指標被舞台捕獲後瀏覽器會把 `click`
  派發給舞台、而不是底下的封面鈕，於是**點封面完全不切換歌手**（方向鍵與拖曳卻正常，
  因為它們不經過那顆按鈕）。捕獲要延後到位移超過 8px、確認是拖曳時才做；且只要超過
  抓取門檻就視為拖曳、必須抑制隨後的 click，否則「拖了但沒到 40px 切換門檻」的手勢
  會落進空白處點擊而誤切一位。實測 `click` 的 target 一直是 `ld-stage` 即可斷定是這個原因
- **祖先 `perspective` ＋ 子層 `preserve-3d` 會吃掉「退到後面」那張封面的命中**：
  兩者合起來形成真正的 3D 脈絡，被 `translateZ` 推遠的卡片在真實指標下命中不到自己。
  歌手頁主視覺實測：在 `.fan` 子樹內以 64×44 網格取樣、只看落在卡片幾何範圍內的 1586 點，
  439 點（27.7%）穿透到宿主 `div.fan`，命中率只有 72.3%，真實點擊的 `click.target` 是
  `DIV.fan`；入口頁同因，點右二封面只前進一位、`click.target` 是 `UL.ld-groups`。
  修法是**每張卡自己的 `perspective(1400px)` 函式**（父層不掛透視、不掛 `preserve-3d`），
  命中率回到 100%，遠端封面投影寬只由 241px 變 235px。
  需要真縱深的重疊封面堆（`.fan-card`、`.ld-group`）都走這條；不重疊的展櫃／封面牆
  仍保留 `preserve-3d`（實測點擊正常、開啟抽屜成功）
- **`document.elementsFromPoint` 不是命中真相**：它會回報被遮住的卡片。實測對右鄰那張，
  DOM 命中測試回報是它，真實點擊卻落在中央那張、還誤開了抽屜。要判斷「某點是否真的
  能點到某元素」得用瀏覽器自己的 `el.matches(':hover')` 挑點，再用 `page.mouse.click()` 驗；
  測試輔助函式**不得**在真實點擊失敗時靜默回退成 `element.click()`，那會直接掩蓋這類回歸。
  統一句話：3D 相關的交互改動，驗收必須用真實指標事件與命中取樣，不能只用 DOM 斷言
- **群組 `opacity` 會壓平 3D 子樹**：`.fan.is-shifting` 原本用群組 `opacity: .26` 壓暗，
  外側封面在換片頭尾各跳一次（寬度 241 → 257.7 → 241，7.2%）。暗度要下放到每一張卡
  （`opacity: calc(var(--fo, 1) * .26)`），群組只留 `transform: scale(.972)`
- **入場錯峰不得騎在換位上**：`.fan-card` 的 `transition-delay: calc(--i * 95ms + 240ms)`
  配上 1.15s 入場時長，會讓一次換片要 1458–2263ms 才停穩。
  `.fan.is-shifting .fan-card, .fan.is-arriving .fan-card { transition-delay: 0ms; transition-duration: .62s; }`
  之後停穩 ~1042ms
- **CJK 的 `ch` 單位陷阱**：`ch` 以 CJK 字體解析只有半個漢字寬，`30ch` 會把中文句子
  切成兩三行（實測 391px 下 229.9px／3 行）。`.ha-note` 與 `.ld-note` 都改用
  `max-width: min(100%, 30rem)`
- **減少動效要連 `animation-delay` 一起歸零**：只把 duration 壓成 0 而留著 delay，
  分階段入場的元素會停在起始態（`opacity: 0`）近三秒才出現。末節已加
  `animation-delay: 0ms !important` 與 `transition-delay: 0ms !important`
- **別把 `setViewportSize()` 的請求值當成 CSS 視口**：共用 MCP 瀏覽器視窗可能帶非 1 的
  縮放（本專案就遇過視窗被縮到 75%，`1440×900` 的請求實際得到 CSS `1920×1200`）。
  任何版面數字都要以頁面內讀到的 `innerWidth` 自證；`viewport` 參數本身是 CSS 像素，
  用獨立進程 `chromium.launch()` 時請求值即所得（實測 `1440×900` → `innerWidth 1440`、
  `dpr = 1`）。**不要把「乘 0.75」寫進測試輔助函式**

- 去重守衛的自訂量初值必須是「未選中」：年輪讀數的 `ringsLive` 初值為 0，
  導致首次 `setRingLive(0)` 被 `if (i === ringsLive) return` 擋掉，讀數永不填充（初值改 -1）
- 改 CSS 變數類的批量替換要掃全量：本專案曾只替換 `.66/.68/.72/.74rem`，
  漏掉 `.6rem` 與 `.7rem`，字號下限沒真正落地
- 背景分頁的 CSS transition 會被凍結在 `currentTime: 0`，此時 `getComputedStyle` 回傳起始值。
  用 Playwright 驗樣式前必須先 `bringToFront()`，否則會把測量假象誤判成 bug。見 [.agents/notes/](.agents/notes/)
- 現代 Chrome 給普通 CSSStyleRule 也掛了空的 `cssRules` 屬性：遍歷樣式表時若以
  `if (r.cssRules)` 判斷是否下鑽，會把全部規則當嵌套規則跳過，得到「選擇器不存在」的假象。
  判斷必須用 `r.selectorText !== undefined`（本專案曾因此誤判級聯失效）
- `body { overflow-x: hidden }` 會讓 `body` 成為捲動容器，導致全部 `position: sticky` 失效。
  必須用 `overflow-x: clip`，並以 `@supports not (overflow: clip)` 回退
- 本環境截圖對 `sticky` / `fixed` 圖層不可靠，常整片回傳背景色。
  驗證改用 DOM 斷言，或在截圖前隱藏其餘 `section` 並回到頂部
- 全螢幕 `mix-blend-mode` 顆粒會讓每一幀重繪整個視口，改為靜態
- **就地換歌手必須清兩類狀態，否則畫面會悄悄疊加**：一是 `appendChild` 型宿主
  （曲目總表、卷宗、年表、年代、封面牆、精選、年輪圖例、主視覺、數據帶、章節），
  二是模組級索引 `index`（`buildIndex()` 只 push）。實測不清時連切三位歌手後
  曲目表 126→301→427、卷宗 10→26→36、年表 10→26→36、年代 3→7→10、精選 35→73，
  而 `catTotal` 卻是對的——數字對、DOM 疊，最容易看漏
- 抽屜開關要判外層 `.sheet` 的 `hidden`，不能判 `.sheet-panel`：
  後者是常駐 DOM、`display` 恆為 `flex`，用它判斷會永遠得到「已開啟」，
  把拖曳誤判成「誤開抽屜」
- 歌手頁目錄區有「展櫃／封面牆／年表」三個分頁，**上次選中的分頁存在瀏覽器 context 裡**：
  Playwright 量單一視圖前必須先點對應分頁，否則量到的是 `display: none` 的容器，
  會把「容器高 0、不可捲」誤判成功能壞了
- `position: sticky` 在展櫃已不使用（改原生橫向捲動）；若日後恢復 sticky，
  注意 `overflow: hidden` 與 `will-change` 都會破壞它，要用 `clip`
- PowerShell `Set-Content` / `Add-Content` 預設寫 CRLF，且 5.1 的 `-Encoding UTF8` 會寫入 BOM。
  兩者都會污染事實層：BOM 讓 `build.mjs` 的 `JSON.parse` 直接丟 SyntaxError（整份 data.js
  生不出來），CRLF 與 `.gitattributes` 的 LF 約定不符。抓取腳本改用
  `[System.IO.File]::WriteAllText` + `UTF8Encoding($false)`；`build.mjs` 的 `read()`
  也去一次 BOM 作容錯
- iTunes 回傳的日文新字體（説 / 啓 / 晩 / 涙）需經該歌手 meta.mjs 的 kanjiFix 轉正
- 大陸歌手在 TW 店的目錄元数据可能已是繁體（如薛之謙）；若遇到簡體來源，
  繁體模式下曲目名會保持簡體，須在該歌手 meta.mjs 註明
- **模態的收尾計時器守衛不能用「現在還開著嗎」判斷**：歌曲檔案要等 900ms 淡出跑完
  才設 `hidden`，守衛寫成 `saOpen()` 會恆為真（那時 `hidden` 還是 false，正是等收尾
  才要設的），於是收尾永遠提早 return，檔案再也收不掉。守衛要用序號 `saSeq`；
  同理，淡出途中重開要補回 `is-open`，否則內容換好卻停在透明態

- **同一個 frame 內加類又移類不會產生樣式重算**：進場態若寫成
  「加 `is-entering`（`transition: none`、`translateY(8px)`）→ 下一個 rAF 移除」，
  但 rAF 回呼跑在該 frame 的樣式計算**之前**，加與移之間瀏覽器根本沒機會算樣式，
  起始態從未成立：實測元素是從上一階段的結束值浮回 0（−5.86px），而不是從下面進來。
  要用**兩次 rAF**（一次讓它畫、一次才移除）。這一條只有頁內逐幀取樣看得出來；
  在外面 `waitForTimeout` 輪詢只量到 −0.11px（把退出的最遠點漏掉），會誤判成沒問題。
  這個教訓來自歌曲狀態列的實作紀錄
  [.agents/notes/2026-10-15-歌曲狀態列.md](.agents/notes/2026-10-15-歌曲狀態列.md)（狀態：生效）
- **固定層的讓位要用實測高度，不要沿用先前為它算的數字**：播放列先前留的讓位是
  78px／92px，實測是 74px／99px。照舊數字寫，模態底部就會被固定層蓋住一半，
  連底部的**真實指標點擊**都會逾時（`pl-inner intercepts pointer events`），
  而 DOM 斷言（`element.click()`）完全看不到這一條。目前不再抽權杖：28 節在
  `body.has-player` 下直接給 `.sa-inner` 實測底距（桌面 `calc(clamp(56px, 8vw, 108px) + 76px)`、
  窄屏 `calc(56px + 104px)`），換版式就要重量這兩個數
- **動效時長要用頁內 rAF 對帳**：外面的輪詢第一筆就被往返時間吃成 0.855，
  量不出淡入時長。頁內逐幀記錄 `performance.now()` 與 `getComputedStyle` 才有
  可對帳的毫秒數（歌曲狀態列實測淡入完全到位 523ms、換歌兩段 714ms）
- **動態 `import()` 是相對「腳本自己的 URL」解析，不是相對文件**：
  `js/lyric-stage.js` 裡的 `import('stage/dist/lyric-stage.js')` 會變成
  `/js/stage/dist/lyric-stage.js`（實測 404，整個舞台掛不上），而同一支裡的
  `fetch('stage/dist/…')` 卻正常——兩者基準不同，最陰險的是它看起來「檔案明明在」。
  一律用具名函式以 `document.baseURI` 解成絕對 URL（`stageUrl()`），別把裸相對路徑丟給 `import()`
- **文件 CSS 進不了 shadow root，尺寸要在裡面自己給**：舞台渲染在
  `#sfHost.shadowRoot` 內，站點 `.sf-host` 的尺寸不會傳給裡面的包裝層；
  少了 `:host{display:block;width:100%;height:100%}` 與 `.stage-full-root{position:relative;…}`，
  `.stage-root` 高度就是 0（實測畫布 `2640×0`，看起來「有掛上」卻什麼都看不到）。
  另外 shadow root 要在**注入樣式之前**就存在，且判斷包裝層要用 `querySelector` 而不是 `firstChild`
  （樣式標籤可能排在前面）
- **固定高度的格線容器：標記順序要對上 `grid-template-rows`**：`.stagefull` 是
  `auto minmax(0,1fr) auto`（頂欄／宿主／控制列），標記若寫成宿主在前，
  頂欄會佔走 `1fr`（實測被撐到 1441px，宿主 0）
- **Vite lib 模式的產物不能在站點頁面直接 `createRoot` 同一個宿主兩次**：
  換歌時對同一個宿主再 `createRoot`，React 會沿用舊根，畫面停在前一首；
  必須先 `handle.dispose()` 再掛新的（`js/lyric-stage.js` 的 `disposeStage()`）
- **打包腳本對 JS 裡 `'assets/…'` 的解析基準不是唯一的**：`_data/pack-public.mjs`
  原本一律按「頁面」解析，於是舞台裝載器那條相對 `stage/dist/` 的字串被報成缺失。
  規則已補：檔案內出現 `'stage/dist/'` 時改以 `stage/dist` 為基準；
  同時舞台完整性檢查會斷言 `lyric-stage.css` 必須存在（少了舞台就沒有樣式）
- **`?v=` 版本戳不含 `js/data.js` 的內容**：它刷的是 `js/`、`css/` 檔的版本。
  所以「切到本機態／改完資料重跑 `build`」之後，瀏覽器仍可能用快取的舊 `data.js`，
  表現出來是「明明有歌詞卻每首都說沒有本機歌詞」。判站點壞了之前先讀
  `DISCOGRAPHY.artists[id].tracks[0].lyrics` 有沒有值；量測時用
  `page.route` 改寫 `js/data.js` 的 URL（加唯一 query）強制重取
- **主視覺重疊封面：用「幾何中心」去點鄰卡會打到中央那張**：`.fan-card` 有 `perspective`
  投影且中央卡疊在上層，`cards[live+1]` 的中心點落在中央卡上（實測 `elementFromPoint`
  回 `IMG`、中央卡 `:hover` 為真而鄰卡為假），連點六次都不換片，看起來像功能壞了。
  點鄰卡前要先沿卡片內縮、以 `elementFromPoint` 找出「真的屬於該卡」的點
  （實測取到 0.5/0.1 位置）再 `page.mouse.click`；換片成功後 `--amb` 也會跟著換
- **`--amb` 的期望值要用 `covers[0].id` 回查 `albums`**：`covers[0]` 不保證是 `albums[0]`，
  直接拿 `albums[0].sourceAvg` 比會誤判成不符（實測 8 位裡有 3 位會被判錯）

## 文檔地圖

- 架構與設計決策 → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 進行中計畫與 UI 改進待辦 → [docs/PLAN.md](docs/PLAN.md)
- 完整升級效果、逐項提示詞與自主驗收 → [docs/upgrade-roadmap.md](docs/upgrade-roadmap.md)
- 升級實際進度與檢查證據 → [docs/upgrade-progress.md](docs/upgrade-progress.md)
- Task 04 完整 Folia 歌詞舞台與兩層 AI → [docs/task-04-folia-stage.md](docs/task-04-folia-stage.md)
- 首頁立體唱片架執行規劃 → [docs/artist-selector-plan.md](docs/artist-selector-plan.md)
- 早期歌詞舞台勘察（當前範圍見 Task 04） → [docs/lyric-stage-plan.md](docs/lyric-stage-plan.md)
- 決策與依據記錄 → [.agents/notes/](.agents/notes/)
- Task 04 舞台模組手冊 → `stage/README.md`（模組原始碼不入庫，故不設連結）
- Task 04 兩層分析工具手冊 → `tools/README.md`（工具原始碼不入庫，故不設連結）
- Task 04 模式與 AI 實測證據 → [docs/evidence/](docs/evidence/)
- 樣式手冊 → [css/README.md](css/README.md)
- 腳本手冊 → [js/README.md](js/README.md)
- 資料管線手冊 → [_data/README.md](_data/README.md)
- 新增歌手步驟 → [_data/artists/README.md](_data/artists/README.md)
- 校驗腳本手冊 → [scripts/README.md](scripts/README.md)
- CI 說明 → [.github/workflows/README.md](.github/workflows/README.md)
- 使用者入口 → [README.md](README.md)
- 本輪升級的交付說明（交付物、啟動、改動清單、驗收、未完成項） → `DELIVERY.md`（一次性交付文件，不隨專案入庫，故不設連結）

各目錄的規則層見同目錄 `AGENTS.md`。
