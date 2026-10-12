# PLAN — 进行中计划

跨会话延续用。完成的事项移入 git log，不在本文件堆流水账。

## 当前进度

- 站点功能完整：入口选歌手 + 歌手页十四个展示面 + 试听播放 + 繁简切换
- 五位歌手上线：jacky-cheung（40 专辑/433 曲）、jay-chou（16/175）、
  taylor-swift（12/174）、terry-lin（10/126）、xue-zhiqian（13/131），
  共 1039 曲全部可试听
- 主题三层落地：五套母题（spotlight/ink/midnight/aria/neon），
  专辑层抽屉强调色从封面派生
- 抓取工具化：`_data/fetch-artist.mjs`（list/fetch 两模式）成为新增歌手第一步
- 仓库 `cslkkl/discography-showcase`，公开，CI 绿，本地与远端一致
- 门禁齐备：ESLint / Prettier / 链接校验 / 行尾校验，本地钩子已启用

## 未完成事项

- [ ] 文档语言统一：当前繁简混用（`css/AGENTS.md` 繁体，`js/AGENTS.md` 简体）。
      方向待维护者拍板（建议统一简体：维护者阅读语言，运行时默认显示也是简体）
- [ ] `assets/fonts/` 210 个子集是否按需化（体积 10.9 MB）
- [ ] 母题只做了氛围层（晕染/光带/星点/弧线）；按歌手逐个细修
- [ ] `js/data.js` 651 KB；继续扩充歌手时考虑按歌手拆档

## 已知问题

- 全部记录在根 `AGENTS.md` 活跃坑，本文件不重复。
  最易踩的两条：背景分页 transition 冻结（测样式前先 bringToFront）、
  CSSOM 遍历要用 `selectorText !== undefined` 判断

## 下一步计划

1. 维护者过目五位歌手的视觉人格（入口页五行色卡 + 各页母题），报感受调参数
2. 大陆歌手若遇简体目录来源，繁体模式曲目名保持简体（已在活跃坑记录处理方式）
