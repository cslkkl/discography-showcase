# scripts/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

scripts/ 特有约束：

- 本目录的三个脚本是从 `maintenance-flow` skill 原样复制的，**不要就地修改**；
  升级时整份覆盖，避免与上游产生分叉
- 脚本只读，不写仓库文件（`check-line-endings.py` 仅在显式传 `--write` 时才写）
- 本地钩子与 CI 必须调用本目录的同一份脚本，不各自内联逻辑
- 脚本依赖 Python 3；调用处须显式保证 UTF-8 输出，否则中文会乱码

各脚本职责见 [README.md](README.md)。
