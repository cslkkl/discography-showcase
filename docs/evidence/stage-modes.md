# Task 04 舞台：14 模式真實渲染實測

產生時間：2026-10-15T05:47:34.658Z
視口：1440×900（獨立 `chromium.launch()`，deviceScaleFactor 1）
harness：`http://127.0.0.1:55508/dev/harness.html`（載入**建置產物** `stage/dist/lyric-stage.js`，非 dev server）

## 一、14 模式（WebGL 正常）

| 模式 | 狀態 | 非背景像素占比 | 顏色種類 | 平均亮度 | 600ms 變化 | canvas | 節點 | 文字字數 | 錯誤 | 降級標記 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `classic` | PASS | 1 | 218 | 97.71 | 0.9335 | 2（1214x759、1214x759） | 12 | 0 | 0 |  |
| `monet` | PASS | 1 | 199 | 98.03 | 0.9298 | 3（1214x759、1214x759、300x150） | 189 | 106 | 0 |  |
| `cadenza` | PASS | 1 | 338 | 99.96 | 0.8947 | 3（1214x759、1214x759、1440x900） | 81 | 70 | 0 |  |
| `partita` | PASS | 1 | 348 | 97.15 | 0.9999 | 2（1214x759、1214x759） | 78 | 35 | 0 |  |
| `fume` | PASS | 1 | 289 | 24.24 | 0.2351 | 0 | 25 | 34 | 0 |  |
| `claddagh` | PASS | 1 | 94 | 15.18 | 0.0458 | 0 | 114 | 82 | 0 |  |
| `cappella` | PASS | 1 | 806 | 25.13 | 0.024 | 0 | 131 | 680 | 0 |  |
| `tilt` | PASS | 1 | 194 | 17.82 | 0.0369 | 0 | 80 | 52 | 0 |  |
| `diorama` | PASS | 1 | 602 | 22.83 | 0.1532 | 1（1440x900） | 53 | 20 | 0 |  |
| `pendolo` | PASS | 1 | 277 | 19.45 | 0.0099 | 2（640x900、300x150） | 162 | 192 | 0 |  |
| `sonnet` | PASS | 1 | 1051 | 27.39 | 0.1146 | 1（1638x1024） | 51 | 18 | 0 |  |
| `tempera` | PASS | 1 | 124 | 45.68 | 0.6354 | 1（1638x1024） | 51 | 42 | 0 |  |
| `lumiere` | PASS | 1 | 251 | 35.81 | 0.8428 | 2（1214x759、1214x759） | 17 | 34 | 0 |  |
| `still` | PASS | 1 | 73 | 6.75 | 0 | 0 | 8 | 16 | 0 |  |

## 二、14 模式（偽裝 WebGL 不可用）

| 模式 | 狀態 | 非背景像素占比 | 顏色種類 | 平均亮度 | 600ms 變化 | canvas | 節點 | 文字字數 | 錯誤 | 降級標記 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `classic` | PASS | 1 | 33 | 14.86 | 0.0059 | 0 | 45 | 0 | 0 | no-webgl-background-fallback no-webgl |
| `monet` | PASS | 1 | 118 | 17.95 | 0.2183 | 1（338x40） | 191 | 92 | 0 | no-webgl-background-fallback no-webgl |
| `cadenza` | PASS | 1 | 236 | 18.97 | 0.0866 | 1（1440x900） | 72 | 63 | 0 | no-webgl-background-fallback no-webgl |
| `partita` | PASS | 1 | 267 | 18.16 | 0.0665 | 0 | 115 | 73 | 0 | no-webgl-background-fallback no-webgl |
| `fume` | PASS | 1 | 98 | 18.09 | 0.1867 | 0 | 25 | 49 | 0 | no-webgl-background-fallback no-webgl |
| `claddagh` | PASS | 1 | 174 | 16.9 | 0.041 | 0 | 129 | 91 | 0 | no-webgl-background-fallback no-webgl |
| `cappella` | PASS | 1 | 522 | 22.38 | 0.0411 | 0 | 124 | 624 | 0 | no-webgl-background-fallback no-webgl |
| `tilt` | PASS | 1 | 105 | 18.47 | 0.0395 | 0 | 57 | 29 | 0 | no-webgl-background-fallback no-webgl |
| `diorama` | 受限 | 1 | 182 | 9.77 | 0 | 0 | 4 | 117 | 2 | no-webgl-background-fallback no-webgl renderer-error |
| `pendolo` | 受限 | 1 | 220 | 18.59 | 0.0566 | 2（300x150、640x900） | 141 | 175 | 2 | no-webgl-background-fallback no-webgl renderer-error |
| `sonnet` | PASS | 1 | 959 | 62.81 | 0.4573 | 1（1638x1024） | 51 | 13 | 0 | no-webgl-background-fallback no-webgl renderer-error |
| `tempera` | PASS | 1 | 231 | 66.49 | 0.9336 | 1（1638x1024） | 51 | 34 | 0 | no-webgl-background-fallback no-webgl renderer-error |
| `lumiere` | 受限 | 1 | 113 | 16.31 | 0.0021 | 0 | 51 | 47 | 1 | no-webgl-background-fallback no-webgl renderer-error |
| `still` | 受限 | 1 | 55 | 7.98 | 0 | 0 | 9 | 47 | 1 | no-webgl-background-fallback no-webgl renderer-error |

## 三、6 種背景（WebGL 正常）

| 背景 | 顏色種類 | 平均亮度 | 600ms 變化 | 錯誤 |
| --- | --- | --- | --- | --- |
| `common` | 31 | 15.02 | 0.0032 | 0 |
| `latent` | 215 | 96.9 | 0.9474 | 0 |
| `monet` | 312 | 29.94 | 0.1069 | 0 |
| `nomand` | 281 | 21.91 | 0.077 | 0 |
| `sora` | 365 | 7.86 | 0.0878 | 0 |
| `url` | 193 | 12.96 | 0.0979 | 0 |

## 四、6 種背景（偽裝 WebGL 不可用）

| 請求的背景 | 實際生效 | 顏色種類 | 平均亮度 | 錯誤 |
| --- | --- | --- | --- | --- |
| `common` | `common` | 33 | 15 | 0 |
| `latent` | `common`（能力偵測換掉） | 171 | 16.96 | 0 |
| `monet` | `monet` | 229 | 25.47 | 0 |
| `nomand` | `common`（能力偵測換掉） | 251 | 19.29 | 0 |
| `sora` | `common`（能力偵測換掉） | 333 | 21.76 | 0 |
| `url` | `url` | 260 | 12.56 | 0 |

## 五、播放控制

```json
{
  "afterSeek": {
    "activeMode": "classic",
    "lineIndex": 10,
    "nodeCount": 94,
    "canvasCount": 0,
    "canvasSizes": [],
    "textLength": 40,
    "textSample": "我我把把它它抄抄在在最最小小的的那那一一圈圈如果年輪是一種語言那沉默就是它的母音",
    "background": "common",
    "webgl": "true",
    "degraded": null,
    "boundaryFallback": false
  },
  "modeAfterSeek": {
    "activeMode": "claddagh",
    "lineIndex": 10,
    "nodeCount": 98,
    "canvasCount": 0,
    "canvasSizes": [],
    "textLength": 60,
    "textSample": "而你在副歌裡把名字還給了我我把它抄在最小的那一圈如果年輪是一種語言那沉默就是它的母音如果年輪是一種語言那沉默就是它的母音",
    "background": "common",
    "webgl": "true",
    "degraded": null,
    "boundaryFallback": false
  },
  "beforeExit": {
    "currentTime": 40,
    "paused": true
  },
  "afterExit": {
    "mounted": false,
    "stageChildren": 0,
    "currentTime": 40,
    "paused": true
  },
  "errors": []
}
```

## 六、各模式 chunk（實際抓下來的）

| chunk | bytes |
| --- | --- |
| `VisualizerCappella-CRTWJZwN.js` | 4892540 |
| `VisualizerDiorama-B1qRc9Ji.js` | 1189601 |
| `useStatusMessageStore-BAuwzGkk.js` | 1042122 |
| `lib-fQJRlB-M.js` | 747476 |
| `createSonnetPixiRuntime-Czm2CHp4.js` | 466235 |
| `registry-C1tfNFE5.js` | 452196 |
| `lyric-stage.css` | 199560 |
| `registry-BinYqNO1.js` | 165574 |
| `temperaLayerImages-DkjtqOvR.js` | 142223 |
| `createTemperaPixiRuntime-DJTCKqLS.js` | 131247 |
| `dynamicIconImports-Xfpl2KkM.js` | 129249 |
| `createLumierePixiRuntime-DO7U5foN.js` | 124490 |
| `VisualizerLumiere-CUGH_C6E.js` | 120063 |
| `parserCore-CoL3BQRn.js` | 118609 |
| `GraphicsContext-DQMOwjr0.js` | 86563 |
| `RenderTargetSystem-DLqhzzj4.js` | 73469 |
| `layout-DVmInfB7.js` | 64719 |
| `VisualizerPendolo-Cb7hXo_B.js` | 59210 |
| `Shader-B6XXgdCM.js` | 57843 |
| `VisualizerFume-C17rNK4A.js` | 56749 |
| `CanvasSource-yX4o4rBB.js` | 49078 |
| `VisualizerMonet-B73iDUho.js` | 45242 |
| `VividLightBlend-BMzkF5yn.js` | 45063 |
| `VisualizerTempera-Dl_Rk5Qo.js` | 41896 |
| `Geometry-DwtG_VzJ.js` | 35927 |
| `VisualizerCladdagh-BEsZBllK.js` | 34979 |
| `VisualizerCadenza-1SLoYYvr.js` | 27401 |
| `GCManagedHash-Bq5fnDgx.js` | 25502 |
| `VisualizerTilt-eWblcu0Q.js` | 21385 |
| `VisualizerSonnet-D7r5S0I4.js` | 19868 |
| `dioramaMoteField-IMJrSnM9.js` | 14669 |
| `getTexelRangeRects-BAS7flLR.js` | 13629 |
| `VisualizerPartita-P46cjY1A.js` | 13090 |
| `pixiDisplayResources-BL0CEQiB.js` | 13025 |
| `glowWordVariants-Cezv18yr.js` | 11232 |
| `react-CjkP5O6j.js` | 10150 |
| `VisualizerSubtitleOverlay-DudK0afv.js` | 10060 |
| `Visualizer-tjS5Klyv.js` | 8223 |
| `canvasUtils-DNJwEZz9.js` | 7769 |
| `monetLyricsModel-DPytWbAA.js` | 7660 |
| `VisualizerShell-BuN-9eJn.js` | 5939 |
| `react-dom-DObCtidp.js` | 5076 |
| `rich-inline-5dpZ6t7j.js` | 4734 |
| `createLucideIcon-DZl1CQFo.js` | 4607 |
| `songHandover-BNLOoq5Z.js` | 3804 |
| `pixiFilterVertex-CsG58D2q.js` | 2977 |
| `wordColoring-DgqnXIMU.js` | 2893 |
| `temperaImageLayer-CS3gCcU1.js` | 2750 |
| `fontStacks-DNpsDRKf.js` | 2515 |
| `VisualizerStill-BF06M1kX.js` | 2486 |
| `lucideIconResolver-C_dLPdeK.js` | 2214 |
| `colorMix-CtZp7wWO.js` | 2030 |
| `renderHints-N8ueXSEY.js` | 2010 |
| `graphemeTiming-C9_E-V0M.js` | 1785 |
| `Cache-2P89M3zf.js` | 1528 |
| `runtime-CmFVuUTj.js` | 1365 |
| `glowBlurQuantize-BdJ6wm_a.js` | 1361 |
| `wordSegmentation-DC34r7QQ.js` | 1290 |
| `pixiSongSwap-JN4c9rUV.js` | 1054 |
| `rolldown-runtime-Y_bBpyJl.js` | 962 |

## 七、無 WebGL 的逐模式複測（2026-10-15 第二輪，隔離背景層）

### 為什麼要重測

上面的第二節（14 模式偽裝無 WebGL）把 `diorama`、`pendolo`、`lumiere`、`still` 標成
「受限」，`sonnet`／`tempera` 帶 `renderer-error`。**那一列 `renderer-error` 標記每一行都有**
（連狀態 PASS 的 `classic`、`cappella` 也有），而且每一行都帶
`no-webgl-background-fallback`。這代表當時量到的錯誤來自**背景層**（`latent` 走
@paper-design/shaders，同步拋錯），不是模式層；把兩層混在一起判，mode 級結論不可用。

第二輪改成**隔離模式層**：payload 不指定背景（`data-stage-background` 為空），
只把 `HTMLCanvasElement.prototype.getContext` 對 `webgl`／`webgl2`／`experimental-webgl`
打成 `null`，再逐個以 `<select id="sfMode">` 真實切換。
環境：本機態（`npm run build:local`）、`artist.html?a=jay-chou` 與 `?a=jj-lin`、
MCP chromium（頁內 `innerWidth` 自證 1440×901）、`#plAudio` 播放中。

### 7.1 修正前的實測（能力判斷只在背景層）

| 請求模式 | 實際生效 | canvas | 錯誤邊界 | 觀察 |
| --- | --- | --- | --- | --- |
| `cadenza` | `cadenza` | 3 | 否 | 正常 |
| `cappella` | `cappella` | 2 | 否 | 正常 |
| `claddagh` | `claddagh` | 2 | 否 | 正常 |
| `classic` | `classic` | 2 | 否 | 正常 |
| `diorama` | `diorama` | 0 | **是** | 畫面顯示「這個模式在這台裝置上跑不起來」 |
| `fume` | `fume` | 3 | 否 | 正常 |
| `lumiere` | **不是 `lumiere`** | 4 | 否 | 未套用、**沒有任何說明**（靜默失敗） |
| `monet` | `monet` | 3 | 否 | 正常 |
| `partita` | `partita` | 2 | 否 | 正常 |
| `pendolo` | `pendolo` | 4 | 否 | 正常（走自帶 Canvas2D 回退） |
| `sonnet` | `sonnet` | 3 | 否 | 正常（歌詞行號 0） |
| `still` | `still` | 0 | 否 | 正常（純 DOM，歌詞行號 1） |
| `tempera` | `tempera` | 3 | 否 | 正常（歌詞行號 1） |
| `tilt` | `tilt` | 2 | 否 | 正常（歌詞行號 2） |

- `webgl2` 與 `webgl` 皆為 `null`（偽裝生效），初始 `data-stage-webgl="false"`、
  `data-stage-degraded="no-webgl"`。
- 14 次 `Paper Shaders: WebGL is not supported in this browser` 的 pageerror：
  來自背景層，不是這 14 個模式。
- **結論：只有 `diorama` 與 `lumiere` 在無 GL 時真的壞掉，且壞法不同**——
  `diorama` 拋錯被錯誤邊界接住並顯示說明；`lumiere` 連套用都沒完成、畫面停在舊模式，
  沒有錯誤可接、也沒有說明。
  `pendolo` 有 `pendoloClockworkDraw2d.ts` 回退、`still` 是純 DOM，兩者都不需要收斂。

### 7.2 修正後（模式層也做啟動前能力判斷）

| 請求模式 | `data-stage-mode` | `data-stage-mode-requested` | `data-stage-degraded` | 錯誤邊界 | 狀態列 |
| --- | --- | --- | --- | --- | --- |
| `diorama` | `classic` | `diorama` | `no-webgl no-webgl-mode-fallback:diorama` | **否** | 這台裝置沒有 WebGL，「微縮」已改用經典 |
| `lumiere` | `classic` | `lumiere` | `no-webgl no-webgl-mode-fallback:lumiere` | **否** | 這台裝置沒有 WebGL，「光」已改用經典 |
| `pendolo` | `pendolo` | `pendolo` | 沿用前一次的 fallback 記錄 | 否 | 已鎖定模式：鐘擺 |
| `still` | `still` | `still` | 同上 | 否 | 已鎖定模式：靜 |
| `classic` | `classic` | `classic` | 同上 | 否 | 已鎖定模式：經典 |
| 背景 `latent` | 實際 `common` | — | 同上 | 否 | 背景：素底 |

- `diorama` 由「錯誤邊界觸發（boundary 為真）」變成「**邊界不再被觸發**」——
  替換發生在渲染器啟動之前。
- `lumiere` 的靜默失敗變成**明列的替換與說明**。
- 0 pageerror；按「恢復自動」後 `data-stage-auto="true"`、`aria-pressed="true"`。
- 依據：`stage/src/capabilities.js` 的 `WEBGL_MODES = {diorama, lumiere}`、
  `WEBGL_FREE_MODE = 'classic'`、`applyModeCapability()`。

### 7.3 這一輪無法量的

- 真實觸控全鏈路（Task 19）：此瀏覽器 context 未開 `hasTouch`，`page.touchscreen.tap`
  直接拋錯，屬工具限制；未以 `element.click()` 假裝通過。
- 橫屏（845×391）下舞台視覺化高 95px（約視窗 24%）：功能正常、無溢出，觀感偏擠，
  留人工視覺驗收判斷。

