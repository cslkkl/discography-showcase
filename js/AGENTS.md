# js/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

js/ 特有约束：

- `data.js` 是生成物，禁止手改；改动一律改 `_data/build.mjs` 后重跑 `npm run build`
- `app.js` 是浏览器经典脚本，不是 ES 模块；`JC` 是跨文件全局，已在 ESLint 中声明
- 不引入任何 npm 运行时依赖，不用打包器，保持零构建
- 不在 JS 内直接写样式；只切换 class 与 CSS 自定义属性
- 指针与滚动处理必须 rAF 节流，热路径不读版面
- 新增 `window.JC` 栏位须同一次改动内更新 [README.md](README.md) 与 [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

文件职责见 [README.md](README.md)。
