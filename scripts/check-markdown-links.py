#!/usr/bin/env python3
"""Markdown 相对链接校验：扫描目录（或单文件）下 .md 文件的 [text](path) 链接。

用法: python check-markdown-links.py [路径...] [--fragments] [--exclude GLOB] [--no-ignore]
                            [--encoding ENC] [--quiet] [--verbose] [--github]
- 路径：目录（递归）或单个 .md 文件，均可混合；默认当前目录。
- 默认跳过 .git / node_modules / .venv / dist 等目录；--no-ignore 关闭跳过。
- 外链(http/https/mailto/data/tel)、模板占位符({...}) 跳过。
- 错误 = 链接目标不存在；警告 = 锚点未找到(--fragments)。
- --fragments 校验锚点（警告级）：跨文件锚点 file.md#x 与文内锚点 #x 一并检查。
  算法对齐 GitHub（github-slugger）：保留下划线、标点删除而非替换、空格逐个转短横、
  同名标题依次补 -1/-2；围栏代码块内的 # 不算标题；显式 <a id="..."> 视为有效锚点。
- --refs 校验「文档引用未做成链接」（警告级）：不设词表，行内出现 .md 即为候选。
  不报的只有四类：已成链的、围栏代码块内的、HTML 标签里的
  （<a href> 已是链接）、以及解析不到真实文件或链回自己的。
  只提示不阻断，真假交由读者判断。
- --github: 模拟 GitHub 解析（Linux 语义）——
  大小写敏感逐组件比对 + 链接目标须被 git 跟踪（目录放行）。
  Windows 本地存在不敏感，此模式在推送前补查 GitHub 上会 404 的链接。
  非 git 仓库中跳过跟踪检查，避免误报。
  非 ASCII 文件名（中文等）按原样读取，不做八进制转义。
- 退出码: 0 = 无错误, 1 = 有错误（警告不影响退出码）。
"""
import argparse
import fnmatch
import os
import re
import subprocess
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

EXCLUDE_DIRS = {
    ".git", ".hg", ".svn", "node_modules", ".venv", "venv", "__pycache__",
    ".idea", ".vscode", "dist", "build", ".pytest_cache", ".ruff_cache",
    ".workbuddy",  # 项目数据（会话记忆等），不属文档网络
}
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
ATTR_ID_RE = re.compile(r'<a\s+id="([^"]+)"')
LINKISH_RE = re.compile(r"\[.*?\]\([^()]*\)")  # 非贪婪，链接文字里套方括号也能整条剥掉
BRACKET_RE = re.compile(r"\[[^\[\]]*\]")
DOC_TOKEN_RE = re.compile(r"[\w./\\-]+\.md\b")


def iter_md_files(paths, exclude, no_ignore):
    for path in paths:
        p = os.path.abspath(path)
        if os.path.isfile(p):
            if p.lower().endswith((".md", ".markdown")) and not _excluded(p, exclude):
                yield p
            continue
        for dirpath, dirnames, filenames in os.walk(p):
            if not no_ignore:
                dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            dirnames[:] = [d for d in dirnames
                           if not _excluded(os.path.join(dirpath, d), exclude)]
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                if fn.lower().endswith((".md", ".markdown")) and not _excluded(full, exclude):
                    yield full


def _excluded(path, patterns):
    return any(fnmatch.fnmatch(path, pat) or fnmatch.fnmatch(os.path.basename(path), pat)
               for pat in patterns)


def strip_fences(text):
    """把围栏代码块（``` / ~~~）内的行置空；保留行号与行内代码，供锚点与逐行判定使用。"""
    out, fence = [], None
    for line in text.splitlines():
        if fence:
            fence = None if FENCE_RE.match(line) else fence
            out.append("")
            continue
        if FENCE_RE.match(line):
            fence = line.strip()[0]
            out.append("")
            continue
        out.append(line)
    return "\n".join(out)


def strip_code_blocks(text):
    """链接提取用：先去掉围栏代码块，再去掉行内代码，避免把示例误判成链接。"""
    return re.sub(r"`[^`\n]+`", "", strip_fences(text))


def slugify(text):
    """GitHub 锚点算法（对齐 github-slugger）。

    保留字母 / 数字 / 组合符（L、N、M）、连接标点下划线（Pc）、短横、空格、表情；
    其余标点直接删除（不替换成短横）；空格逐个转短横；不折叠、不裁剪。
    """

    def keep(ch):
        cat = unicodedata.category(ch)
        return (cat[0] in "LNM" or cat == "Pc" or ch in "- \u200d"
                or ord(ch) >= 0x1F000)

    return "".join(ch for ch in text.lower() if keep(ch)).replace(" ", "-")


def heading_anchors(path, encoding="utf-8"):
    """文件内可用锚点：标题 slug（同名按 GitHub 规则补 -1/-2）+ 显式 <a id="...">。"""
    anchors, seen = set(), {}
    try:
        with open(path, encoding=encoding) as f:
            lines = strip_fences(f.read()).splitlines()
    except OSError:
        return anchors
    for line in lines:
        s = line.strip()
        if s.startswith("#"):
            base = slugify(s.lstrip("#").strip())
            n = seen.get(base, 0)
            seen[base] = n + 1
            anchors.add(base if n == 0 else f"{base}-{n}")
        m = ATTR_ID_RE.search(line)
        if m:
            anchors.add(m.group(1))
    return anchors


def strip_links(text):
    """剥掉行内所有 Markdown 链接，只留非链接文字。

    逐个模式替换到不动点（整条链接 → 残留方括号），
    这样链接文字里再套一层方括号（如 [`[id]/README.md`](...)）也能剥干净。
    """
    for pattern in (LINKISH_RE, BRACKET_RE):
        while True:
            stripped = pattern.sub(" ", text)
            if stripped == text:
                break
            text = stripped
    return text


def bare_doc_refs(line):
    """返回该行里「提到某份 .md、却没做成链接」的名称（保序去重）。

    不设词表：只要行内出现 .md 就是候选（反引号内也算），真假交由读者判断。
    已成链的部分先剥掉——含 Markdown 链接和 HTML 标签
    （<a href="x.md"> 里的路径已是链接，不该再算「未成链」）。
    """
    text = re.sub(r"<[^>]+>", " ", line)
    text = strip_links(text)
    seen, refs = set(), []
    for name in DOC_TOKEN_RE.findall(text):
        if name not in seen:
            seen.add(name)
            refs.append(name)
    return refs


# ── GitHub 语义（--github）──

def exact_case_exists(path):
    """路径存在且逐组件大小写精确匹配磁盘条目（模拟 Linux/GitHub）"""
    abs_path = os.path.abspath(path)
    parts = [p for p in abs_path.split(os.sep) if p]
    if not parts:
        return False
    if os.name == "nt":
        head = parts[0] + os.sep  # 盘符（"C:\"）
        parts = parts[1:]
    else:
        head = "/"
    for part in parts:
        if not os.path.exists(head):
            return False
        try:
            if part not in os.listdir(head):
                return False
        except OSError:
            return False
        head = os.path.join(head, part)
    return True


_tracked_by_root: dict[str, set[str]] = {}


def _find_git_root(path):
    """向上找 .git（目录或文件），返回仓库根；找不到返回 None"""
    current = os.path.abspath(path)
    if os.path.isfile(current):
        current = os.path.dirname(current)
    while True:
        if os.path.exists(os.path.join(current, ".git")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def _tracked_files(root):
    """仓库根 → git ls-files 相对路径集合（POSIX 分隔符）

    -c core.quotepath=false：让 git 原样输出非 ASCII 文件名（中文等），
    不做八进制转义（否则「启动生图工作台.ico」会变成
    「\\345\\220\\257\\345\\212\\250...」，与文件系统真实路径对不上，
    中文名文件被误判「未被 git 跟踪」）。
    encoding="utf-8"：Windows 默认用 GBK 解码子进程输出，
    但 git 输出的是 UTF-8 字节，不显式指定会在 reader 线程里炸，
    导致 result.stdout 变 None（错误现场很难定位）。
    """
    if root not in _tracked_by_root:
        result = subprocess.run(
            ["git", "-C", root, "-c", "core.quotepath=false", "ls-files"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        _tracked_by_root[root] = set(result.stdout.splitlines())
    return _tracked_by_root[root]


def github_target_status(path):
    """GitHub 语义检查。返回 (ok, message)：
    - 非 git 仓库 → (True, None)（跳过，不误报）
    - 越出仓库根 → (False, "越出仓库根")
    - 目录 → (True, None)（目录链接 GitHub 可打开）
    - 文件未跟踪 → (False, "未被 git 跟踪")
    - 其余 → (True, None)
    """
    if not exact_case_exists(path):
        return False, "目标不存在或大小写不匹配（GitHub 大小写敏感）"
    root = _find_git_root(path)
    if root is None:
        return True, None
    rel = os.path.relpath(path, root)
    if rel == ".." or rel.startswith(".." + os.sep):
        return False, "越出仓库根"
    if os.path.isdir(path):
        return True, None
    posix_rel = rel.replace(os.sep, "/")
    if posix_rel not in _tracked_files(root):
        return False, "未被 git 跟踪（GitHub 上不存在）"
    return True, None


def main():
    ap = argparse.ArgumentParser(description="Markdown 相对链接校验")
    ap.add_argument("paths", nargs="*", default=["."], help="目录或 .md 文件（默认当前目录）")
    ap.add_argument("--fragments", action="store_true", help="同时校验 #锚点（警告级）")
    ap.add_argument("--refs", action="store_true", help="校验文档引用未做成链接（警告级）")
    ap.add_argument("--exclude", action="append", default=[], help="排除模式（fnmatch，可多次）")
    ap.add_argument("--no-ignore", action="store_true", help="不跳过 .git/node_modules 等目录")
    ap.add_argument("--encoding", default="utf-8", help="文件解码编码（默认 utf-8）")
    ap.add_argument("--quiet", action="store_true", help="只输出错误与汇总")
    ap.add_argument("--verbose", action="store_true", help="每个文件列出链接计数")
    ap.add_argument("--github", action="store_true",
                    help="模拟 GitHub 解析：大小写敏感 + 目标须被 git 跟踪（目录放行）")
    args = ap.parse_args()

    errors, warnings, files, links = [], [], 0, 0
    for md in iter_md_files(args.paths, args.exclude, args.no_ignore):
        files += 1
        try:
            with open(md, encoding=args.encoding) as f:
                raw_text = f.read()
        except OSError as e:
            warnings.append(f"{md}: 读取失败 {e}")
            continue
        text = strip_code_blocks(raw_text)
        base = os.path.dirname(md)
        file_links = 0
        for target in LINK_RE.findall(text):
            links += 1
            file_links += 1
            raw = target.strip()
            if raw.startswith("<") and raw.endswith(">"):
                raw = raw[1:-1]
            if "://" in raw or raw.startswith(("mailto:", "data:", "tel:")):
                continue
            if "{" in raw or "}" in raw:  # 模板占位符，跳过
                continue
            target_path, anchor = raw, None
            if "#" in raw:
                target_path, anchor = raw.split("#", 1)
            # 空 target_path = 文内锚点，校验对象是当前文件
            path = os.path.normpath(os.path.join(base, target_path)) if target_path else md
            if target_path:
                if args.github:
                    ok, message = github_target_status(path)
                    if not ok:
                        errors.append(f"{md}: 链接目标 {message} -> {target_path}")
                        continue
                elif not os.path.exists(path):
                    errors.append(f"{md}: 链接目标不存在 -> {target_path}")
                    continue
            if anchor and args.fragments and anchor not in heading_anchors(path, args.encoding):
                warnings.append(f"{md}: 锚点未找到 #{anchor} -> {target_path or '(本文)'}")
        if args.refs:
            for lineno, line in enumerate(strip_fences(raw_text).splitlines(), 1):
                for name in bare_doc_refs(line):
                    target = os.path.normpath(os.path.join(base, name))
                    # 自指不必成链（链回自己无意义），其余必须解析到真实文件才报
                    if target != os.path.normpath(md) and os.path.exists(target):
                        warnings.append(f"{md}:{lineno}: 引用未做成链接 -> {name}")
        if args.verbose and not args.quiet:
            print(f"{md}: {file_links} 链接")

    if files == 0:
        # 扫到 0 文件 = 路径不存在 / 全部被 --exclude 排除 / 目录下无 .md 文件，
        # 属配置错误而非「干净」，按错误上报并退出非零，避免 CI/调用方误判通过。
        errors.append(
            "0 个 .md 文件被扫描：路径不存在 / 全部被 --exclude 排除 / 目录下无 .md 文件？"
        )
    for e in errors:
        print("ERROR", e)
    if not args.quiet:
        for w in warnings:
            print("WARN ", w)
    print(f"checked {files} files, {links} links, {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
