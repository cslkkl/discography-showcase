# artists/ — 歌手資料夾

每位歌手一個資料夾，資料夾名即歌手 id（小寫短橫線，如 `jay-chou`）。

## 一個歌手資料夾的構成

```
artists/<id>/
├── albums-raw.json   # 事實：發行日、曲目、時長、封面鍵、試聽網址
├── colors.json       # 事實：各封面平均色（由 extract-colors.ps1 生成）
├── credits.json      # 事實：逐曲署名（由 extract-credits.mjs 從歌詞 sidecar 生成，可缺）
└── meta.mjs          # 唯一手寫層：身份、專輯標題與介紹、代表曲、年代分期、逐曲文案
```

`meta.mjs` 導出的 `id` 必須與資料夾同名，`build.mjs` 會校驗。
`credits.json` 是最年輕的一份：沒有歌詞 sidecar 的歌手（或還沒有歌詞的新歌手）
就是沒有這個檔，`build.mjs` 讀不到時署名整批留空，不是錯誤。

## 新增一位歌手的步驟

1. `_data/artists/<id>/albums-raw.json`：抓目錄事實。
   先列候選：`node _data/fetch-artist.mjs --list --itunes-id <歌手id> --country tw`
   再抓取（含封面下載與試聽網址）：
   `node _data/fetch-artist.mjs --fetch --itunes-id <歌手id> --artist <id> --keys "<collectionId=鍵, ...>"`
   歌手 id 可用 `search?term=<名>&entity=musicArtist` 查詢。
   只挑錄音室專輯：排除單曲、EP、現場、卡拉OK版與精選混音；拿不準的先看曲目再決定
2. 封面：1200px 原圖由抓取腳本自動下載到 `assets/covers/<專輯id>.jpg`，跑
   `make-responsive-covers.ps1` 產生 480 / 960 兩檔（掃整個目錄，補齊缺失的）。
   專輯 id 全局唯一，慣例為「歌手前綴 + 年份」，同年撞車加 a/b 後綴
3. `_data/artists/<id>/colors.json`：跑
   `extract-colors.ps1 -Artist <id>`
4. `_data/artists/<id>/meta.mjs`：手寫編輯層。必填欄位見
   `jay-chou/meta.mjs` 的欄位形狀（id / name / en / seal / tagline / taglineEn /
   intro / kanjiFix / phraseFix / collabFix / heroFan / eras / albums / theme）。
   其中 `theme` 定義這位歌手的視覺人格：`accent`（唯一強調色）、
   `accentOn`（印在強調色底上的文字色，須與 accent 對比充足）、
   `motif`（指向 css/motifs.css 裡的一組專屬裝飾）、
   `heroTitle`（歌手頁主視覺題名，逐字展開；用歌手本名，不自創名號）。
   名字一律用通行譯名，拉丁歌手直接用其英文名，不得自創。
   顏色建議從這位歌手的封面主色或應援色取，取完檢查與 `accentOn` 的對比。
   選填的 `songs` 是逐曲文案（`description` 歌曲介紹／`story` 創作背景，
   也可覆寫四個署名）：鍵是 `<專輯id>-<序號>`，打錯鍵建置會直接報錯；
   沒寫的歌就沒有這幾段，介面不留空殼。**不得為曲目虛構創作資料**，
   拿不準就留空
5. 試聽：`fetch-previews.ps1 -Artist <id>`
6. 署名（有歌詞 sidecar 時）：先把音檔與歌詞落盤（步驟 7），再
   `node _data/extract-credits.mjs --artist <id> --write`。署名是事實，
   來自 sidecar `.lrc` 的製作人員行；重跑冪等，沒有 sidecar 時不做事
7. `npm run build`，然後打開入口頁確認新歌手出現在清單
8. 有自有音檔時，把來源目錄對齊落盤（見 [_data/README.md](../README.md) 的
   `place-media.mjs`）：`node _data/place-media.mjs --artist <id> --from <來源目錄> --write`，
   再接 `node _data/local-audio.mjs --write` 登記（它同時登記 sidecar 歌詞），
   最後 `npm run build:local`。歌詞放在音檔同目錄同名 `.lrc` 即可一起被登記。
   本機態的每首歌會多一個 `song.lyrics = { source, format }` 描述子

## 規則

- 步驟 1 與 4 是唯一需要人的判斷的地方：事實要可查證，介紹要自己寫
- `eras` 的 note 不允許引入事實以外的情節；拿不準就少寫
- `meta.mjs` 的 `songs` 只寫查得到的東西（專輯說明、發行資訊、訪談或官方文案）；
  **署名一律走 `credits.json`**（那是 sidecar 裡明明白白寫著的），不要在 `songs`
  裡憑印象補詞曲作者
- `heroFan` 不填則由構建自動按發行序均勻取樣五張
- 歌手資料夾內不再建雙件：本目錄的 README 是新增步驟的唯一 home，
  各資料夾由 `meta.mjs` 自描述

規則層見 [../AGENTS.md](../AGENTS.md)。
