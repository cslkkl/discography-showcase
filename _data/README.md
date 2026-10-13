# _data/ — 資料管線手冊

- 職責：抓取事實、保存中間產物、生成 `js/data.js`
- 被誰依賴：僅 `js/data.js` 是它的產物；站點本身不讀本目錄
- 多歌手：每位歌手一個資料夾，見 [artists/](artists/README.md)

## 檔案

### 生成器與伺服器

- `build.mjs`：唯一生成器。遍歷 `artists/*`，讀各自的 `albums-raw.json` + `colors.json` +
  `meta.mjs`，寫出 `js/data.js`（`window.DISCOGRAPHY`）。新增歌手不需要改這個檔案
- `serve.mjs`：零依賴靜態伺服器，供本機預覽與自動化驗證；埠號由參數指定。
  支援 HTTP Range 與串流：本機音檔單曲可達 200 MB，整檔讀入會爆記憶體，
  且沒有 `accept-ranges` 時瀏覽器把音源視為不可尋址、進度條拖不動
- `local-audio.mjs`：掃描自有音檔目錄，生成 `_data/local-audio.json`。用法與對應規則見下
- `place-media.mjs`：把使用者自備的音檔與歌詞從來源目錄對齊進 `assets/audio/<專輯id>/`。
  依「檔名序號 → 曲名」對應，用 FLAC 檔頭時長交叉驗證，同卷硬連結落盤（不佔額外空間）
  - `--write` 才真的落盤，預設只報告。`--prune` 清掉「被較好版本取代的同槽殘留」
    （先落了 `.mp3`、後來擇優改選 `.flac`，舊檔不會被登記卻是目錄裡的垃圾）；
    它設有安全上限：候選超過 20 個或超過保留數的四分之一就中止並以非零退出
  - 同一首若先落了卡拉OK版／伴奏版會被版本分數擋下；時長差超過 5 秒的檔拒絕落盤，
    3 到 5 秒之間視為母帶差異，接受但記錄
  - 標題對不上時可用 `meta.mjs` 的 `audioAlias` 人工對應：
    `{ Mascara: '煙燻妝' }`，或 `{ 圣所: { zh: '聖所', acceptDurationDiff: true } }`。
    這是人的判斷，所以住在編輯層；只有 `place-media.mjs` 讀它，`js/data.js` 不含此欄位

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

### 可選輸入：自有音檔

`local-audio.json`（不存在時忽略）：把曲目對應到使用者自有音檔，
格式 `{ "jay2000-1": "assets/audio/jay2000/01.m4a" }`。
鍵以專輯 id 為前綴，而專輯 id 全局唯一，故一份檔案服務所有歌手。

**本地音檔是 opt-in**：`npm run build` 一律忽略這份檔案，因為
`js/data.js` 是要公開的產物，不能指向只有本機有的檔案；
要把它們折進來自己聽，用 `npm run build:local`（即 `--local`）。

**注意**：跑一次 `npm run build` 就會讓全部曲目退回官方 30 秒試聽（本機音檔被略過），
已發生過一次「昨天還能整首播、今天只剩 30 秒」的誤會。自己聽歌請用 `npm run listen`，
它等於 `local-audio.mjs --write` 加 `build.mjs --local`。

同一個工具也會登記**歌詞**：與音檔同目錄、同序號或同名的 sidecar `.lrc`
（例如 `assets/audio/jay2000/01 可愛女人.lrc`）會寫進 `_data/local-lyrics.json`，
`build:local` 時逐曲寫成 `track.lyrics`。歌詞與音檔都不進版本庫。

這份檔案由 `local-audio.mjs` 生成，不要手寫：

```
assets/audio/<專輯id>/<任意檔名>.<m4a|mp3|aac|flac|opus|ogg|wav>

node _data/local-audio.mjs                    # 只報告，不寫檔
node _data/local-audio.mjs --write            # 寫出 local-audio.json
node _data/local-audio.mjs --write --rename   # 另把檔名補正為「兩位數序號 + 描述」
node _data/local-audio.mjs --list-albums      # 列出全部專輯 id，供建立目錄
node _data/local-audio.mjs --artist <id> [--album <id>]   # 只處理其中一部分
```

- 檔名對應：先看前綴數字（`01`／`1 -`／`[04]`），沒有數字才用曲名比對；
  曲名比對同時接受繁體原名與簡體轉換
- `--rename` 只補正序號，描述文字原樣保留（`3 - 星晴.m4a` → `03 星晴.m4a`）
- 工具只寫 `local-audio.json`；要生效需再接 `npm run build:local`
- **時長校驗**：對上的音檔會讀 FLAC 檔頭的 STREAMINFO 算真實時長，
  與資料的時長比對（容差 3 秒）。序號寫錯而抓錯曲目、截斷檔、假檔都會報出來；
  非 FLAC 或資料缺時長者不計
- 音檔與登記檔都不進版本庫，見 [../.gitignore](../.gitignore)；
  遠端沒有音檔時播放會回退到 Apple 試聽

合法來源：自有 CD 抓軌、購買的 DRM-free 數位專輯。站內不引入來源不明的錄音。

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
