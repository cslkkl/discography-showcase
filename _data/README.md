# _data/ — 資料管線手冊

- 職責：抓取事實、保存中間產物、生成 `js/data.js`
- 被誰依賴：僅 `js/data.js` 是它的產物；站點本身不讀本目錄

## 檔案

### 生成器

- `build.mjs`：唯一生成器。讀 `albums-raw.json` + `colors.json` + 內建 `META`，
  寫出 `js/data.js`。含 `KANJI_FIX`（日文新字體轉正）、`PHRASE_FIX`、
  `ERA_DEFS`（四個年代分期）、`COLLAB_FIX`（合作者署名清洗）
- `serve.mjs`：零依賴靜態伺服器，供本機預覽與自動化驗證；埠號由參數指定

### 事實輸入

- `albums-raw.json`：16 張專輯的權威事實（發行日、曲目、時長、封面、試聽網址）
- `colors.json`：各封面的平均色，供年輪上色

### 抓取腳本（PowerShell）

- `fetch-fonts.ps1`：抓 Google Fonts 的 woff2 分片與對應 CSS
- `fetch-previews.ps1`：為 175 首補齊 Apple 官方 30 秒試聽網址
- `extract-colors.ps1`：算出各封面平均色
- `make-responsive-covers.ps1`：由 1200px 原圖產生 480 / 960 兩檔
- `fetch-skill.ps1`：拉取外部 skill 的參考檔（偶發 SSL 失敗，可重跑）

### 第三方字典

- `TSCharacters.js` / `TSPhrases.js`：OpenCC 的繁簡轉換表，被 `build.mjs` 讀入並內嵌
- `gf.css`：抓取下來的 Google Fonts 原始 CSS，經修改把字體路徑改為相對路徑

### 可選輸入

- `local-audio.json`（不存在時忽略）：把曲目對應到使用者自有音檔，
  格式 `{ "jay2000-1": "assets/audio/jay2000/01.m4a" }`。存在時本機檔案優先於官方試聽

## 資料流

```
fetch-previews.ps1 ─┐
extract-colors.ps1 ─┼─→ albums-raw.json / colors.json ─┐
fetch-fonts.ps1 ────┘                                  ├─→ build.mjs ─→ js/data.js
TSPhrases.js / TSCharacters.js ────────────────────────┤
build.mjs 內的 META（繁體文案）─────────────────────────┘
```

## 變更影響路由

改這裡 → 必跑：

- `build.mjs` → `npm run build`，比對 `js/data.js` 差異是否符合預期，再跑站點 E2E
- `META` 文案 → `npm run build` + `npm run check:eol`
- 抓取腳本 → 重跑後確認 `albums-raw.json` / `colors.json` 未被意外改寫
- `serve.mjs` → 重新啟動預覽伺服器並確認埠號與路徑對應

## 已知坑

- `Set-Content` 預設 CRLF，會讓 `.json` 變成純 CRLF，提交前須統一為 LF
- iTunes 回傳日文新字體（説 / 啓 / 晩 / 涙），`KANJI_FIX` 負責轉正
- 抓 `gf.css` 後必須把字體路徑由 `../assets/fonts/` 改為 `./`，否則會 404

使用約束見 [AGENTS.md](AGENTS.md)。
