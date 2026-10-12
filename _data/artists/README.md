# artists/ — 歌手資料夾

每位歌手一個資料夾，資料夾名即歌手 id（小寫短橫線，如 `jay-chou`）。

## 一個歌手資料夾的構成

```
artists/<id>/
├── albums-raw.json   # 事實：發行日、曲目、時長、封面鍵、試聽網址
├── colors.json       # 事實：各封面平均色（由 extract-colors.ps1 生成）
└── meta.mjs          # 唯一手寫層：身份、專輯標題與介紹、代表曲、年代分期
```

`meta.mjs` 導出的 `id` 必須與資料夾同名，`build.mjs` 會校驗。

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
   `heroTitle`（歌手頁主視覺題名，逐字展開）。
   顏色建議從這位歌手的封面主色或應援色取，取完檢查與 `accentOn` 的對比
5. 試聽：`fetch-previews.ps1 -Artist <id>`
6. `npm run build`，然後打開入口頁確認新歌手出現在清單

## 規則

- 步驟 1 與 4 是唯一需要人的判斷的地方：事實要可查證，介紹要自己寫
- `eras` 的 note 不允許引入事實以外的情節；拿不準就少寫
- `heroFan` 不填則由構建自動按發行序均勻取樣五張
- 歌手資料夾內不再建雙件：本目錄的 README 是新增步驟的唯一 home，
  各資料夾由 `meta.mjs` 自描述

規則層見 [../AGENTS.md](../AGENTS.md)。
