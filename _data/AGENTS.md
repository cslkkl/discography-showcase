# _data/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

_data/ 特有约束：

- 本目录是可重建的输入层与工具层，不是站点的运行期资源；`index.html` 不引用它
- `albums-raw.json` 与 `colors.json` 必须入库，它们是 `build.mjs` 的输入
- 抓取类脚本必须幂等，重跑不得产生重复或错乱；失败要报错而非静默跳过
- 事实与文案分离：事实进 `albums-raw.json`，文案进 `build.mjs` 的 `META`
- 修改 `META` 中的曲目名须同时检查 `KANJI_FIX` 是否需要扩充
- PowerShell 抓取脚本用 `Set-Content` 会写 CRLF，提交前跑 `npm run check:eol`
- 不引入 npm 依赖；需要网络时用 PowerShell 或 Node 内置模块

各文件职责见 [README.md](README.md)。
