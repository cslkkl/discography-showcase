# css/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

css/ 特有约束：

- 樣式由兩個檔案承擔：`style.css`（全站樣式，分節以 `/* ── N. 名稱 ── */` 標註，
  新增樣式歸入既有分節）與 `motifs.css`（每位歌手的專屬母題，按 `data-motif` 選組）
- 歌手層主題使「第二強調色」有了明確邊界：同一歌手頁內只有一個強調色 `--accent`，
  其上的前景色只能是 `--accent-on`；母題裝飾一律取 `var(--accent)`，不得自帶新色
- 圓角只用兩個檔位：控制項 `--r-pill`，面與圖 `--r`
- 新增動效必須在 `prefers-reduced-motion` 區塊內給出降級
- 捲動驅動的位移寫在自訂屬性上，由 JS 以 rAF 更新，不在 CSS 內做逐幀動畫
- 不引入外部 CSS 框架或預處理器

檔案職責與變更影響面見 [README.md](README.md)。
