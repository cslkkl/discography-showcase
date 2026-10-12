# artists/ — 规则层

继承上层规则，见 [../AGENTS.md](../AGENTS.md)。

artists/ 特有约束：

- 资料夹名即歌手 id：小写短横线，全局唯一，并与 `meta.mjs` 导出的 `id` 一致
- 每位歌手三个文件：`albums-raw.json`（事实）、`colors.json`（事实）、`meta.mjs`（唯一手写层）
- 事实与文案的边界不可跨越：抓取得到的东西进 json，人的判断进 meta.mjs
- `meta.mjs` 里的介绍与年代说明不得引入无法查证的事实
- 新增歌手的完整步骤见 [README.md](README.md)，不需要改 `build.mjs`
