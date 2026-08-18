# 原仓库前端还原设计

## 目标

让个人论文库的公开前端与 `zhaijj/paper-notebook` 的 `upstream/main` 保持一致，包括英文界面、布局、配色、卡片、搜索、筛选、详情页、博客、暗色模式和 RSS；仅替换个人身份、GitHub 地址、研究方向及论文数据。

## 权威基准

- 前端基准：本地远程跟踪分支 `upstream/main`，提交 `da44aaa07e2d87beade1cb01e39e1fab841be1a8`。
- 保留范围：当前 `.agents/skills`、测试基础设施、发布安全说明和论文添加工具。
- 不以当前重设计的 `docs/` 作为视觉基准。

## 实现范围

1. 从 `upstream/main` 恢复 `docs/` 中的首页、详情页、博客页、样式、脚本、博客文章、图片、Feed 与主题脚本。
2. 将站点身份替换为 Shuo Xu，GitHub 链接替换为 `https://github.com/shuo456/paper-notebook`。
3. 将研究方向替换为控制障碍函数、安全控制、安全关键系统、机器人学习与强化学习；其余界面文案保持原仓库英文。
4. 将 `docs/js/papers.json` 保持为 3 篇示例，并转换为原版前端字段：`journal`、`notebooklm_url`、`notebooklm_notes` 等。
5. 调整论文写入与校验工具，使其输出和验证原版前端字段，同时继续执行 ID、DOI、标题三级去重及原子写入。
6. 恢复原博客结构和原有博客内容；博客内容后续可作为单独任务替换。

## 兼容与安全

- 不提交 API key、OAuth token、Cookie、本机绝对路径或私有 NotebookLM 地址。
- 保留 GitHub Pages 的 `main/docs` 部署方式。
- 已读状态继续由浏览器 `localStorage` 保存。
- Firecrawl 与 NotebookLM 仍为可选集成，不影响静态站运行。

## 验收标准

- `docs/index.html`、`docs/paper.html`、`docs/blog.html` 的结构和视觉行为与上游基准一致，仅出现批准的个性化差异。
- 首页准确显示 3 篇论文，搜索、期刊、标签、深度笔记、已读/未读、排序与数量筛选可用。
- 三个详情页可访问，博客页、文章页、RSS 和暗色模式可访问。
- 超长期刊或会议名称不会越出卡片边界；若上游本身存在该缺陷，仅增加最小兼容修复并记录为批准外的必要修复。
- 自动化测试通过，并在电脑端浏览器完成视觉和控制台核验。
- 本地完成后不自动提交或推送功能改动；发布前再次展示差异并征得确认。
