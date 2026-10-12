# .github/workflows/ — 规则层

继承根规则，见 [../../AGENTS.md](../../AGENTS.md)。

本目录特有约束：

- CI 只读，绝不写回仓库
- 安装一律 frozen 模式（`npm ci`），不联网解析新版本
- 命令一律 check 类（`--check` / 不写文件），修复交给本地钩子
- Node 版本来源为 `.node-version`，不在 workflow 内写死
- 不引入需要密钥的步骤；无部署流程，CI 只做校验

各 workflow 职责见 [README.md](README.md)。
