#!/usr/bin/env python3
"""换行序列检测与统一：扫描目录（或单文件），逐字节统计 LF / CRLF / 裸 CR，可替换为统一目标行尾。

用法:
  python check-line-endings.py [路径...] [--target lf|crlf|cr] [--write|--dry-run]
                              [--ext .py .md ...] [--exclude GLOB] [--no-ignore]
                              [--encoding utf-8] [--quiet] [--verbose]

安全约定（绝不错误更换）:
- 默认只读报告；--dry-run 显示将改写哪些（不写）；--write 才真正改写。
- --write 必须同时给 --target；逐个文件原子替换（同目录 .tmp + os.replace），写后读回校验。
- 二进制（含 NUL）、UTF-16、非目标编码（解码失败）文件一律跳过并说明，不转换。
- 保留 UTF-8 BOM（有则写回）；文件末尾是否有换行保持不变；文本内容不改一个字节。
- 退出码: 0 = 无不一致（或 --write 后全部一致）, 1 = 有不一致 / 替换失败。
"""
import argparse
import fnmatch
import os
import sys
import tempfile

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

EXCLUDE_DIRS = {
    ".git", ".hg", ".svn", "node_modules", ".venv", "venv", "__pycache__",
    ".idea", ".vscode", "dist", "build", ".pytest_cache", ".ruff_cache",
}
TARGETS = {"lf": "\n", "crlf": "\r\n", "cr": "\r"}
UTF8_BOM = b"\xef\xbb\xbf"
UTF16_BOMS = (b"\xff\xfe", b"\xfe\xff")
IS_TEXT_CHUNK = 8192


def analyze(data: bytes) -> tuple[int, int, int]:
    """逐字节统计换行：(lf, crlf, cr)。纯字节判定，不依赖文本解码。"""
    lf = crlf = cr = 0
    i, n = 0, len(data)
    while i < n:
        b = data[i]
        if b == 0x0A:
            lf += 1
            i += 1
        elif b == 0x0D:
            if i + 1 < n and data[i + 1] == 0x0A:
                crlf += 1
                i += 2
            else:
                cr += 1
                i += 1
        else:
            i += 1
    return lf, crlf, cr


def iter_files(paths, exclude, no_ignore):
    for path in paths:
        p = os.path.abspath(path)
        if os.path.isfile(p):
            if not _excluded(p, exclude):
                yield p
            continue
        for dirpath, dirnames, filenames in os.walk(p):
            if not no_ignore:
                dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            dirnames[:] = [d for d in dirnames
                           if not _excluded(os.path.join(dirpath, d), exclude)]
            for fn in filenames:
                full = os.path.join(dirpath, fn)
                if not _excluded(full, exclude):
                    yield full


def _excluded(path, patterns):
    return any(fnmatch.fnmatch(path, pat) or fnmatch.fnmatch(os.path.basename(path), pat)
               for pat in patterns)


def classify(lf: int, crlf: int, cr: int) -> str:
    kinds = {k for k, v in (("lf", lf), ("crlf", crlf), ("cr", cr)) if v > 0}
    return "mixed" if len(kinds) > 1 else (kinds.pop() if kinds else "none")


def convert(data: bytes, target: str, encoding: str) -> bytes:
    """统一换行：按 CRLF/CR/LF 归一行界后以目标行尾重连；保留 BOM 与末尾换行。"""
    bom = b""
    body = data
    if body.startswith(UTF8_BOM):
        bom, body = UTF8_BOM, body[len(UTF8_BOM):]
    text = body.decode(encoding)
    norm = text.replace("\r\n", "\n").replace("\r", "\n")
    sep = TARGETS[target]
    return bom + sep.join(norm.split("\n")).encode(encoding)


def atomic_write(path: str, data: bytes) -> None:
    """同目录临时文件 + os.replace 原子替换（绝不写半个文件）。"""
    fd, tmp = tempfile.mkstemp(prefix=".line-endings-", dir=os.path.dirname(path) or ".")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp, path)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def main():
    ap = argparse.ArgumentParser(description="换行序列检测与统一（默认只读）")
    ap.add_argument("paths", nargs="*", default=["."], help="文件或目录（默认当前目录，递归）")
    ap.add_argument("--target", choices=sorted(TARGETS), help="目标行尾（lf/crlf/cr）")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="改写不一致文件（需 --target）")
    mode.add_argument("--dry-run", action="store_true", help="只显示将改写哪些，不写文件")
    ap.add_argument("--ext", action="append", default=[], help="只检查指定扩展名（可多次，如 --ext .py --ext .md）")
    ap.add_argument("--exclude", action="append", default=[], help="排除模式（fnmatch，可多次）")
    ap.add_argument("--no-ignore", action="store_true", help="不跳过 .git/node_modules 等目录")
    ap.add_argument("--encoding", default="utf-8", help="文本解码编码（默认 utf-8；解码失败的文件跳过）")
    ap.add_argument("--quiet", action="store_true", help="只输出不一致与汇总")
    ap.add_argument("--verbose", action="store_true", help="列出全部检查文件")
    args = ap.parse_args()

    if args.write and not args.target:
        ap.error("--write 必须同时指定 --target")

    ext_set = {e.lower() if e.startswith(".") else "." + e.lower() for e in args.ext}
    checked = inconsistent = written = skipped = 0
    problems: list[str] = []

    for path in iter_files(args.paths, args.exclude, args.no_ignore):
        if ext_set and os.path.splitext(path)[1].lower() not in ext_set:
            continue
        try:
            with open(path, "rb") as f:
                head = f.read(IS_TEXT_CHUNK)
                f.seek(0)
                data = f.read()
        except OSError as e:
            problems.append(f"{path}: 读取失败 {e}")
            continue
        checked += 1
        if b"\x00" in data or head.startswith(UTF16_BOMS):
            skipped += 1
            if args.verbose and not args.quiet:
                print(f"SKIP  {path}: 二进制 / UTF-16，不转换")
            continue
        lf, crlf, cr = analyze(data)
        kind = classify(lf, crlf, cr)
        if kind == "none":
            # 无换行（空文件 / 单行无末尾换行）：不存在行尾问题，不转换也不报告
            if args.verbose and not args.quiet:
                print(f"OK    {path}: 无换行")
            continue
        target = args.target
        ok = (kind == target) if target else kind in ("lf", "crlf", "cr")
        if ok:
            if args.verbose and not args.quiet:
                print(f"OK    {path}: lf={lf} crlf={crlf} cr={cr}")
            continue
        inconsistent += 1
        if args.quiet:
            print(f"{path}: lf={lf} crlf={crlf} cr={cr}")
            continue
        if not (args.write and target):
            action = "将替换" if args.dry_run else "不一致"
            print(f"{'MIXED' if kind == 'mixed' else kind.upper():<5} {path}: lf={lf} crlf={crlf} cr={cr} [{action}]")
            continue
        try:
            new_data = convert(data, target, args.encoding)
        except UnicodeDecodeError as e:
            skipped += 1
            problems.append(f"{path}: 跳过（编码 {args.encoding} 解码失败：{e.reason}）")
            continue
        print(f"{'MIXED' if kind == 'mixed' else kind.upper():<5} {path}: lf={lf} crlf={crlf} cr={cr} [已替换]")
        try:
            atomic_write(path, new_data)
            # 写后读回校验：字节必须与预期完全一致（绝不错误更换）
            with open(path, "rb") as f:
                if f.read() != new_data:
                    problems.append(f"{path}: 写后读回校验不一致（已还原现场请人工检查）")
                    continue
            written += 1
        except OSError as e:
            skipped += 1
            problems.append(f"{path}: 替换失败 {e}")

    for p in problems:
        print("WARN ", p)
    if checked == 0:
        # 扫到 0 文件 = 路径不存在 / 全部被 --exclude 排除 / --ext 过滤后无匹配，
        # 属配置错误而非「干净」，按错误上报并退出非零，避免 CI/调用方误判通过。
        print("ERROR 0 个文件被扫描：路径不存在 / 全部被 --exclude 排除 / --ext 过滤后无匹配？")
    print(
        f"checked {checked} files, {inconsistent} inconsistent, "
        f"{written} written, {skipped} skipped"
    )
    # --write 全部修复后不再计为失败；dry-run/只读模式有不一致即失败；0 文件即失败
    return 1 if (problems or checked == 0 or inconsistent - written > 0) else 0


if __name__ == "__main__":
    sys.exit(main())
