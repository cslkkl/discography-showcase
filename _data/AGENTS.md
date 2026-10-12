# _data/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

_data/ 特有约束：

- 本目录是可重建的输入层与工具层，不是站点的运行期资源；`index.html` 与 `artist.html` 不引用它
- 事实与文案分离：事实进 `artists/<id>/albums-raw.json`，文案进 `artists/<id>/meta.mjs`；
  `build.mjs` 不写任何事实
- 新增歌手 = 新增 `artists/<id>/` 资料夹 + `npm run build`，不改 `build.mjs`
- `meta.mjs` 导出的 `id` 必须与资料夹同名，构建时会校验
- 抓取类脚本必须幂等，重跑不得产生重复或错乱；失败要报错而非静默跳过
- PowerShell 抓取脚本用 `Set-Content` 会写 CRLF，提交前跑 `npm run check:eol`
- 不引入 npm 依赖；需要网络时用 PowerShell 或 Node 内置模块

结构见 [README.md](README.md)，新增歌手步骤见 [artists/README.md](artists/README.md)。
