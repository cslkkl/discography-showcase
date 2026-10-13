# _data/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

_data/ 特有约束：

- 本目录是可重建的输入层与工具层，不是站点的运行期资源；`index.html` 与 `artist.html` 不引用它
- 事实与文案分离：事实进 `artists/<id>/albums-raw.json`，文案进 `artists/<id>/meta.mjs`；
  `build.mjs` 不写任何事实
- 新增歌手 = 新增 `artists/<id>/` 资料夹 + `npm run build`，不改 `build.mjs`
- `meta.mjs` 导出的 `id` 必须与资料夹同名，构建时会校验
- 曲目序號 `n` 是站點內的鍵（音檔路徑、本機登記檔、播放定位都用「專輯id + n」），
  由 `build.mjs` 統一重編為**專輯內連續唯一**；**不得直接沿用目錄的 trackNumber**——
  雙 CD 精選會按碟重新從 1 編號（林志炫《單身情歌.超炫精選》曾是兩首 #2、兩首 #4），
  撞鍵會讓兩首歌指向同一個音檔，是會播錯歌的錯。碟號另存 `disc` 供顯示，不參與鍵
- 抓取類腳本必須冪等，重跑不得產生重複或錯亂；失敗要報錯而非靜默跳過
- PowerShell 抓取腳本：**保持純 ASCII**（本機 ACP 936，PS 5.1 會把無 BOM 的 UTF-8 當 GBK 讀，
  中文註解行尾會吃掉下一行的換行、把程式碼併進註解）。用 `npm run check:ps1` 把關；
  寫檔一律用 `[System.IO.File]::WriteAllText` 配 `UTF8Encoding($false)`
- 不引入 npm 依赖；需要网络时用 PowerShell 或 Node 内置模块

结构见 [README.md](README.md)，新增歌手步骤见 [artists/README.md](artists/README.md)。
