# _data/ — 資料管線手冊

- 職責：抓取事實、保存中間產物、生成 `js/data.js`
- 被誰依賴：僅 `js/data.js` 是它的產物；站點本身不讀本目錄
- 多歌手：每位歌手一個資料夾，見 [artists/](artists/README.md)

## 檔案

### 生成器與伺服器

- `build.mjs`：唯一生成器。遍歷 `artists/*`，讀各自的 `albums-raw.json` + `colors.json` +
  `meta.mjs`，寫出 `js/data.js`（`window.DISCOGRAPHY`）。新增歌手不需要改這個檔案
- `serve.mjs`：零依賴靜態伺服器，供本機預覽與自動化驗證；埠號由參數指定

### 每位歌手一個資料夾

`artists/<id>/`，id 為倉內唯一的小寫短橫線標識（如 `jay-chou`）：

| 檔案 | 性質 | 說明 |
|---|---|---|
| `albums-raw.json` | 事實 | 發行日、曲目、時長、封面鍵、試聽網址 |
| `colors.json` | 事實 | 各封面平均色，供年輪上色 |
| `meta.mjs` | 編輯層 | 歌手身份、每張專輯的標題與介紹、代表曲、年代分期、清洗規則 |

完整的新增步驟見 [artists/README.md](artists/README.md)。

### 抓取腳本（PowerShell，均接受 `-Artist` 參數）

- `fetch-previews.ps1 -Artist <id>`：為該歌手補齊 Apple 官方 30 秒試聽網址
- `extract-colors.ps1 -Artist <id>`：算出該歌手各封面的平均色
- `make-responsive-covers.ps1`：由 1200px 原圖產生 480 / 960 兩檔（掃整個 `assets/covers`）
- `fetch-fonts.ps1`：抓 Google Fonts 的 woff2 分片（全站共用，跑一次）
- `fetch-skill.ps1`：拉取外部 skill 的參考檔（偶發 SSL 失敗，可重跑）

### 第三方字典

- `TSCharacters.js` / `TSPhrases.js`：OpenCC 的繁簡轉換表，被 `build.mjs` 讀入並內嵌。
  這是轉換引擎，與歌手無關，全站共用一份

### 可選輸入

- `local-audio.json`（不存在時忽略）：把曲目對應到使用者自有音檔，
  格式 `{ "jay2000-1": "assets/audio/jay2000/01.m4a" }`。
  鍵以專輯 id 為前綴，而專輯 id 全局唯一，故一份檔案服務所有歌手

## 資料流

```
fetch-previews.ps1 -Artist <id> ─┐
extract-colors.ps1  -Artist <id> ─┼─→ artists/<id>/albums-raw.json + colors.json ─┐
                                  │                                                ├─→ build.mjs ─→ js/data.js
TSPhrases.js / TSCharacters.js ───┼────────────────────────────────────────────────┤
artists/<id>/meta.mjs（繁體編輯層）┘────────────────────────────────────────────────┘
```

## 變更影響路由

改這裡 → 必跑：

- `build.mjs` → `npm run build`，比對 `js/data.js` 差異是否符合預期，再跑站點 E2E
- 任一 `meta.mjs` → `npm run build` + `npm run check:eol`
- 抓取腳本 → 帶 `-Artist` 重跑，確認對應歌手的兩個 json 未被意外改寫
- `serve.mjs` → 重啟預覽伺服器並確認埠號與路徑對應

## 已知坑

- `Set-Content` 預設 CRLF，會讓 `.json` 變成純 CRLF，提交前須統一為 LF
- iTunes 回傳日文新字體（説 / 啓 / 晩 / 涙），由歌手自己的 `meta.mjs` 補清洗規則
- 抓 `gf.css` 後必須把字體路徑由 `../assets/fonts/` 改為 `./`，否則會 404
- 專輯 id 同時是封面檔名，跨歌手必須唯一（慣例：歌手前綴 + 年份）

使用約束見 [AGENTS.md](AGENTS.md)。
