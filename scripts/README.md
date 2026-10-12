# scripts/ — 校驗腳本

- 職責：文件網路與行尾的機器兜底校驗
- 來源：`maintenance-flow` skill 原樣複製，升級時整份覆蓋
- 被誰依賴：`package.json` 的 `check:docs` / `check:eol` / `check:changed`，以及 `.githooks/` 與 CI
- 依賴：Python 3（本機為 3.14.4）

## 檔案

### `check-markdown-links.py`

- 職責：校驗 Markdown 的相對連結與錨點是否可解析
- 用法：`python scripts/check-markdown-links.py . --fragments --refs`
- 參數可為目錄或單個 `.md`，可混用；`--fragments` 校驗錨點，`--refs` 提示未做成連結的引用
- 退出碼 0 表示無錯誤；`--fragments` 與 `--refs` 僅告警，不影響退出碼

### `check-line-endings.py`

- 職責：逐位元組統計 LF / CRLF / 裸 CR，報告混行與不一致
- 用法：`python scripts/check-line-endings.py .`
- 預設只讀；替換須顯式 `--target lf --write`
- 跳過二進位與 UTF-16；保留 UTF-8 BOM 與檔尾換行有無；只動行尾，內容零改動
- 退出碼 0 表示無不一致

### `classify-changed-files.py`

- 職責：把 git 改動檔案機械分類為 `docs` / `config` / `code`
- 用法：`python scripts/classify-changed-files.py`
- 只做分類，不決定跑哪些檢查；對應關係寫在 [../AGENTS.md](../AGENTS.md) 的檢查選擇表

## 變更影響路由

改這裡 → 必跑：

- 任何腳本 → 對整倉跑一次，確認退出碼為 0
- 新增腳本 → 同步 [../AGENTS.md](../AGENTS.md) 指令表與本檔
- 從 skill 覆蓋升級 → 覆蓋後重跑 `npm run check` 全套

## 已知坑

- 呼叫時須帶 `PYTHONIOENCODING=utf-8`，否則 Windows 主控台會讓中文輸出亂碼

使用約束見 [AGENTS.md](AGENTS.md)。
