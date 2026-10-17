# 段落驅動的完整驗證方案（3 首代表歌曲）

本檔是**驗證方案與實測結果**，不是完成宣告。
它明確區分三類東西：**本地規則**（確定性運算）、**人工預設**（人的審美決定）、
**AI 擴充**（未啟用）。任何一類都不得描述成另一類。

- 建立日期：2026-10-15
- 環境：本機態（`npm run build:local`）、MCP chromium（頁內 `innerWidth` 自證 1440×901）、
  **主題服務完全關閉**（`http://127.0.0.1:8788` 不可達）、無任何 API 密鑰
- 資料：`storage/segments/` 的 9 份 sidecar（機器產生的時間與能量）

## 一、三首代表歌曲與挑選理由

挑選依據是**實測能量形態**，不是主觀印象。三首覆蓋不同分布：

| 歌 | 歌手／年 | 段數 | 能量 min–max（中位） | calm/normal/chaotic | 為什麼挑它 |
| --- | --- | --- | --- | --- | --- |
| `jay2000-1` 可愛女人 | 周杰倫／2000 | 15 | 0.110–0.551（0.388） | 6/9/0 | 中低能量、**沒有 chaotic**；檢驗「低能量歌不被過度渲染」 |
| `jj2004-1` 第二天堂 | 林俊傑／2004 | 18 | 0.000–0.795（0.635） | 2/13/3 | 跨度最大，含**近無聲開場**與 3 段 chaotic；檢驗動態範圍與章節轉折 |
| `ts2014-4` Out of the Woods | Taylor Swift／2014 | 16 | 0.036–0.713（0.508） | 5/11/0 | 中高能量、**無 chaotic**；檢驗「明亮但不激烈」這條中間路線 |

其餘 6 首 sidecar 歌曲（`chopin2005-10`、`jj2013-2`、`jj2015-11`、`lin1998-11`、
`ts2010-10`、`ts2024-15`）**沒有逐段人工預設**，走安全預設：只有能量驅動的動效強度。
其中 `jj2015-11`（序曲：12年前）20 段全是 instrumental，是「無歌詞、不上舞台」的邊界樣本。

## 二、三類東西的來源與界線

| 類別 | 由誰決定 | 存在哪 | 狀態列的寫法 |
| --- | --- | --- | --- |
| **本地規則** | 專輯封面主色（`album.tint`）的確定性色彩運算 | `js/stage-themes.js` 的 `coverTheme()` | 「主題：本地規則（封面派生）」 |
| **人工預設** | 人挑的 5 個風格主題＋逐曲／逐段指派 | `js/stage-themes.js` 的 `PRESETS`／`SONG_PRESETS`／`SEGMENT_PRESETS` | 「主題：人工預設（懷舊）」／「段落覆寫（人工預設）」 |
| **AI 擴充** | 外部模型（需密鑰） | `tools/theme-service.mjs` | 「主題：真實 AI」；替身寫「測試替身（非真實 AI）」 |

**明確聲明**：本文所有「憂傷／溫暖／懷舊／明亮／激昂」都是**人工依實測能量與發行年代
挑選的風格標籤**，不是模型辨識出的情緒。sidecar 的 `provenance.modelJudgment` 為 `false`，
其附註原文是「段落邊界與能量全部來自音訊測量與歌詞時間；不含模型的情緒判斷」。

## 三、逐段預設的語意：章節制

逐段預設以段落**起始秒**為鍵，語意是**章節**而不是逐段列舉：
某一條從它的 `start` 起生效，直到下一條為止。

- 覆蓋是完整的：沒列到的段落沿用當前章節，不會「退回歌曲預設再跳回來」。
- 變化是稀疏的：18 段只寫 7 處轉折；**模式完全不在段落層出現**，
  所以不會每句歌詞或每段都換一次模式。

容差 0.75 秒（`SEGMENT_TOLERANCE_SEC`）：sidecar 重算後邊界漂移零點幾秒仍算同一章節。

## 四、實測結果（無服務、無密鑰）

### 4.1 可愛女人（章節：懷舊 calm → 溫暖 normal → 懷舊 normal → 溫暖 normal → 懷舊 calm）

| 播放位置 | 段 | 能量 | 主色 | 動效強度 | 背景 |
| --- | --- | --- | --- | --- | --- |
| 70s | 4 | 0.388 | `#d98f56` 溫暖 | normal | common |
| 100s | 6 | 0.413 | `#b9925e` 懷舊 | normal | common |
| 185s | 11 | 0.524 | `#d98f56` 溫暖 | normal | common |
| 232s | 14 | 0.110 | `#b9925e` 懷舊 | calm | common |

### 4.2 第二天堂（章節：憂傷 calm → 溫暖 normal → 明亮 normal → 溫暖 normal → 激昂 chaotic → 激昂 chaotic → 憂傷 calm）

| 播放位置 | 段 | 能量 | 主色 | 動效強度 | 背景 |
| --- | --- | --- | --- | --- | --- |
| 10s | 0 | 0.020 | `#6f8bb5` 憂傷 | calm | common |
| 190s | 12 | 0.678 | `#e05c4a` 激昂 | chaotic | monet |
| 225s | 15 | 0.795 | `#e05c4a` 激昂 | chaotic | nomand |

### 4.3 Out of the Woods（章節：明亮 calm → 明亮 normal → 溫暖 normal → 明亮 normal → 憂傷 calm）

| 播放位置 | 段 | 能量 | 主色 | 動效強度 | 背景 |
| --- | --- | --- | --- | --- | --- |
| 開啟時 | 0 | 0.036 | `#5fc8d0` 明亮 | calm | latent |
| 70s | 5 | 0.713 | `#d98f56` 溫暖 | normal | latent |
| 130s | 8 | 0.683 | `#5fc8d0` 明亮 | normal | latent |
| 232s | 15 | 0.039 | `#6f8bb5` 憂傷 | calm | common |

三首的段落索引、能量、主色、強度、背景都與 sidecar 能量和章節定義**逐項相符**，
0 pageerror。跳轉**不需重播**：拖動進度條後立即得到該段落狀態。

## 五、驗收矩陣（逐項結果）

| 項目 | 可愛女人 | 第二天堂 | Out of the Woods |
| --- | --- | --- | --- |
| 歌詞可見並隨時間推進 | PASS | PASS | PASS |
| 進度跳轉後段落正確 | PASS | PASS | PASS |
| 段落調整動效強度 | PASS | PASS | PASS |
| 段落調整主題（光影／主色） | PASS | PASS | PASS |
| 段落調整背景 | PASS（common） | PASS（monet／nomand） | PASS（latent／common） |
| 手動切換模式 | PASS | PASS | PASS |
| 手動切換主題並鎖定 | PASS | PASS | PASS |
| 鎖定後不被段落覆寫（含背景） | PASS | PASS | PASS |
| 恢復自動回到本地主題與段落規則 | PASS | PASS | PASS |
| 切歌後舞台跟隨 | PASS | PASS | PASS |
| 關閉再打開（資源歸零、狀態重建） | PASS（canvas 2→0） | PASS（canvas 1→0） | PASS |
| 暫停／恢復播放同步 | PASS | PASS | PASS |

平台與降級（第二天堂）：

| 項目 | 結果 |
| --- | --- |
| 桌面 1440×901 | `overflowX 0`、無 <12px、控件 ≥36px；dock 160px |
| 平板 768×1024 | `overflowX 0`、無 <12px；dock 217px |
| 手機 391×845 | `overflowX 0`、無 <12px；dock 346px、宿主 397px |
| 橫屏 845×391 | `overflowX 0`、無 <12px；dock 185px、宿主 95px（既有觀感議題） |
| 無 WebGL | `data-stage-webgl="false"`；`degraded="no-webgl-background-fallback no-webgl"`；歌詞仍可見（199700 字）、無錯誤邊界、0 個 Paper Shaders 錯誤 |
| 無 WebGL + 章節要 GL 背景 | `nomand` 自動收斂為 `common`（能力判斷在啟動前生效） |
| 無 WebGL + 手選 `lumiere` | 替換成 `classic`，`degraded` 追加 `no-webgl-mode-fallback:lumiere`，狀態列寫明 |

## 六、尚未完成／仍受阻

- **真實 AI 主題**：本機無可用密鑰（`/health` 回 `available: false`）。這一條不宣稱通過，
  AI 只作為可選精修，且只有在**真的回了模型結果**時才覆蓋本地主題。
- **其餘 6 首 sidecar 歌曲**沒有逐段人工預設：走安全預設（只有能量驅動強度）。
- **另外 1095 首沒有 sidecar 的曲目**：完全沒有段落資料，只套歌曲／封面主題。
- **全量段落分析**要跑 `node tools/analyze-audio.mjs --all`（1098 首，很久）。
- **逐曲情緒標籤沒有來源**：不編造。本文的風格標籤只覆蓋上表 3 首。
- 人工預設的**觀感**（哪首歌適合哪個主題）屬審美判斷，最終由維護者確認。
