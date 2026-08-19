# Personal Paper Notebook 复现设计

## 目标

将 `zhaijj/paper-notebook` Fork 为 `shuo456/paper-notebook`，保留纯静态 GitHub Pages 架构和 `papers.json` 数据层，建立以中文为主、面向控制与机器人研究的个人论文库。第一阶段必须在不配置任何 MCP 的情况下可在本地运行；第二阶段再接入 Firecrawl、NotebookLM 和 GitHub 发布自动化。

## 范围

### 包含

- 中文论文列表页与详情页。
- 标题、作者、摘要、标签搜索。
- 期刊或会议、标签、已读和未读组合筛选。
- 排序、展示数量限制、深浅主题与响应式布局。
- 浏览器本地保存阅读状态。
- 统一的 `papers.json` 契约及旧字段兼容。
- 2–3 篇演示论文，不保留原作者的论文数据。
- 面向控制障碍函数、安全控制、安全关键系统、机器人学习和强化学习的论文发现 Skills。
- 论文去重、校验、追加、NotebookLM 关联和发布流程。
- 本地自动测试、浏览器验证、README 和凭证配置说明。

### 不包含

- React、Vite、数据库或后端服务。
- 原仓库的博客、植物基因组文章和相关发现 Skills。
- 跨浏览器或跨设备同步已读状态。
- 未经用户确认的自动提交或推送。
- 仓库内保存 API key、Cookie、OAuth 凭证或本机绝对路径。

## 实施阶段

### 第一阶段：本地静态站与离线维护

完成前端、示例数据、数据校验与追加脚本、测试和本地预览。手工提供论文 URL 或结构化数据时，无需 MCP 即可校验并加入论文库。

### 第二阶段：外部自动化

在第一阶段通过后配置 GitHub、Firecrawl 和 NotebookLM。外部服务故障不得影响本地网站和手工维护流程。

## 仓库与部署结构

Fork 目标为 `shuo456/paper-notebook`，GitHub Pages 从 `main` 分支的 `/docs` 目录发布。

```text
docs/
├── index.html
├── paper.html
├── css/
├── js/
│   ├── config.js
│   ├── paper-core.js
│   ├── app.js
│   ├── paper.js
│   ├── theme.js
│   └── papers.json
tests/
└── paper-core.test.js
.agents/skills/
├── discover-arxiv/
├── discover-journals/
├── discover-conferences/
├── discover-all/
├── add-to-notebook/
├── link-notebooklm/
└── publish-notebook/
```

`config.js` 集中保存站点名称、所有者、GitHub 仓库、研究主题和部署设置。页面资源与详情链接使用相对路径，从本地静态服务器和 GitHub Pages 子路径访问时均不依赖固定用户名。

`paper-core.js` 只包含数据规范化、搜索、筛选、排序和去重等纯函数。`app.js` 与 `paper.js` 只负责页面状态、DOM 渲染和事件绑定。

## 页面设计

### 列表页

- 网站标题为“Shuo Xu 的论文笔记”，界面文案为中文。
- 论文标题、作者、原始摘要及出处名称保留原文。
- 搜索范围包括标题、作者、摘要和标签。
- 出处、标签、已读、未读和深度笔记筛选可以叠加。
- 已读与未读互斥；再次点击已生效的标签可取消，页面同时提供显式清除入口。
- 默认排序为未读优先，其次按 `updatedDate` 或 `addedDate` 从新到旧；可切换最早添加和评分排序。
- 可限制显示 25、50、100 篇或全部。

### 详情页

- 使用 `paper.html?id=<paper-id>` 定位论文。
- 展示标题、作者、出处、年份、评分、DOI、标签、摘要、个人笔记、论文链接和 PDF 链接。
- 有 `notebooklmNotes` 时显示 NotebookLM 深度笔记区域；有 `notebooklmUrl` 时显示外部链接。
- 已读切换与列表页共享同一个 `localStorage` 键。
- 缺少 ID、找不到论文或数据加载失败时显示中文错误状态与返回入口。

### 内容安全

来自 JSON 的普通文本必须转义后写入页面。个人笔记和 NotebookLM 笔记仅支持受控 Markdown 子集，生成 HTML 后进行清理；不允许任意 HTML、脚本、事件属性或危险 URL 协议进入 DOM。

## 数据契约

`docs/js/papers.json` 是论文对象数组。规范对象如下：

```json
{
  "id": "ames2024cbf",
  "title": "Paper title",
  "authors": ["Author One", "Author Two"],
  "venue": "IEEE Transactions on Automatic Control",
  "venueType": "journal",
  "year": 2024,
  "publishedDate": "2024-01-15",
  "doi": "10.xxxx/xxxxx",
  "url": "https://example.org/paper",
  "pdfUrl": "https://example.org/paper.pdf",
  "tags": ["control barrier functions", "safe control"],
  "rating": 4,
  "abstract": "Abstract text.",
  "notes": "## Key findings\n\n- Finding",
  "addedDate": "2026-08-18",
  "updatedDate": "2026-08-18",
  "source": "arXiv",
  "notebooklmUrl": "",
  "notebooklmNotes": ""
}
```

必填字段为 `id`、`title`、`authors`、`venue`、`year`、`tags`、`abstract`、`addedDate` 和 `source`。`authors` 和 `tags` 必须为字符串数组；`rating` 为 0–5 的整数；日期使用 `YYYY-MM-DD`；外部 URL 只接受 `https`。

加载层兼容原仓库的 `journal`、`notebooklm_url` 和 `notebooklm_notes` 字段，并规范化为 `venue`、`notebooklmUrl` 和 `notebooklmNotes`。新写入的数据只使用规范字段。

演示数据包含 2–3 篇公开论文，分别覆盖普通论文、个人笔记和 NotebookLM 深度笔记三种显示状态。NotebookLM 演示链接必须明确标记为示例，不冒充用户的真实笔记。

## 去重与写入

候选论文按以下顺序去重：

1. 完全相同的规范化 `id`。
2. 去除 `https://doi.org/` 前缀并转为小写后的 DOI。
3. 去除标点、合并空白并转为小写后的标题。

若预印本与正式出版版本标题相同，默认保留信息更完整的正式出版记录，并在用户选择阶段提示版本关系。DOI 缺失时使用空字符串，不猜测。

追加脚本先读取并验证完整现有数组，再验证所有候选项。任何候选项存在硬错误时，本次写入整体失败，原文件保持不变。脚本支持 `--dry-run`；实际写入采用临时文件加原子替换，并在同目录生成可恢复备份。成功输出新增、跳过和总数。

## 论文发现 Skills

所有发现 Skills 共享研究主题：

- 控制障碍函数。
- 安全控制。
- 安全关键系统。
- 机器人学习。
- 强化学习。

### `discover-arxiv`

检查 arXiv 的 `cs.RO`、`cs.LG` 和 `eess.SY`。默认仅处理最近 7 天的新提交或更新，输出标题、作者、日期、分类、摘要、arXiv/DOI、页面链接、PDF 链接和相关性说明。

### `discover-journals`

检查 IEEE TAC、Automatica、IEEE RA-L、IEEE T-RO 和 IJRR 的最新论文。抓取失败时记录失败来源并继续其他来源。

### `discover-conferences`

检查 ICRA、IROS、CoRL、RSS、NeurIPS 和 ICML 的最新可用论文集或公开列表。会议尚未发布新论文集时返回明确的空结果，而不是回退到陈旧结果。

### `discover-all`

合并前三类结果，先在候选集内部去重，再与 `papers.json` 去重。按来源分组并使用单一连续编号展示候选。任何单一来源失败不会取消其他来源的结果。

### `add-to-notebook`

只添加用户明确选中的候选论文。补齐规范字段后先运行 dry-run、展示变更摘要，再执行原子追加。该 Skill 不负责推送。

### `link-notebooklm`

按 `id` 或规范化标题定位论文。覆盖已有深度笔记前必须请求确认；生成笔记后先保存为本地草稿供用户审阅，用户确认后才写回 `papers.json`。

### `publish-notebook`

依次运行数据校验、自动测试和本地页面检查。全部通过后展示拟提交文件与提交信息；只有用户明确确认才执行提交和推送。

## MCP 与账号配置

### GitHub

使用 GitHub 账号 `shuo456` 创建 Fork、推送和配置 Pages。Fork 已创建并验证其父仓库为 `zhaijj/paper-notebook`；发布仍需在测试通过且用户确认后执行。

### Firecrawl

期刊和会议自动抓取使用 Firecrawl MCP，需要用户提供 `FIRECRAWL_API_KEY`。密钥只存入本机环境或本机 MCP 配置；仓库只提交无敏感值的示例配置和说明。

### NotebookLM

NotebookLM 关联需要用户的 Google/NotebookLM 登录授权和可用的 NotebookLM MCP。仓库不保存 Google Cookie、会话或 OAuth 凭证。MCP 不可用时，用户仍可手工提供 NotebookLM URL 和 Markdown 笔记。

## 错误处理

- `papers.json` 加载失败：列表页显示中文错误信息和重试建议。
- 数据对象非法：校验命令返回非零状态并列出精确字段路径。
- 重复候选：跳过并说明匹配依据。
- 单一外部来源抓取失败：记录来源、错误类型和时间，继续其他来源。
- NotebookLM 查询失败：重试一次；仍失败则提示手工提供笔记。
- 测试或预览失败：阻止发布，不提交或推送。
- 写入中断：保留原文件和备份，不留下半写 JSON。

## 测试策略

### 自动测试

- 搜索标题、作者、摘要和标签。
- 出处、标签、已读、未读和深度笔记组合筛选。
- 未读优先、日期、评分和展示数量排序行为。
- 原字段到规范字段的兼容转换。
- `id`、DOI 和规范化标题去重。
- 必填字段、数组类型、日期、评分和 URL 校验。
- 非法输入不修改 `papers.json`。
- Markdown 安全处理拒绝脚本、事件属性和危险 URL。

### 浏览器验证

- 本地静态服务器可打开首页与详情页。
- 演示论文的三种状态正确显示。
- 所有筛选、搜索、排序、限制和清除交互正确。
- 已读状态刷新后保留并在两个页面间一致。
- 深浅主题和手机、桌面布局可用。
- 数据加载和论文不存在状态正确。
- 浏览器控制台无错误。

### 部署验证

- GitHub Pages 使用 `main/docs`。
- Pages 子路径下资源、详情链接和返回链接正确。
- README 说明本地运行、数据维护、Skills 和 MCP 配置。
- 仓库敏感信息扫描无 API key、Cookie、OAuth 凭证和本机绝对路径。

## 完成标准

1. `shuo456/paper-notebook` Fork 创建成功。
2. 原作者品牌、论文数据、博客和植物基因组 Skills 已移除。
3. 中文静态站在本地运行，列表、筛选、阅读状态和详情功能通过验证。
4. `papers.json` 只保留 2–3 篇结构完整的演示论文。
5. 数据校验、去重和追加工具通过自动测试。
6. 新 `.agents/skills` 能执行发现、选择、校验、添加、NotebookLM 关联和受控发布流程。
7. Firecrawl 与 NotebookLM 的账号需求和无 MCP 降级路径有完整文档。
8. 用户确认发布后，测试通过的版本推送并启用 GitHub Pages。
