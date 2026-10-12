# 声之年轮 — 维护索引

周杰倫十六張錄音室專輯展示站。零執行期依賴，無建置步驟，`index.html` 直接開啟即可。

## 全局規則

- 站點不得引入執行期依賴；新增依賴只允許進 `devDependencies`
- `js/data.js` 是生成物，禁止手改；改資料一律改 `_data/build.mjs` 後重跑
- 文案以繁體撰寫，執行時由 `localize()` 轉簡體；預設顯示簡體
- 唯一主題與唯一強調色：深墨一檔 + 朱砂 `#E0412B`，不引入第二強調色
- 強調色底上的圖示必須用 `--accent-on`，不得用 `--paper`
- 可見文案禁用 emoji 與破折號

## 常用指令

```powershell
npm run serve          # http://127.0.0.1:8099
npm run build          # 由 _data/albums-raw.json 重生成 js/data.js
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

無 CI 遠端，數字為手工維護；改動後若與事實不符，先報告再改本節。

- 16 專輯 / 175 曲目 / 175 首可試聽（Apple 官方 30 秒片段）
- 14 個展示面，12 個 `<section>`
- `eslint .` 0 問題；`prettier --check .` 全通過
- `check-line-endings.py` 326 檔 0 不一致
- `check-markdown-links.py` 19 檔 40 連結 0 錯誤
- 結構計數 20 項實測 0 不符；`file://` 與 `http://` 兩條路徑皆可播放
- 播放四態實測：空閒序號 / 播放中朱砂底深墨暫停符 / 已暫停 / 關閉清空
- 截圖 17 張，見 `screenshots/`

## 待辦

- [ ] 補 `docs/postmortem/`（暫無值得複盤的事故）
- [ ] 決定是否把 `assets/fonts/` 210 個 subset 改為按需子集化

## 活躍坑

- 背景分頁的 CSS transition 會被凍結在 `currentTime: 0`，此時 `getComputedStyle` 回傳起始值。
  用 Playwright 驗樣式前必須先 `bringToFront()`，否則會把測量假象誤判成 bug。見 [.agents/notes/](.agents/notes/)
- `body { overflow-x: hidden }` 會讓 `body` 成為捲動容器，導致全部 `position: sticky` 失效。
  必須用 `overflow-x: clip`，並以 `@supports not (overflow: clip)` 回退
- 本環境截圖對 `sticky` / `fixed` 圖層不可靠，常整片回傳背景色。
  驗證改用 DOM 斷言，或在截圖前隱藏其餘 `section` 並回到頂部
- 全螢幕 `mix-blend-mode` 顆粒會讓每一幀重繪整個視口，改為靜態
- `.rack-pin` 用 `overflow: hidden` 或 `will-change` 都會破壞 sticky，用 `clip`
- PowerShell `Set-Content` 預設寫 CRLF，會讓 `.json` 變成純 CRLF；提交前跑 `check:eol`
- iTunes 回傳的日文新字體（説 / 啓 / 晩 / 涙）需經 `KANJI_FIX` 轉正

## 文檔地圖

- 架構與設計決策 → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 決策與依據記錄 → [.agents/notes/](.agents/notes/)
- 樣式手冊 → [css/README.md](css/README.md)
- 腳本手冊 → [js/README.md](js/README.md)
- 資料管線手冊 → [_data/README.md](_data/README.md)
- 校驗腳本手冊 → [scripts/README.md](scripts/README.md)
- CI 說明 → [.github/workflows/README.md](.github/workflows/README.md)
- 使用者入口 → [README.md](README.md)

各目錄的規則層見同目錄 `AGENTS.md`。
