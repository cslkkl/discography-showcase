# .github/workflows/ — CI 说明

- 職責：push 後在獨立環境跑唯讀校驗
- 與本地鉤子的分工：本地鉤子只跑本次 diff 觸達的模組並可自動修；CI 跑全量且只讀
- 兩者呼叫 `scripts/` 內同一份腳本，不各自內聯邏輯

## 檔案

### `ci.yml`

- 觸發：push 到任意分支、以及針對 `main` 的 pull request
- 步驟：`npm ci` → `eslint .` → `prettier --check .` → 連結校驗 → 行尾校驗
- 只讀：不執行 `--write`，不提交任何變更

## 變更影響路由

改這裡 → 必跑：

- 任何 workflow → 本地先跑一遍等價命令（`npm run check`），確認全綠
- 新增檢查項 → 同步 [../../AGENTS.md](../../AGENTS.md) 的驗證快照與本檔

## 已知限制

本倉未發布到遠端，CI 只在有遠端時才會實際執行；無遠端期間以本地 `npm run check` 為準。

使用約束見 [AGENTS.md](AGENTS.md)。
