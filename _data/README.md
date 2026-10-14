# _data/ — 資料管線手冊

- 職責：抓取事實、保存中間產物、生成 `js/data.js`
- 被誰依賴：僅 `js/data.js` 是它的產物；站點本身不讀本目錄
- 多歌手：每位歌手一個資料夾，見 [artists/](artists/README.md)

## 檔案

### 生成器與伺服器

- `build.mjs`：唯一生成器。遍歷 `artists/*`，讀各自的 `albums-raw.json` + `colors.json` +
  `meta.mjs`（另有選填的 `credits.json`），寫出 `js/data.js`（`window.DISCOGRAPHY`）。
  新增歌手不需要改這個檔案
- `build.mjs` 對 `js/lyrics/` 只做一件事：公開建置時把整個目錄刪掉，免得公開產物
  帶上歌詞全文（該目錄是第三方版權歌詞文本，不進版本庫，與 `assets/audio`、
  `local-lyrics.json` 同進出）。**本機態已經沒有任何東西生成它**，盤上殘留的
  `js/lyrics/<專輯id>.js`（`window.LYRICS["<專輯id>-<序號>"] = "<LRC 全文>"`）是舊構建的
  遺留物：`js/lyrics.js` 取歌詞只走 `XMLHttpRequest` 讀 sidecar `.lrc`，沒有載入這些
  payload 的程式，所以 **`file://` 下歌詞讀不出來**，這批檔案目前是死檔
  （見 [../AGENTS.md](../AGENTS.md) 的待辦）
- `extract-credits.mjs`：從歌詞 sidecar 的製作人員行抽出署名，寫出各歌手的
  `artists/<id>/credits.json`。用法與規則見下
- `fetch-s2t.mjs`：抓 OpenCC 的簡→繁字典，寫出 `_data/STCharacters.js`（抽取署名時
  要把簡體來源轉成繁體，見下）。`--from <檔案>` 可用本機已有的字典檔，離線也能重建
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
  - 同名多曲先按括號版本限定詞分層：〈沙灘 (鋼琴版)〉不會去填〈沙灘 (Acappella Version)〉
    或〈沙灘 (Guitar Version)〉。`norm()` 把小括號整段拿掉，同名不同版本來共用一個鍵，
    而這幾個版本的時長只差 0.6 至 2.3 秒（容差 3 秒），光靠時長擋不住。
    分層只在**來源檔名自己帶了限定詞**時生效，來源沒帶限定詞時維持原行為，
    所以「同一份錄音在目錄裡的兩個條目」（如〈Mine〉與〈Mine (US Version)〉）不會被誤判成缺
  - 標題對不上時可用 `meta.mjs` 的 `audioAlias` 人工對應：
    `{ Mascara: '煙燻妝' }`，或 `{ 圣所: { zh: '聖所', acceptDurationDiff: true } }`。
    這是人的判斷，所以住在編輯層；只有 `place-media.mjs` 讀它，`js/data.js` 不含此欄位

### 每位歌手一個資料夾

`artists/<id>/`，id 為倉內唯一的小寫短橫線標識（如 `jay-chou`）：

| 檔案 | 性質 | 說明 |
|---|---|---|
| `albums-raw.json` | 事實 | 發行日、曲目、時長、封面鍵、試聽網址 |
| `colors.json` | 事實 | 各封面平均色，供年輪上色 |
| `credits.json` | 事實 | 逐曲署名（詞／曲／編曲／製作人與其他），由 `extract-credits.mjs` 生成 |
| `meta.mjs` | 編輯層 | 歌手身份、每張專輯的標題與介紹、代表曲、年代分期、逐曲文案、清洗規則 |

完整的新增步驟見 [artists/README.md](artists/README.md)。

### 逐曲署名（`credits.json`）

歌曲檔案要顯示作詞／作曲／編曲／製作人，但 Apple 目錄不提供署名，唯一的事實來源是
sidecar `.lrc` 開頭那幾行的製作人員行（`词：徐若瑄`）。歌詞文本本身不進版本庫
（第三方版權），署名是事實、可以入庫，所以由工具抽出來單獨保存：

```
node _data/local-audio.mjs --write        # 先登記 sidecar（或直接 npm run listen）
node _data/extract-credits.mjs            # 只報告：掃描幾首、各角色覆蓋率
node _data/extract-credits.mjs --write    # 寫出 artists/<id>/credits.json
node _data/extract-credits.mjs --names    # 另列署名對照表（繁體化稽核用）
```

- 鍵與其他登記檔一致：`<專輯id>-<序號>`；只寫這首歌真的有的欄位
- 一個時間戳底下常擠著兩三個角色（`词：方文山 作曲：林俊杰`），所以解析是
  「找出所有角色標記、兩兩之間的文字歸前一個角色」，只認開頭那個標記會把半截算進去
- 並列多名以 `/`、`、`、`,`、`&`、`+` 與**連兩個以上空白**切開；單一空白保留
  （`Taylor Swift` 靠它），括號內的逗號也保留（母帶署名常帶 `(New York, NY)`）
- 繁體化：來源是簡體，站點資料一律以繁體保存。只有單一候選的簡體字才自動轉，
  多候選者保留原字（范／于／余／胡／朴在姓名裡就是本字），少數指名單位的署名寫在
  工具內的 `NAME_FIX`（如 `周杰伦 → 周杰倫`、`钟兴民 → 鍾興民`）；OpenCC 會產出
  台灣標準異體（峯／爲／啓），再由 `VARIANT_FIX` 歸一到本站慣用字形
- 純事實、重跑冪等：同一批輸入重跑，7 份 `credits.json` 逐位元組相同
- **沒有 sidecar 也能建置**：`credits.json` 是入庫的事實檔，`build.mjs` 讀它；
  `local-lyrics.json` 不在時本工具只是不做事（印一行說明就結束）
- 逐曲文案（`description`／`story`）不從這裡來，那要人手寫，住 `meta.mjs` 的 `songs`

### 抓取腳本（PowerShell，均接受 `-Artist` 參數）

- `fetch-previews.ps1 -Artist <id>`：為該歌手補齊 Apple 官方 30 秒試聽網址
- `extract-colors.ps1 -Artist <id>`：算出該歌手各封面的平均色
- `make-responsive-covers.ps1`：由 1200px 原圖產生 480 / 960 兩檔（掃整個 `assets/covers`）
- `fetch-fonts.ps1`：抓 Google Fonts 的 woff2 分片（全站共用，跑一次）
- `fetch-skill.ps1`：拉取外部 skill 的參考檔（偶發 SSL 失敗，可重跑）

### 第三方字典

- `TSCharacters.js` / `TSPhrases.js`：OpenCC 的繁簡轉換表，被 `build.mjs` 讀入並內嵌。
  這是轉換引擎，與歌手無關，全站共用一份
- `STCharacters.js`：同一份字典的**反方向**（簡→繁），由 `fetch-s2t.mjs` 抓成單行
  序列化格式。它只在建構期抽取署名時用得到（來源 LRC 是簡體、站點資料是繁體），
  所以不進 `js/data.js`，只留在 `_data/` 這一層。每個鍵的值可能有多個候選，
  抽取工具靠候選數判斷「這個字有沒有歧義」

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
`npm run pack` 有同樣的副作用：它打包前會先跑一次不帶 `--local` 的 `build.mjs`，
所以打包完 `js/data.js` 也變回公開態（實測本機態 721,213 bytes 被打成公開態 811,302 bytes），
要恢復本機整首播放得再跑一次 `npm run listen`。

同一個工具也會登記**歌詞**：與音檔同目錄、同序號或同名的 sidecar `.lrc`
（例如 `assets/audio/jay2000/01 可愛女人.lrc`）會寫進 `_data/local-lyrics.json`，
`build:local` 時逐曲寫成 `track.song.lyrics`（一個 `{ source, format }` 描述子；
歌詞文本仍然不進 data.js）。歌詞與音檔都不進版本庫。
`extract-credits.mjs` 也讀同一份登記檔，把製作人員行抽成入庫的署名。

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
extract-credits.mjs（讀 sidecar）──┼─→ artists/<id>/credits.json ──────────────────┤
                                  │                                                ├─→ build.mjs ─→ js/data.js
TSPhrases.js / TSCharacters.js ───┼────────────────────────────────────────────────┤
STCharacters.js（簡→繁，只有抽取署名時用）─┘                                        │
artists/<id>/meta.mjs（繁體編輯層）┘────────────────────────────────────────────────┘
```

`js/data.js` 每首歌自帶一份 `song` 紀錄（見 [js/README.md](../js/README.md) 與
[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)）：事實來自 `albums-raw.json` 與
`credits.json`，逐曲文案來自 `meta.mjs` 的 `songs`（鍵 `<專輯id>-<序號>`，
打錯鍵 `build.mjs` 會直接報錯）。

## 變更影響路由

改這裡 → 必跑：

- `build.mjs` → `npm run build`，比對 `js/data.js` 差異是否符合預期，再跑站點 E2E
- 任一 `meta.mjs` → `npm run build` + `npm run check:eol`
  （新增或修改 `songs` 的逐曲文案時，鍵必須是既有的 `<專輯id>-<序號>`，否則建置會報錯）
- `extract-credits.mjs` → 重跑兩次確認 `credits.json` 逐位元組相同（冪等），
  再 `npm run build`；動到繁體化規則時另看 `--names` 的對照表
- `fetch-s2t.mjs` → 重跑覆蓋 `STCharacters.js`，再重跑 `extract-credits.mjs --write`
- 抓取腳本 → 帶 `-Artist` 重跑，確認對應歌手的兩個 json 未被意外改寫
- `serve.mjs` → 重啟預覽伺服器並確認埠號與路徑對應

## 已知坑

- `Set-Content` 預設 CRLF，會讓 `.json` 變成純 CRLF，提交前須統一為 LF
- iTunes 回傳日文新字體（説 / 啓 / 晩 / 涙），由歌手自己的 `meta.mjs` 補清洗規則
- 抓 `gf.css` 後必須把字體路徑由 `../assets/fonts/` 改為 `./`，否則會 404
- 專輯 id 同時是封面檔名，跨歌手必須唯一（慣例：歌手前綴 + 年份）
- **署名不能靠編**：`credits.json` 只裝 sidecar 裡真的寫了的製作人員行。某首歌沒有
  歌詞檔（公開倉庫就是這個狀態）就沒有署名，`song` 的四個署名欄位留空字串，
  介面顯示「未收錄」——這是正確結果，不要為了填滿而推測
- Node 的 `fetch` 不走系統代理，本機抓 OpenCC 字典可能 `ECONNRESET`；
  改走 `fetch-s2t.mjs --from <本機檔案>`，或先用 PowerShell 下載（見檔案開頭用法）
- 從 LRC 抽出的署名前後有雜訊：一個時間戳可能擠著多個角色、英文角色標籤（`Recorded
  by`）、值裡帶錄音室與城市。解析要按角色標記切段、括號內不斷句，並且只收有值的行，
  否則會混進 `词：方文山 作曲：林俊杰` 這種半截值

使用約束見 [AGENTS.md](AGENTS.md)。
