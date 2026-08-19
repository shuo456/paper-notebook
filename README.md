# Shuo Xu 的论文笔记库

一个以中文界面为主的个人论文库，聚焦控制障碍函数、安全控制、安全关键系统、机器人学习和强化学习。网站保持纯 HTML、CSS 与 JavaScript 架构，可直接由 GitHub Pages 托管；论文题名和摘要保留原文。

在线地址：<https://shuo456.github.io/paper-notebook/>

## 本地运行

需要 Python 3 和支持 ES modules 的现代浏览器。Node.js 仅用于运行测试。

```bash
npm run serve
```

浏览器打开 <http://localhost:8000/>。不要直接双击 HTML 文件，因为浏览器会阻止页面读取 `papers.json`。

## 测试

```bash
npm test
```

测试覆盖论文规范化、搜索与组合筛选、排序、安全 Markdown、JSON 校验与原子写入，以及 `.agents/skills` 的确认边界。

## papers.json 数据层

数据文件位于 `docs/js/papers.json`，顶层必须是 JSON 数组。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 稳定且唯一的论文标识 |
| `title` | string | 原始论文标题 |
| `authors` | string[] | 完整作者列表 |
| `journal` | string | 期刊、会议或 arXiv |
| `year` | integer | 发表年份 |
| `publishedDate` | string | `YYYY-MM-DD`，未知时留空 |
| `doi` | string | 纯 DOI，不含网址；未知时留空 |
| `url` / `pdfUrl` | string | HTTPS 论文页与 PDF 地址 |
| `tags` | string[] | 中文或英文主题标签 |
| `rating` | integer | 0–5 |
| `abstract` | string | 原始摘要 |
| `notes` | string | 个人 Markdown 笔记 |
| `addedDate` / `updatedDate` | string | `YYYY-MM-DD`；未更新时后者留空 |
| `source` | string | 元数据来源 |
| `notebooklm_url` | string | HTTPS NotebookLM 地址，未关联时留空 |
| `notebooklm_notes` | string | 审核后的 NotebookLM Markdown 笔记 |

新增时按三级顺序去重：**ID → DOI → 标题**。标题会忽略大小写、标点和多余空格；DOI 会移除网址前缀并转为小写。

## 手动添加论文

先把候选记录保存为一个 JSON 数组，例如临时文件 `new-papers.json`。先试运行：

```bash
python .agents/skills/add_to_notebook/scripts/append_papers.py --papers-json docs/js/papers.json --new-entries new-papers.json --dry-run --date 2026-08-18
```

检查验证和重复报告后，再执行实际追加：

```bash
python .agents/skills/add_to_notebook/scripts/append_papers.py --papers-json docs/js/papers.json --new-entries new-papers.json --date 2026-08-18
```

写入使用同目录临时文件原子替换，并生成 `papers.json.bak` 本地备份。备份和临时凭据不会提交。

## 论文自动化 Skills

仓库提供 7 个工作流。调用示例中的 `$名称` 是技能名：

| Skill | 用途 | 示例 |
|---|---|---|
| `discover-arxiv` | 检查近七天 `cs.RO`、`cs.LG`、`eess.SY` | `使用 $discover-arxiv 查找最近的安全控制论文` |
| `discover-journals` | 检查 TAC、Automatica、RA-L、T-RO、IJRR | `使用 $discover-journals 检查最新期刊论文` |
| `discover-conferences` | 检查 ICRA、IROS、CoRL、RSS、NeurIPS、ICML | `使用 $discover-conferences 查最新会议周期` |
| `discover-all` | 合并三个来源并保留失败状态 | `使用 $discover-all 搜索全部来源` |
| `add-to-notebook` | 把已编号确认的候选安全加入数据层 | `使用 $add-to-notebook 添加第 1、3 篇` |
| `link-notebooklm` | 审核并关联 NotebookLM 深度笔记 | `使用 $link-notebooklm 关联 haarnoja2018sac` |
| `publish-notebook` | 完整验证后准备提交与发布 | `使用 $publish-notebook 准备发布` |

发现流程不会直接写文件；添加流程不会提交或推送；发布流程会在展示测试结果、差异、远程仓库和提交信息后停下，等待明确确认。

## GitHub Pages

在仓库 **Settings → Pages** 中选择 **Deploy from a branch**，来源设置为 `main/docs`。首次部署通常需要几分钟。站点本身不依赖 Node.js、Python 或 MCP。

## Firecrawl（可选）

本地网站和 arXiv 结构化来源不需要 Firecrawl。抓取部分期刊页面时，可在 MCP 客户端的密钥或环境变量设置中配置 `FIRECRAWL_API_KEY`；不要把实际值写入仓库、聊天记录或配置示例。未配置时，`discover-journals` 可以接受用户提供的公开论文网址继续工作。

## NotebookLM（可选）

NotebookLM 自动化需要用 Google 账号完成授权，并由 MCP 客户端保存登录状态。不要提交 cookies、OAuth 令牌或私有笔记内容。如果自动连接不可用，可手动提供 NotebookLM 的 HTTPS 地址和审核后的 Markdown 文件，再通过 `link-notebooklm` 的更新脚本关联。

## 发布安全

发布前必须：

1. 运行 `npm test`；
2. 启动本地站并检查列表页、三个详情页、筛选与移动端布局；
3. 扫描 API key、令牌、cookies、私有网址和本机绝对路径；
4. 展示 `git status --short`、目标分支、远程仓库和拟用提交信息；
5. 获得用户对本次提交与推送的明确确认。

任何差异、分支、远程仓库或提交信息发生变化后，都需要重新确认。默认不会推送。

## 许可证

本项目沿用 [Apache License 2.0](LICENSE)。
