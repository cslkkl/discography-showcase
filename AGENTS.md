# 声之年轮 — 维护索引

多歌手唱片陳列站：以年輪與數據陳列歌手的完整錄音室目錄。
現收錄周杰倫、Taylor Swift、林志炫、薛之謙、林俊傑、方大同、鄧紫棋。零執行期依賴，無建置步驟，
`index.html` 選歌手、`artist.html` 陳列。

## 全局規則

- 站點不得引入執行期依賴；新增依賴只允許進 `devDependencies`
- `js/data.js` 是生成物，禁止手改；改資料一律改 `_data/artists/<id>/` 後重跑
- 新增歌手 = 新增 `_data/artists/<id>/` 資料夾 + `npm run build`，不改 `build.mjs`
- 不得自創名稱：歌手名用通行譯名（拉丁歌手直接用其英文名），
  主視覺題名 `heroTitle` 用歌手本名；不得為歌手編造名號、別稱或詩化題名
- 文案以繁體撰寫，執行時由 `localize()` 轉簡體；預設顯示簡體
- 主題分三層：站點層（深墨底、顆粒、品牌）全站共享；
  歌手層（強調色、印章、題名、母題）由 `meta.mjs` 的 `theme` 聲明；
  專輯層（抽內強調色）由封面派生，構建期算好對比。
  同一歌手頁內只有一個強調色；入口頁中性底，以各歌手的強調色作點綴
- 母題裝飾寫進 `css/motifs.css`，鉤子是根元素 `data-motif`；只做氛圍，不改版式、
  不動正文對比度，裝飾色一律取 `var(--accent)`
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
npm run check          # lint + format:check + check:docs + check:eol
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

- 歌手 7 位：gem（6 專輯/70 曲）、jay-chou（16/175）、jj-lin（14/169）、khalil-fong（10/128）、taylor-swift（12/174）、terry-lin（10/126）、xue-zhiqian（13/131），共 973 曲全部可試聽
- 自有音檔：973 曲中 972 首可整首播放（99.9%）、885 首有歌詞；僅 1 首只有官方 30 秒試聽
  （Taylor Swift 的 8 秒口白 outro，來源目錄沒有這個檔）。同名不同錄音的槽位已逐首核對時長，
  含林志炫〈Miss Mama〉（4:31 與 3:46 兩版）與〈有些女人不能碰〉（4:47 與 5:02 兩版）；
  音檔與歌詞都是 gitignored 的 sidecar
- 曲目序號 `n` 在每張專輯內連續唯一：雙 CD 精選曾按碟重編而撞鍵（兩首歌共用一個音檔），
  現由 `build.mjs` 統一重編，碟號另存 `disc`
- 主題三層實測：七位歌手各有強調色與母題（prism / ink / ripple / groove / midnight / aria / neon），
  對比度 4.80:1 至 9.44:1；同歌手每張專輯抽屜色從封面派生且互不重複
- 入口頁是一台唱片架：七位歌手可逐一選中，姓名、統計、強調色與 `href` 同步；
  無參數或無效 `?a=` 回入口，已刪歌手的殘留選擇回退首位。
  切換只靠點兩側封面、點舞台空白處（左退右進）與拖曳，不設左右箭頭與序號計數；
  點中央那張已選中的封面等同「進入專輯」，直接進該歌手頁
- 歌手頁主視覺是可左右翻的專輯輪播：中央為當前專輯、兩側各兩張（其餘 `hidden` 且不下載），
  點兩側翻到中央、點中央開啟該專輯抽屜、方向鍵與 Home／End 可操作；
  實測點右鄰封面後中央由《散了吧》變成《蒙娜麗莎的眼淚》，再點中央開出 12 首的抽屜
- 歌手頁 10 個 `<section>`（三視圖合併後實測七位歌手一致），14 個展示面；
  無合作者標注的歌手（薛之謙）該區自動收起
- `eslint .` 0 問題；`prettier --check .` 全通過
- `check-line-endings.py` 937 檔 0 不一致；`check-markdown-links.py` 0 錯誤
- `file://` 與 `http://` 兩條路徑：入口 → 歌手 → 播放 全鏈路可用（五位歌手各實測）
- 全站小字下限 12px（實測 <12px 為 0）；歌手頁首屏露出下一段 23–36px
- 全屏歌詞舞台：175 首周杰倫曲目全數登記到 sidecar `.lrc`（16 張專輯零缺失）；
  解析器濾掉標題頭行與製作人員行、保留副歌重複歌名；播放中掃光隨時間推進；
  `build:local` 才寫入歌詞欄位（公開產物逐位元組不含該欄位）
- 官方深鏈：專輯抽屜列出該歌手的官方入口（平台清單由 `meta.mjs` 的 `listen` 宣告）；
  Apple 用目錄自帶的 `collectionId` 直達專輯（91/91 張都有），其餘平台為搜尋連結
- 入口頁是單一舞台：中央封面組 + 兩側相鄰與遠端，桌面中央封面 253–297px，
  窄屏為可用寬度的 65%；首屏五要素在 1366×768 與 390×844 都在折線以上
- 開場動畫首次 900ms，同會話切換歌手直接呈現
- 站點截圖 19 張，另有 [歌手入口概念參考](screenshots/concepts/)，見 `screenshots/`

## 待辦

- [ ] 補 `docs/postmortem/`（暫無值得複盤的事故）
- [ ] 決定是否把 `assets/fonts/` 210 個 subset 改為按需子集化
- [ ] 母題只做氛圍層；五套母題（spotlight/ink/midnight/aria/neon）可再按人細修
- [ ] `js/data.js` 已達 651 KB（五歌手）；若繼續擴充考慮按歌手拆檔或壓縮

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
- `.rack-pin` 用 `overflow: hidden` 或 `will-change` 都會破壞 sticky，用 `clip`
- PowerShell `Set-Content` / `Add-Content` 預設寫 CRLF，且 5.1 的 `-Encoding UTF8` 會寫入 BOM。
  兩者都會污染事實層：BOM 讓 `build.mjs` 的 `JSON.parse` 直接丟 SyntaxError（整份 data.js
  生不出來），CRLF 與 `.gitattributes` 的 LF 約定不符。抓取腳本改用
  `[System.IO.File]::WriteAllText` + `UTF8Encoding($false)`；`build.mjs` 的 `read()`
  也去一次 BOM 作容錯
- iTunes 回傳的日文新字體（説 / 啓 / 晩 / 涙）需經該歌手 meta.mjs 的 kanjiFix 轉正
- 大陸歌手在 TW 店的目錄元数据可能已是繁體（如薛之謙）；若遇到簡體來源，
  繁體模式下曲目名會保持簡體，須在該歌手 meta.mjs 註明

## 文檔地圖

- 架構與設計決策 → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 進行中計畫與 UI 改進待辦 → [docs/PLAN.md](docs/PLAN.md)
- 首頁立體唱片架執行規劃 → [docs/artist-selector-plan.md](docs/artist-selector-plan.md)
- 決策與依據記錄 → [.agents/notes/](.agents/notes/)
- 樣式手冊 → [css/README.md](css/README.md)
- 腳本手冊 → [js/README.md](js/README.md)
- 資料管線手冊 → [_data/README.md](_data/README.md)
- 新增歌手步驟 → [_data/artists/README.md](_data/artists/README.md)
- 校驗腳本手冊 → [scripts/README.md](scripts/README.md)
- CI 說明 → [.github/workflows/README.md](.github/workflows/README.md)
- 使用者入口 → [README.md](README.md)

各目錄的規則層見同目錄 `AGENTS.md`。
