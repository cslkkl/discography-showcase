# Task 04 兩層分析工具：實測證據

- 任務：`task-3`「兩層分析工具：AI 整曲主題服務與完整音檔段落預分析」
- 日期：2026-10-15（Asia/Shanghai）
- 環境：Windows、Node v24.15.0、npm 11.12.1；本機**沒有** ffmpeg／ffprobe；
  Playwright chromium（`chromium-1248`，44.1 kHz stereo FLAC/MP3 解碼可用）
- 指令：`node --test "tools/test/*.test.mjs"`、`node tools/analyze-audio.mjs`、
  `node tools/theme-service.mjs` + `node tools/verify-real-song.mjs`
- 本文只寫**真的跑過**的結果。凡是推論、估算或未執行的一律標明。

## 一、結論摘要

| 項目 | 狀態 |
| --- | --- |
| 整曲主題服務（端點／校驗／分段／匯總／快取／降級／脫敏） | 完成，測試覆蓋 |
| 完整音檔段落預分析（8 首真實全曲） | 完成，8/8 時間軸合法 |
| 純函式測試（schema／分段匯總／邊界偵測／時間軸／降級） | 85 項全通過 |
| **真實 AI 貫通** | **未達成——本機沒有可用密鑰**（見 §6，含實際觀察到的 401） |
| 測試替身貫通整條鏈路 | 完成，且輸出明確標為 `test-double-not-real-ai` |
| 段落時間與播放進度一致（跨段落拖動） | 完成，逐點對帳 |

## 二、樣本（6 類，共 8 首真實全曲）

挑選依據是歌詞的客觀量（平均句長、拉丁字母比例）與是否有歌詞登記。
所有樣本都是**本機完整音檔**，不是 30 秒試聽。

| # | 樣本類型 | songId | 歌手／專輯／年份（公開中繼資料） | 容器 | 曲長 s | 段落 | 歌詞行／字 | 平均句長 | 區塊 | 最大重複 | 重複信心 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 安靜抒情 | `lin1998-11` 冬 | 林志炫／蒙娜麗莎的眼淚／1998 | flac | 234.306 | 14 | 56／317 | 5.7 | 5 | 12 | 1.00 |
| 2 | 強節奏 | `ts2010-10` Better Than Revenge | Taylor Swift／Speak Now／2010 | flac | 217.160 | 13 | 57／2481 | 43.5 | 5 | 3 | 0.75 |
| 3 | 中英歌詞 | `jj2004-1` 第二天堂 | 林俊傑／第二天堂(江南)／2004 | flac | 266.000 | 18 | 67／920 | 13.7 | 7 | 4 | 0.95 |
| 3 | 中英歌詞（另一首） | `ts2024-15` The Alchemy | Taylor Swift／TTPD／2024 | flac | 196.900 | 14 | 43／1800 | 41.9 | 5 | 5 | 1.00 |
| 4 | 長句 | `ts2014-4` Out of the Woods | Taylor Swift／1989／2014 | flac | 235.800 | 16 | 217／3458 | 15.9 | 6 | 24 | 1.00 |
| 5 | 快速短句 | `jj2013-2` 零度的親吻 | 林俊傑／因你 而在／2013 | flac | 229.784 | 15 | 46／247 | 5.4 | 5 | 4 | 0.95 |
| 5 | 快速短句（另一首） | `chopin2005-10` 珊瑚海 | 周杰倫／11月的蕭邦／2005 | flac | 255.466 | 13 | 67／414 | 6.2 | 6 | 4 | 0.95 |
| 6 | 純音樂 | `jj2015-11` 序曲:12年前 | 林俊傑／和自己對話／2015 | mp3 | 367.133 | 20 | 0／0 | — | 0 | — | — |

音檔與歌詞全文都不會出現在本文件、日誌或產物裡；上表只有公開中繼資料與量測數字。

### 量測結果（同一批樣本）

| songId | rmsMean | 動態範圍 dB | 起音數 | 起音率 /s | 靜音比 | 段落最短／中位 s | 能量階段 | 段落種類分佈 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| chopin2005-10 | 0.220 | 14.7 | 305 | 1.19 | 13% | 10.7／16.4 | 1 low→4 mid→8 high | neutral×6, chorus×6, outro×1 |
| jj2004-1 | 0.199 | 14.2 | 391 | 1.47 | 12% | 9.6／13.7 | low→mid→high→mid→high | neutral×6, chorus×8, instrumental×4 |
| jj2013-2 | 0.173 | 17.4 | 252 | 1.10 | 11% | 9.1／15.9 | low→mid→high→mid | neutral×12, chorus×2, outro×1 |
| jj2015-11 | 0.071 | 9.6 | 553 | 1.51 | 12% | 9.3／16.7 | 全曲低能量為主 | instrumental×20 |
| lin1998-11 | 0.112 | 7.9 | 275 | 1.17 | 13% | 7.4／15.9 | low→mid→high | neutral×5, chorus×8, outro×1 |
| ts2010-10 | 0.288 | 5.5 | 284 | 1.31 | 19% | 11.2／14.1 | 高能量為主 | neutral×9, chorus×4 |
| ts2014-4 | 0.229 | 10.6 | 324 | 1.37 | 14% | 7.2／13.1 | low→mid→high→mid→high | neutral×8, chorus×8 |
| ts2024-15 | 0.219 | 15.4 | 259 | 1.32 | 14% | 9.1／12.0 | low→mid→high | neutral×6, chorus×7, instrumental×1 |

**觀察（測量，不是情緒判斷）**：安靜抒情的 `lin1998-11` 動態範圍只有 7.9 dB，
而〈珊瑚海〉有 14.7 dB；純音樂序曲的 `rmsMean` 0.071 是全批最低。
音量高低與段落是否被標成副歌**沒有**直接關係——副歌標籤只來自重複結構，不來自音量。
這正是 §8「音量高不等於快樂」要求的處理方式。

### 每項輸出的來源分開標註

- **音訊測量**：`measurement` 全部欄位、`boundaryCandidates`、每個段落的 `energy`／`measured.rms`。
- **歌詞時間推斷**：每個段落的 `sources` 含 `lyrics-time`；`intro`／`outro`／`instrumental`
  的分類完全由歌詞時間決定（沒有歌詞行的段落才是器樂段）。
- **歌詞重複結構**：`repeatStructure`；只有它會讓 `kind` 變成 `chorus`。
- **模型判斷**：`theme.mood`／`rationale`／情境判斷。**在段落 sidecar 裡 `modelJudgment: false`**，
  因為這條流程完全不呼叫模型；段落裡的 `mood` 一律是空字串。

## 三、真實音檔段落的合法性與一致性

驗證指令：`node --test "tools/test/*.test.mjs"`（含 `sidecar.test.mjs`，直接讀 8 份真實產物）

| 檢查 | 結果 |
| --- | --- |
| 每個段落過 §2.5 schema（含不越曲長） | 8/8 檔全部通過，0 錯誤 |
| 時間遞增、首尾相接、第一段從 0、最後一段等於曲長 | 8/8 通過 |
| 最短段落 ≥ 7.2s、中位 12.0–16.7s | 全部 > 4s 下限，無負時長、無可解釋性差的重疊 |
| 跨段落拖動立即得到正確狀態 | 每首以 ≤0.06s 網格取 4000+ 個時間點，`resolveSegmentAt` 與線性掃描**逐點一致**；每個內部邊界前後 1ms 落在不同段落 |
| sidecar 不含音檔路徑、Windows 絕對路徑、家目錄路徑 | 8/8 clean |
| sidecar 不含歌詞全文 | 逐行比對 5 首有歌詞樣本的全部歌詞行，0 命中 |

「拖到哪裡就得到哪裡」的做法是把查詢寫成純函式（二元搜尋，不看歷史、不看上一帧）。
測試不是抽樣對答案，是對整首的細網格逐點比對，所以 seek 後立刻取狀態與循序播放是一致的。

## 四、純函式測試結果

```
node --test "tools/test/*.test.mjs"
ℹ tests 85
ℹ pass 85
ℹ fail 0
```

開發過程中這些測試抓到的**真實缺陷**（都已修掉，並留下回歸測試）：

1. **封面降級主題缺 `secondary` 欄位** → 整份降級主題被 schema 拒絕、回 null，
   降級路徑等於沒有降級。現在五個顏色欄位都會補齊並過對比度。
2. **分段覆蓋率把換行也算進字元數** → `coveredCharCount > charCount`，覆蓋判定失真。
   現在 `chars`（送模型的負載長度）與 `sourceChars`（歌詞本身字元數）分開記。
3. **重複結構把「唱兩遍的主歌」也算成副歌** → 拆成 `repeatedKeys`（≥2 次）與
   `chorusKeys`（次數等於最大值），只有後者能標 chorus。
4. **`groupLyricRegions` 的運算子優先序**：`line.end ?? line.time - current.start`
   少了括號，`span` 變成絕對時間，於是 67 行的歌被切成 63 個區塊。
5. **`computeCoverage` 把 `windows-path` 排除在禁用樣式之外** → 模型可以輸出
   `C:\Users\...` 而不被擋。已改為一律拒絕。
6. **候選邊界的三路訊號不在同一個標尺上**：spectral flux 的原始數值取決於 FFT 大小與振幅，
   直接跟寫死的 0.5（靜音交界）比大小等於讓單位決定勝負。現在換算到 0..1 的相對突出度，
   頻譜突變 > 靜音交界 > 20 秒網格的能量階段交界。
7. **單邊移動平均把峰值整體往後推半個窗** → 邊界時間跟著偏掉。改成置中移動平均（前綴和）。
8. **毫秒四捨五入讓段落越過曲長**：真實曲長 255.46693877551022，
   四捨五入成 255.467 就多 0.06 毫秒。現在對外時間軸取毫秒**下界**，段落也夾在同一條界線內。
9. **`cacheFileStem` 可能留下 `..`**：`../../etc/passwd` 清掉分隔符後仍是 `.._.._etc_passwd`，
   檔名不該保有路徑語意。
10. **CJS interop**：`import('playwright')` 的 `chromium` 落在 `.default` 上，
    只檢查 `loaded.chromium` 會誤判成「找不到 Playwright」。

## 五、測試替身貫通（**不是真實 AI**）

`THEME_PROVIDER=stub` 是明確指定的測試替身，輸出帶 `model: 'test-double'` 與
`note: 'test-double-not-real-ai:…'`。它只用來證明鏈路完整。

### 5.1 單段（`jj2004-1` 第二天堂，真有歌詞）

| 步驟 | 結果 |
| --- | --- |
| 第一次 `POST /theme` | `status: generated`，`chunkCount: 1`，`mergeMode: model-synthesis`（逐段分析＋第二次匯總呼叫都跑了） |
| 送出範圍 | 歌詞 1948 字元／81 行 → 切段後覆蓋 66 行／901 字元（`inputChars` 901、`coveredCharCount` 901、`coverage.complete: true`） |
| 指紋 | `fp1-6dc26f4e7dada6a3fb73de5f92ff822d` |
| 快取檔 | `jj2004-1.fp1-6dc26f4e7dada6a3fb73de5f92ff822d.json` |
| 第二次同輸入 | `status: cache-hit`，`provenance.source: cache`，`note: cache-hit:原來源=ai`，指紋相同 |
| `force: true` | `status: generated`（重新產生） |
| 來源標註 | `moodSources: { lyricInference: true, audioMeasurement: false, modelJudgment: 'test-double' }` |

註：1948 字元是整個 `.lrc` 檔（含時間戳與製作人員行），切段後實際進模型的歌詞是 901 字元／66 行，
差的 15 行是標題頭行、製作人員行與對唱標記，被解析器濾掉。

### 5.2 多段覆蓋（`ts2014-4` Out of the Woods，長歌詞）

| 項目 | 值 |
| --- | --- |
| 送出的歌詞 | 6554 字元／228 行 |
| 切段後 | **4 段**：`[0,73]`、`[74,141]`、`[142,213]`、`[214,215]`；負載 1200／1194／1198／30 字元 |
| 覆蓋 | `lineCount 216`、`coveredLineCount 216`、`charCount 3410`、`coveredCharCount 3410`、`complete: true` |
| 匯總 | `mergeMode: model-synthesis`，兩次模型呼叫都成功 |
| 指紋 | `fp1-4f49d53898b26c08f5aaf2e2cfd238dd` |

這是對上游 `slice(0, 2000)` 的直接對照：**這首歌 6554 字元，2000 字元只涵蓋前三成**，
在本服務裡是 4 段全覆蓋 + 一次匯總。

### 5.3 快取清單（`GET /theme-cache`）

```json
{ "count": 2, "items": [
  { "file": "jj2004-1.fp1-6dc26f4e7dada6a3fb73de5f92ff822d.json", "songId": "jj2004-1",
    "fingerprint": "fp1-6dc26f4e7dada6a3fb73de5f92ff822d", "source": "ai",
    "model": "test-double", "chunkCount": 1 },
  { "file": "ts2014-4.fp1-4f49d53898b26c08f5aaf2e2cfd238dd.json", "songId": "ts2014-4",
    "fingerprint": "fp1-4f49d53898b26c08f5aaf2e2cfd238dd", "source": "ai",
    "model": "test-double", "chunkCount": 4 } ] }
```

清單裡沒有歌詞內容；`POST /theme-cache/clear {"all": true}` 回 `{"removed": 2, "scope": "all"}`。
（清單中 `model: "test-double"` 本身就是在提醒這些不是真實 AI 結果。）

**測試替身的結果不會污染真實 AI 的快取**：指紋的組成包含 `provider` 與 `model`，
替身是 `stub`／`test-double`，真實供應器是 `openai`／`deepseek-v4-flash`，
兩者必然算出不同指紋。這不是推理而是實測——同一首 `jj2004-1` 同樣的歌詞，
在替身下的指紋是 `fp1-6dc26f4e7dada6a3fb73de5f92ff822d`，
在指向 8317 的真實供應器下是 `fp1-3b1d09615b72884f06dfa72920da40c6`。
所以就算留著替身產生的快取，之後接上真密鑰也只會重新分析，不會吃到替身的結果。

## 六、真實 AI 驗證：**未達成，缺什麼寫在這裡**

### 6.1 實際做了什麼

1. 設定供應器指向本機 OpenAI 相容端點並送出一首真實完整歌詞的請求：

   ```
   THEME_PROVIDER=openai
   OPENAI_API_URL=http://127.0.0.1:8317
   OPENAI_API_MODEL=deepseek-v4-flash
   OPENAI_API_KEY=<探針用佔位字串，不是真密鑰>
   ```

   `GET /health` 回 `kind: openai`、`available: true`、`endpoint: http://127.0.0.1:8317/v1/chat/completions`。

2. `POST /theme`（`jj2004-1`，`force: true`）的實際結果：

   ```json
   { "status": "degraded", "reason": "partial-coverage-rejected",
     "detail": "只有 0/1 段分析成功，拒絕回傳不完整的整曲分析。",
     "chunkErrors": [{ "chunk": 0, "error": "openai-http-401:{\"error\":\"Invalid API key\"}" }],
     "theme.provenance.source": "cover" }
   ```

   耗時 32 ms——是立刻回 401，不是逾時或網路不可達。

3. 直接對 `http://127.0.0.1:8317` 探測：

   - `GET /v1/models` → `401 {"error":"Missing API key"}`
   - `POST /v1/chat/completions`（不帶 key）→ `401`

4. 專案自己的 `folia-major/.env.local`：

   ```
   VITE_AI_PROVIDER = google
   GEMINI_API_KEY   = <空>
   OPENAI_API_KEY   = <空>
   OPENAI_API_URL   = https://api.deepseek.com
   OPENAI_API_MODEL = deepseek-v4-flash
   ```

   **兩個密鑰都是空字串**，沒有指向本機 8317。

5. 依指示**沒有**去翻使用者機器上的其他憑據檔。

### 6.2 因此還缺什麼（要讓真實 AI 貫通，只需要其中一項）

| 選項 | 需要什麼 |
| --- | --- |
| A（最直接） | 給 `OPENAI_API_KEY` 一個本機 CLI Proxy API 認得的密鑰，並設 `OPENAI_API_URL=http://127.0.0.1:8317`、`OPENAI_API_MODEL=deepseek-v4-flash` |
| B | 給 `GEMINI_API_KEY` 一個有效的 Google 密鑰（並設 `THEME_PROVIDER=gemini`） |
| C | 任何 OpenAI 相容端點的 base URL ＋ 密鑰 ＋ 模型名 |

設定好之後，同一條指令即可完成驗證並取得真實結果：

```powershell
$env:OPENAI_API_KEY='…'; $env:OPENAI_API_URL='http://127.0.0.1:8317'
$env:OPENAI_API_MODEL='deepseek-v4-flash'
node tools/theme-service.mjs
node tools/verify-real-song.mjs jj2004-1 --force
```

**未經驗證的期待（明確標為未驗證）**：目前只有測試替身的輸出證明瞭 schema 校驗、
覆蓋保證、快取與降級都通；**真實模型輸出的顏色／模式分佈是否穩定、是否需要調整提示詞，
一次都沒有測過**。這也是本任務唯一沒有達成的驗收項。

### 6.3 降級路徑（無密鑰）實際觀察

`kind: none`、`available: false`、
`configReason: "OPENAI_API_KEY 是空的（專案 .env.local 的 GEMINI_API_KEY / OPENAI_API_KEY 都是空字串）"`，
`POST /theme` 回 `status: degraded`、`reason: provider-unavailable`、
`theme.provenance.source: "cover"`、`note: "seed-derived-placeholder"`，
回應仍是 200 且主題五個顏色欄位齊備、正文對比度 ≥4.5:1。舞台在這種狀態下仍可用。

## 七、隱私與脫敏（實際掃描，不是宣稱）

| 掃描對象 | 內容 | 結果 |
| --- | --- | --- |
| 服務回應／`verify-real-song` 報告 | 佔位密鑰字串、`sk-` 樣式、`C:\Users\...`、使用者名稱 | 5/5 clean |
| `storage/theme-cache/*.json` | 密鑰、使用者名稱、供應器錯誤原文 | 2/2 clean |
| `storage/segments/*.json` | `assets`、使用者名稱、Windows 絕對路徑、`.lrc` | 8/8 clean |
| 服務日誌 | 實際輸出中 `C:\Users\…` 被換成 `<redacted:windows-home>` | 已觀察到 |

另外有測試直接斷言：

- `/health` 與 `/theme` 的回應**不含** `OPENAI_API_KEY` 的值（用假密鑰驗證）；
- logger 輸出不含金鑰與家目錄路徑；
- 快取清單不含歌詞內容；
- 段落 sidecar 不含任何歌詞行的全文（逐行比對該首歌詞檔）。

**送出範圍**：只有歌詞文字（或純音樂的曲名）＋ 公開中繼資料（歌手／專輯／年份／曲名）。
**沒有**上傳音檔、**沒有**送出任何本機路徑或檔名。音訊只以量測摘要的形式（rms／動態範圍／
起音率／靜音比）進提示詞，測試另有一段斷言情緒欄位塞不進這個摘要。

## 八、未完成項與已知限制

1. **真實 AI 貫通未完成**（見 §6）——唯一未達成的驗收項，原因是缺密鑰而非程式缺陷。
2. **只分析了 8 首**：本檔寫作時 `storage/segments/` 有 8 份 sidecar
   （其後新增 `jay2000-1`，現為 9 份，見 [升級進度表](../upgrade-progress.md) 與
   [段落驗證方案](segment-verification-plan.md)）。全庫 1098 首可跑
   （`--all`），以實測 0.8–4.3 秒／首估算，全量約需 20–80 分鐘，本次未執行。
   因此「段落品質在多樣曲風上的普遍性」只有這 8 首的證據。
3. **段落種類的準確率沒有 ground truth**：`chorus` 的判準是「重複結構可信且該段多數行是
   最高頻重複行」，這是啟發式。8 首裡 `chorus` 佔 2–8 段，看起來合理，但**沒有**與人工標註
   對照過，不能宣稱準確率。
4. **沒有任何真實 AI 輸出被 schema 拒絕或修復過**：`contrast-repaired:*` 這條路徑
   只有合成輸入的單元測試，沒有真實模型樣本。
5. **`storage/` 不在 `.gitignore` 裡**：目前內容不含密鑰、歌詞全文、音檔或私有路徑
   （已掃描），所以入庫不會洩漏；但它是本機衍生資料，是否要 ignore 由維護者決定。
   本任務的寫入範圍不含 `.gitignore`，未擅自修改。
6. **Chromium 版本靠執行檔路徑指定**：本機 Playwright 期待 chromium-1243，
   實際裝的是 1248，工具以 `executablePath` 繞過。Playwright 升級後這個落差可能改變。
7. **降採樣是盒狀濾波**：11 kHz 以上會折疊進來。對包絡與頻譜流量足夠，但**不適合**
   做音高或和聲分析。日後若要更細的音樂分析，這條路要換。
8. **首次分析會寫快取**：`POST /theme` 成功時一定寫 `storage/theme-cache/`。
   降級路徑（`source: cover`）刻意**不寫** AI 快取，避免把降級結果當成 AI 結果快取起來
   （有測試斷言降級後快取仍是空的）。
9. **未跑**：`npm run check:docs`／`check:eol`（文件連結與換行檢查由維護者統一跑）；
   本文件與 `tools/README.md` 的換行與連結未經該兩個腳本驗證。
10. **`eslint.config.js` 加了一個 `tools/**/*.mjs` 區塊**（Node + browser 全域）。
    這是本任務唯一的倉庫根設定改動，屬加法、未動既有規則；若維護者不希望根設定被改，
    替代做法是在每個檔案頂端加 `/* global … */` 註解。
