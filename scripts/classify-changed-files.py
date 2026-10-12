#!/usr/bin/env python3
"""按 git 改动范围把改动文件分类为 docs / config / code。

用法: python classify-changed-files.py [路径...] [--base REF] [--staged] [--json] [--quiet]
- 路径：限定扫描范围（默认仓库根；改动不在范围内则被过滤）。
- 默认对比 HEAD（索引 + 工作区）；--base REF 对比指定 ref；--staged 只看已暂存。
- 输出按三类分组：DOCS / CONFIG / CODE；--json 输出机器可读结构。
- 分类规则内置（语言无关，见 DOC_EXTS / DOC_NAMES / CONFIG_NAMES / CONFIG_DIR_PREFIXES）：
  - DOCS  : *.md / *.markdown / *.rst / LICENSE / CHANGELOG 等
  - CONFIG: 依赖锁、构建工具、运行时版本、CI 配置等
  - CODE  : 其余全部
- 不映射具体命令：命令选择是语义的（由项目 AGENTS.md 的「检查选择」规则决定）。
  本脚本只做机械分类，把「跑什么」的判断留给 Agent / 维护者。
- 退出码: 0 = 有改动, 1 = 无改动 / git 错误, 2 = 参数解析错误。
"""
import argparse
import json
import os
import subprocess
import sys

# 修复 B2：同时 reconfigure stdout 和 stderr，避免中文报错乱码
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DOC_EXTS = {".md", ".markdown", ".rst", ".adoc"}
DOC_NAMES = {
    "LICENSE", "LICENSE.txt", "LICENSE.md",
    "CHANGELOG", "CHANGELOG.md", "CHANGES", "CHANGES.md",
    "NOTICE", "AUTHORS", "CONTRIBUTORS",
}
CONFIG_NAMES = {
    "pyproject.toml", "setup.py", "setup.cfg", "requirements.txt",
    "Pipfile", "Pipfile.lock", "uv.lock", "poetry.lock",
    ".python-version", "ruff.toml", ".ruff.toml",
    "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
    "bun.lock", "bun.lockb", ".node-version", ".nvmrc",
    "tsconfig.json", "tsconfig.build.json", "jsconfig.json",
    "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs",
    ".eslintrc", ".eslintrc.json", ".eslintrc.js",
    ".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.yaml",
    ".pre-commit-config.yaml", ".pre-commit-config.yml",
    ".editorconfig", ".tool-versions", ".gitattributes",
}
CONFIG_EXTS = {".lock"}
CONFIG_DIR_PREFIXES = {".github", ".gitlab", ".circleci", ".devcontainer"}

CATEGORIES = ("docs", "config", "code")


def classify(path: str) -> str:
    """按扩展名 / 文件名 / 路径段分类；无匹配归 code。"""
    name = path.rsplit("/", 1)[-1]
    ext = os.path.splitext(name)[1].lower()
    if ext in DOC_EXTS or name in DOC_NAMES:
        return "docs"
    if name in CONFIG_NAMES or ext in CONFIG_EXTS:
        return "config"
    segments = path.split("/")
    if any(d in segments[:-1] for d in CONFIG_DIR_PREFIXES):
        return "config"
    return "code"


def git_changed_files(base, staged, paths):
    """调用 git diff --name-only，返回 (files, error)。

    修复 B1：加 -c core.quotepath=false，禁止 git 转义中文路径；
    修复 B3：stderr 截断到首行，避免非 git 目录下外泄整段 usage。
    --diff-filter=ACMR 排除已删除文件；重命名只保留新路径。
    """
    cmd = ["git", "-c", "core.quotepath=false", "diff", "--name-only", "--diff-filter=ACMR"]
    cmd.append("--cached" if staged else (base or "HEAD"))
    if paths:
        cmd.append("--")
        cmd.extend(paths)

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    except Exception as e:
        return None, f"执行 git 失败: {e}"

    if result.returncode != 0:
        err_msg = result.stderr.strip().splitlines()[0] if result.stderr.strip() else "git diff 失败"
        return None, err_msg
    return [line for line in result.stdout.splitlines() if line.strip()], None


def format_text(grouped: dict[str, list[str]]) -> str:
    """文本输出：每组头一行（类别 + 计数），下面缩进列文件；末尾汇总行。"""
    lines = []
    for cat in CATEGORIES:
        files = grouped[cat]
        if not files:
            continue
        lines.append(f"{cat.upper():<6} {len(files)}")
        lines.extend(f"  {f}" for f in files)
    summary = " ".join(f"{c}={len(grouped[c])}" for c in CATEGORIES)
    total = sum(len(grouped[c]) for c in CATEGORIES)
    lines.append(f"checked {total} files: {summary}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="按 git 改动范围把改动文件分类")
    ap.add_argument("paths", nargs="*", default=[], help="限定扫描范围（默认仓库根）")
    ap.add_argument("--base", help="对比指定 ref（默认 HEAD）")
    ap.add_argument("--staged", action="store_true", help="只看已暂存改动")
    ap.add_argument("--json", action="store_true", help="输出 JSON（机器可读）")
    ap.add_argument("--quiet", action="store_true", help="只输出汇总行")
    args = ap.parse_args()

    if args.base and args.staged:
        ap.error("--base 与 --staged 不可同时使用")

    files, err = git_changed_files(args.base, args.staged, args.paths)
    if err:
        print(f"ERROR {err}")
        return 1

    grouped = {c: [] for c in CATEGORIES}
    for path in files:
        grouped[classify(path)].append(path)
    for c in CATEGORIES:
        grouped[c].sort()

    if args.json:
        payload = {c: grouped[c] for c in CATEGORIES}
        payload["total"] = sum(len(grouped[c]) for c in CATEGORIES)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    elif args.quiet:
        summary = " ".join(f"{c}={len(grouped[c])}" for c in CATEGORIES)
        print(f"checked {len(files)} files: {summary}")
    else:
        print(format_text(grouped))

    return 0 if files else 1


if __name__ == "__main__":
    sys.exit(main())
