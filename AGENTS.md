# 声之年轮 — 维护索引

多歌手唱片陳列站：以年輪與數據陳列歌手的完整錄音室目錄。
現收錄張學友、周杰倫、Taylor Swift、林志炫、薛之謙。零執行期依賴，無建置步驟，
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
npm run build          # 遍历 _data/artists/* 重生成 js/data.js
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

## 驗證快照

CI 在 push 後自動執行；本節數字與 CI 結果互相校對，發現漂移先報告再改。

- 歌手 5 位：jacky-cheung（40 專輯/433 曲）、jay-chou（16/175）、taylor-swift（12/174）、terry-lin（10/126）、xue-zhiqian（13/131），共 1039 曲全部可試聽
- 主題三層實測：五位歌手各有強調色與母題（spotlight / ink / midnight / aria / neon）；同歌手每張專輯抽屜色從封面派生且互不重複
- 入口頁渲染 5 行歌手索引（各行內聯歌手強調色）；點進歌手頁；無參數或無效 `?a=` 回入口
- 歌手頁 14 個展示面，12 個 `<section>`；無合作者標注的歌手（薛之謙）該區自動收起
- `eslint .` 0 問題；`prettier --check .` 全通過
- `check-line-endings.py` 574 檔 0 不一致；`check-markdown-links.py` 0 錯誤
- `file://` 與 `http://` 兩條路徑：入口 → 歌手 → 播放 全鏈路可用（五位歌手各實測）
- 全站小字下限 12px（實測 <12px 為 0）；歌手頁首屏露出下一段 23–36px
- 入口頁桌面首屏 2 位歌手、手機 4 位；開場動畫首次 900ms，同會話切換歌手直接呈現
- 截圖 18 張，見 `screenshots/`

## 待辦

- [ ] 補 `docs/postmortem/`（暫無值得複盤的事故）
- [ ] 決定是否把 `assets/fonts/` 210 個 subset 改為按需子集化
- [ ] 母題只做氛圍層；五套母題（spotlight/ink/midnight/aria/neon）可再按人細修
- [ ] `js/data.js` 已達 651 KB（五歌手）；若繼續擴充考慮按歌手拆檔或壓縮

## 活躍坑

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
- PowerShell `Set-Content` 預設寫 CRLF，會讓 `.json` 變成純 CRLF；提交前跑 `check:eol`
- iTunes 回傳的日文新字體（説 / 啓 / 晩 / 涙）需經該歌手 meta.mjs 的 kanjiFix 轉正
- 大陸歌手在 TW 店的目錄元数据可能已是繁體（如薛之謙）；若遇到簡體來源，
  繁體模式下曲目名會保持簡體，須在該歌手 meta.mjs 註明

## 文檔地圖

- 架構與設計決策 → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 進行中計畫與 UI 改進待辦 → [docs/PLAN.md](docs/PLAN.md)
- 決策與依據記錄 → [.agents/notes/](.agents/notes/)
- 樣式手冊 → [css/README.md](css/README.md)
- 腳本手冊 → [js/README.md](js/README.md)
- 資料管線手冊 → [_data/README.md](_data/README.md)
- 新增歌手步驟 → [_data/artists/README.md](_data/artists/README.md)
- 校驗腳本手冊 → [scripts/README.md](scripts/README.md)
- CI 說明 → [.github/workflows/README.md](.github/workflows/README.md)
- 使用者入口 → [README.md](README.md)

各目錄的規則層見同目錄 `AGENTS.md`。
