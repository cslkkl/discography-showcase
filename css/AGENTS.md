# css/ — 规则层

继承根规则，见 [../AGENTS.md](../AGENTS.md)。

css/ 特有约束：

- 只維護 `style.css` 一個檔案，不拆分；分節以 `/* ── N. 名稱 ── */` 標註，新增樣式歸入既有分節
- 不得引入第二強調色；強調色只有 `--accent`，其上的前景色只能是 `--accent-on`
- 圓角只用兩個檔位：控制項 `--r-pill`，面與圖 `--r`
- 新增動效必須在 `prefers-reduced-motion` 區塊內給出降級
- 捲動驅動的位移寫在自訂屬性上，由 JS 以 rAF 更新，不在 CSS 內做逐幀動畫
- 不引入外部 CSS 框架或預處理器

檔案職責與變更影響面見 [README.md](README.md)。
