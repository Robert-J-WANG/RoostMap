# RoostMap 开发纲要

> 文档状态：开发基线  
> 文档职责：定义从空项目到公开发布的实施顺序、阶段成果和验收边界  
> 产品依据：`docs/PROJECT_DESIGN.md`  
> 技术依据：`docs/TECHNICAL_SPEC.md`  
> 实践记录：`docs/steps.md`

## 1. 开发目标与边界

RoostMap 采用可运行、可验证、可部署的增量开发方式。每个 Step 交付一个具有独立工程意义的结果，并在同一步加入与该能力匹配的测试和质量门禁。

项目治理文档在正式开发前完成设计，并在 Step 02 随工程目录一起归位和纳入仓库；文档设计过程和工作区清理不单独划分为开发 Step。正式开发从创建 React + TypeScript 应用开始。

开发过程遵循以下原则：

- 先建立可运行的最小应用，再补齐基础配置；
- Git 从第一个可运行工程开始使用；
- CI 在工程质量脚本稳定后建立，CD 在最小应用可以稳定构建时建立；
- 高风险数据、地图和外部服务先验证，再进行完整功能开发；
- 测试、可访问性、隐私和错误状态随功能一起完成；
- `main` 始终保持可构建和可部署；
- 只有当前 Step 在 `docs/steps.md` 中展开具体命令、代码、结果和问题。

## 2. 技术路线

| 领域 | 方案 |
|---|---|
| 前端 | React、TypeScript strict、Vite |
| Node | Node.js 24 LTS；当前基线 24.21.0 |
| 路由与状态 | React Router、TanStack Query、Zustand、React Hook Form、Zod |
| UI | Tailwind CSS、shadcn/ui、Lucide icons |
| 地图与图表 | react-map-gl/maplibre、MapLibre GL JS、MapTiler Cloud、Recharts |
| 数据 | MBIE Rental Bond Data、Stats NZ SA2 2019、版本化静态输出 |
| 服务 | Azure Functions、TravelTime、Supabase |
| 测试 | Vitest、React Testing Library、Playwright、数据 contract 测试、pgTAP |
| 交付 | GitHub Actions、Azure Static Web Apps |

具体职责、配置和安全边界以 `docs/TECHNICAL_SPEC.md` 为准。依赖在其第一次解决实际问题时引入，不在项目创建阶段一次性安装全部技术栈。

## 3. Git 与交付方式

采用稳定 `main`、短期分支和 Pull Request：

```text
main
→ short-lived branch
→ implementation and verification
→ Pull Request + CI + Preview
→ squash merge
→ Production deployment + smoke test
```

- Step 01 在新建工程中初始化 `main` 并建立远程基线。
- 从 Step 02 起，每个独立成果使用短期分支；不维护长期 `develop`。
- 一个 Step 可以包含多个有意义的提交，但不为每个命令或文件创建提交。
- Pull Request 描述当前交付结果、验证证据和已知限制。
- 所有 Git、GitHub、依赖安装、编码、测试和部署操作由项目所有者手动完成。

## 4. 阶段与里程碑

| 阶段 | Steps | 里程碑 |
|---|---:|---|
| 工程与交付基础 | 01–05 | 应用可在 PR 中验证并由 `main` 自动部署 |
| 技术可行性 | 06–08 | 数据、地图、图表和外部服务风险已有真实证据 |
| 数据基础 | 09–11 | 全国版本化数据可重复生成、核查和发布 |
| 核心产品 | 12–16 | 无账户用户可完成发现、分析、规划和比较 |
| 账户与分享 | 17–18 | 用户可跨设备保存并安全分享结果 |
| 发布 | 19–20 | 产品达到公开访问、监控和回滚标准 |

---

## 阶段一：工程与交付基础

## Step 01 · 创建 React + TypeScript 项目

**产出**

一个由 Vite 创建、可以开发运行和生产构建的 React + TypeScript 工程，以及新的本地和远程 Git 基线。

**主要内容**

- 使用当前 Node.js 24 环境创建官方 React + TypeScript 模板。
- 安装模板依赖并理解 `index.html → main.tsx → App.tsx` 的入口关系。
- 验证开发服务器、production build 和本地 preview。
- 在工程存在之后初始化 `main`、建立第一个提交并推送空远程仓库。

**知识点**

Vite 工程入口、依赖与 lockfile、开发构建和生产构建的区别、Git repository 与远程 repository 的关系。

**测试与验收**

- 默认页面可以在开发服务器打开。
- production build 成功，preview 可以读取构建产物。
- Git 只包含应进入项目的文件，不包含依赖目录、构建产物或 secret。
- 本地与远程 `main` 一致。

**Git 边界**

在 `main` 建立一次初始工程提交；后续开发不直接在 `main` 进行。

## Step 02 · 建立项目基础配置

**产出**

一个清除模板示例、目录职责清晰、具备统一代码规范和公开说明的工程基础。

**主要内容**

- 从 `main` 创建 `chore/project-foundation`。
- 清理 Vite 示例资源和样式，保留最小可运行页面。
- 规划完整项目目录边界，并在本地建立完整的前端目录。
- 启用 TypeScript strict，配置 TypeScript 与 Vite 的 `@/` 路径别名，沿用模板生成的 ESLint。
- 建立 `.env.example` 与被 Git 忽略的 `.env.local`，后续按实际集成逐步增加变量。
- 根据真实产物完善 `.gitignore` 和 README，将项目治理文档归位并纳入仓库。

**知识点**

TypeScript 编译边界、路径别名的编译与运行时解析、环境变量公开边界、README 的事实状态、按职责组织项目目录。

**测试与验收**

- 清理后应用仍能运行和构建。
- lint 和 build 可以独立执行并通过；build 中的 `tsc -b` 完成类型检查。
- `.gitignore` 覆盖依赖、构建、测试、环境、原始数据和本地服务产物。
- README 只描述当前已实现状态，并正确链接治理文档。

**Git 边界**

完成基础配置提交并通过 Pull Request 合并到 `main`。

## Step 03 · 建立测试基础

**产出**

与项目规模匹配的单元、组件和浏览器 smoke test 基线。

**主要内容**

- 配置 Vitest 与 React Testing Library。
- 为最小页面编写一个验证用户可见行为的组件测试。
- 配置 Playwright，覆盖首页加载的最小浏览器 smoke test；未知路由在 Step 04 建立路由和 404 后测试。
- 将测试加入统一 `check`，避免重复验证实现细节。

**知识点**

单元、组件与 E2E 测试的职责边界，测试环境与浏览器环境的差异，行为导向断言。

**测试与验收**

`npm run check` 可重复通过 lint、组件测试、production build 和首页浏览器 smoke test；失败信息能够定位到对应测试层。

**Git 边界**

使用独立 `test/foundation` 分支和 Pull Request。

## Step 04 · 建立应用外壳与基础 UI

**产出**

具备路由、全局布局、错误边界、设计 token 和可访问基础组件的最小产品外壳。

**主要内容**

- 引入 React Router，建立当前需要的首页、方法说明占位路由和 404。
- 建立 header、main、footer 与全局错误边界。
- 配置 Tailwind CSS 并初始化 shadcn/ui，在同一步建立基础颜色、排版、间距和响应式设计 token。
- 只加入当前应用外壳需要的 Button、Field、Status/Alert 等组件，不批量生成组件。
- 为 loading、empty 和 error 状态确定统一可访问表达。

**知识点**

SPA 路由、布局与页面边界、design token、shadcn/ui 源码组件的维护边界、语义 HTML、键盘与 focus 管理。

**测试与验收**

路由、404 和错误边界通过组件或浏览器测试；桌面与移动布局可用；键盘焦点清楚可见。

**Git 边界**

使用 `feat/app-shell` 分支和 Pull Request。

## Step 05 · 建立 CI/CD 与首次公网部署

**产出**

Pull Request 自动质量检查和 Preview，`main` 自动部署 Production 的最小闭环。

**主要内容**

- 创建 Azure Static Web Apps 资源和前端最小运行配置。
- 配置 SPA fallback、基础安全 headers 和可用性 smoke test；此时不提前引入业务 Functions。
- GitHub Actions 使用锁定依赖执行 lint、tests 和 build；build 中的 `tsc -b` 完成类型检查。
- Pull Request 生成临时 Preview 并运行 smoke test。
- `main` 合并后自动部署 Production，并配置分支保护、基本日志和回滚入口。

**知识点**

CI 与 CD 的职责、环境变量与 secret、Preview 环境、branch protection、部署与正式发布的区别。

**测试与验收**

故意失败的门禁能阻止合并；Preview 和 Production URL 可访问；SPA 刷新、404、基础 headers 和 smoke test 正常。

**Git 边界**

使用 `ci/initial-delivery` 分支，通过 PR 完成第一次完整交付闭环。

---

## 阶段二：高风险技术可行性

## Step 06 · 验证租金数据与 SA2 关联

**产出**

MBIE 记录与 Stats NZ SA2 2019 可重复关联的证据、最小 contract 和质量报告。

**主要内容**

- 核查真实源文件 schema、分类、无效值、周期和 provisional 状态。
- 验证 `Location Id → sa2Id → geometry`，记录成功、拒绝和未关联数量。
- 从全国结果选择具有代表性的 SA2 样本，不建立城市白名单。
- 用 fixture 固定输入与期望结果。

**知识点**

统计口径、数据 profiling、join 完整性、schema drift、可重复数据验证。

**测试与验收**

相同输入生成相同结果；无效分类和重复键被拒绝；样本可以追踪到官方源记录与边界。

**Git 边界**

使用 `spike/data-join`；PR 保留可复现脚本、fixture 和结论，不提交原始大文件。

## Step 07 · 验证地图、图表与数据分片

**产出**

一个加载真实最小数据切片的地图和历史图表技术样例，以及全国数据加载策略的测量结果。

**主要内容**

- 使用 `react-map-gl/maplibre` 组织 React 地图组件，由 MapLibre GL JS 渲染 SA2 geometry，并验证 feature id 与租金指标一致。
- 使用 Recharts 渲染单一区域季度历史。
- 验证 Region 分片、按需加载、地图交互和图表非视觉替代。
- 测量数据体积、解析时间和基本交互性能。

**知识点**

GeoJSON、坐标系统、专题地图、时序图表、bundle 与数据 payload 的区别。

**测试与验收**

地图和图表使用同一 `sa2Id` 与筛选切片；真实样本显示正确；结论足以确认或调整分片策略。

**Git 边界**

使用 `spike/map-chart`；样例只保留支持后续架构的最小代码。

## Step 08 · 验证外部服务与运行边界

**产出**

TravelTime、Supabase、Azure Functions 和目标托管环境的可行性结论。

**主要内容**

- 核查 managed Functions 支持的 Node runtime、超时、配置与日志限制。
- 验证服务端代理调用 TravelTime、到达时间语义和最小缓存边界。
- 验证 Supabase 本地开发、匿名身份升级、RLS 和 Preview 环境方案。
- 记录免费/付费能力、许可、secret、配额和失败降级路径。

**知识点**

平台 runtime 与本地 runtime 的区别、服务端 secret、第三方 API 配额、身份与授权边界。

**测试与验收**

每项高风险能力都有真实调用或最小实验、明确限制和是否继续采用的结论；技术规范按证据更新。

**Git 边界**

使用 `spike/service-boundaries`；不把真实凭据、临时账号或实验日志提交进仓库。

---

## 阶段三：数据基础

## Step 09 · 建立第一个真实数据纵向切片

**产出**

从官方输入到浏览器展示的最小完整数据链路。

**主要内容**

- 定义正式 TypeScript/Zod contracts 与小型 fixture。
- 转换一个代表性 Region 的区域摘要、geometry、地图指标和单区域历史。
- 建立数据 repository，通过同一 contract 为页面供数。
- 在最小页面显示来源、版本、周期、数值和缺失状态。

**知识点**

数据 contract、ETL 边界、静态数据加载、失败可观测性、纵向切片。

**测试与验收**

fixture、转换、contract 与页面行为测试通过；输入到 UI 的值可逐项追踪；Preview 可验证真实切片。

**Git 边界**

使用 `feat/data-first-slice`，通过 PR 将数据测试加入现有 CI。

## Step 10 · 完成全国数据流水线

**产出**

可重复生成全国可发布 SA2 集合、Region 分片和历史数据的流水线。

**主要内容**

- 完成分类、拒绝、join、geometry、代表点、时区和同比计算。
- 生成 manifest、地理索引、Region summary/map/geometry、SA2 history、search index 和 quality report。
- 建立 source lock、SHA-256、pipeline version 与不可变 release bundle。
- 核查主要城市、较小中心、稀疏区域和 Chatham Islands 代表样本。

**知识点**

确定性构建、数据血缘、地理分片、质量阈值、可回滚数据发布。

**测试与验收**

全部 contract 和质量门禁通过；分片计数一致、无重复 SA2、geometry 有效；同一锁定输入产生相同输出。

**Git 边界**

使用 `feat/national-data-pipeline`；生成的大型生产数据不进入普通功能提交。

## Step 11 · 自动化数据更新与 Methodology

**产出**

可审查的新数据 Pull Request、版本化发布流程和用户可读的方法说明。

**主要内容**

- 建立定期检查、schema 验证、差异报告和数据更新 PR。
- 将成功数据版本发布为不可变 bundle，并记录应用使用的 data version。
- 完成 Methodology 的来源、许可证、公式、缺失值和 provisional 说明。
- 演练回退到上一个通过质量门禁的数据版本。

**知识点**

数据供应链、自动化 PR、人工审批边界、应用版本与数据版本解耦。

**测试与验收**

无变化时不产生无意义更新；schema drift 阻止发布；新旧版本可切换；Methodology 与 manifest 一致。

**Git 边界**

使用 `data/update-workflow`；后续每次数据更新使用独立 `data/*` PR。

---

## 阶段四：核心产品

## Step 12 · 完成区域探索

**产出**

可在全国数据中搜索、浏览、筛选和排序 SA2 的 Explore 页面。

**主要内容**

- 组合 Region 导航、搜索、地图、区域列表和详情入口。
- 同步 URL、地图选择、列表选择、租房类别和排序状态。
- 支持租金、房型、卧室、数据可用性等已定义筛选。
- 完成桌面与移动布局、loading、empty、partial 和 error 状态。

**知识点**

URL 状态、地图与列表协调、派生数据、按需加载、响应式交互。

**测试与验收**

搜索上级地理返回多个独立 SA2；地图与列表数据一致；刷新和分享公开 URL 后状态可恢复。

**Git 边界**

按完整纵向能力使用 `feat/explore`，必要时只在内部拆分易审查的提交。

## Step 13 · 完成区域详情与历史分析

**产出**

Area Detail 页面及可访问的历史租金和 Reported Bonds 图表。

**主要内容**

- 显示区域身份、最新观测、数据周期、provisional 状态和覆盖信息。
- 加载选定切片的季度历史，绘制租金趋势和 Reported Bonds。
- 提供同比、tooltip、文本摘要和数据表替代。
- 处理旧观测、缺失季度、稀疏切片和加载失败。

**知识点**

时序数据、图表语义、可访问数据可视化、旧值与当前值的区分。

**测试与验收**

图表与数据表一致；同比公式经过单元测试；缺失数据不会被连线或错误表述。

**Git 边界**

使用 `feat/area-history`，通过 PR 更新组件、E2E 和视觉检查。

## Step 14 · 完成需求配置、负担能力与本地计划

**产出**

用户可配置住房、收入和通勤参数，查看透明的负担能力结果并主动保存本地计划。

**主要内容**

- 用 schema 驱动 Setup 表单和单人/双人需求。
- 实现租金、现金成本、可选时间成本、比率和剩余金额的纯计算函数。
- 将预算与负担能力接入 Explore 和详情解释面板。
- 建立版本化 PlanRepository、本地保存、恢复和清除流程。
- 完成 Home 的真实产品入口和数据状态说明。

**知识点**

表单 schema、纯函数、货币与比例、敏感状态、本地持久化迁移。

**测试与验收**

边界值和双人计算有单元测试；未保存私人输入不持久化；用户能理解每个结果来自哪些输入。

**Git 边界**

使用 `feat/affordability-plans`；计算与 UI 可以分提交，但在同一功能 PR 内形成完整流程。

## Step 15 · 接入真实通勤

**产出**

从 SA2 代表点到一个或两个工作地点的真实通勤估算及成本结果。

**主要内容**

- 建立受保护的工作地点搜索与路线矩阵 Functions。
- 按工作地点时区解析代表工作日和到达时间。
- 实现区域代表点、请求批次、缓存、配额、错误与降级状态。
- 将通勤时间、距离和费用接入 Explore、Area Detail 和计划计算。

**知识点**

服务端代理、JWT、速率限制、缓存键、时区、外部 API 失败设计。

**测试与验收**

方向固定为 SA2 到工作地点；双人结果正确合并；secret 不到浏览器；mock、API contract 和关键 E2E 通过。

**Git 边界**

使用 `feat/commute`；Functions 与前端在同一 PR 中按契约审查。

## Step 16 · 完成区域比较与生活情景

**产出**

最多四个 SA2 的统一比较，以及同一计划下不同生活情景的成本比较。

**主要内容**

- 建立 Compare tray、比较表、多区域趋势、租金与通勤散点图和年度成本构成。
- 建立 Scenario schema，允许调整工作地点、通勤天数、交通费用和时间价值。
- 保持区域、数据切片、周期、计划和情景的比较口径一致。
- 支持本地保存和恢复比较状态。

**知识点**

多维比较、图表选择、归一化口径、情景建模、复杂状态边界。

**测试与验收**

最多四区限制明确；所有图表有替代数据；切片缺失不会触发隐式回退；关键比较流程通过 E2E。

**Git 边界**

使用 `feat/compare-scenarios`，完成核心产品里程碑 PR。

---

## 阶段五：账户与分享

## Step 17 · 完成永久账户与云端计划

**产出**

用户可自愿注册、登录、升级匿名身份并跨设备同步计划。

**主要内容**

- 通过 migrations 建立业务表、RLS、seed 和本地 Supabase 验证流程。
- 完成 email/password、Google OAuth、身份升级和恢复流程；根据送达率、域名验证、费用和当前服务可用性选择并配置 Supabase custom SMTP provider。
- 在用户确认后把本地计划迁移或合并到云端。
- 完成 Plans 与 Account 页面、导出和账户删除。

**知识点**

Authentication 与 authorisation、RLS、身份关联、同步冲突、数据生命周期。

**测试与验收**

跨用户访问被拒绝；匿名限制有效；升级保留数据；删除流程移除应删除的数据；pgTAP 与 E2E 通过。

**Git 边界**

使用 `feat/cloud-accounts`；数据库 migration 与对应测试不能拆成不可用的独立发布。

## Step 18 · 完成私密分享报告

**产出**

可创建、查看、过期和撤销的只读分享报告。

**主要内容**

- 生成高熵 token，只存 hash，并通过 URL fragment 与 POST resolve 使用。
- 创建最小隐私快照，排除精确收入、工作地点名称和坐标。
- 完成 Share Report 与账户内分享管理。
- 设置 no-referrer、no-store、有效期、撤销和日志脱敏。

**知识点**

Capability URL、hash、只读快照、浏览器 fragment、缓存与 referrer 隐私。

**测试与验收**

token 不进入数据库明文、path、query、referrer 或 telemetry；过期和撤销立即失效；报告口径可追踪。

**Git 边界**

使用 `feat/private-sharing`，通过安全自审后合并。

---

## 阶段六：发布

## Step 19 · 完成发布前质量加固

**产出**

通过性能、可访问性、安全、隐私和观测性门禁的发布候选版本。

**主要内容**

- 完成全局回归、移动端和支持浏览器检查。
- 根据测量优化 bundle、数据加载、地图交互和 Core Web Vitals。
- 完成 WCAG 2.2 AA 检查、图表替代、键盘和 screen reader 流程。
- 检查 headers、RLS、配额、secret、日志脱敏和依赖风险。
- 完善 managed Functions 的 Application Insights、告警、版本信息和 runbook；评估浏览器遥测的实际价值，只在确有需要且隐私过滤验证通过时启用 Web SDK。

**知识点**

发布候选、性能预算、可访问性审计、威胁边界、可观测性与隐私平衡。

**测试与验收**

技术规范中的工程质量门禁全部通过；阻断问题清零；已知限制被清楚记录。

**Git 边界**

使用 `release/hardening`，PR 只包含有证据的修复和必要文档更新。

## Step 20 · 公开发布与回滚演练

**产出**

可通过正式域名访问、可监控、可回滚的 RoostMap 公开版本。

**主要内容**

- 配置 Production 域名、HTTPS、回调地址、邮件、provider licence 和域名限制。
- 发布已批准的应用版本与 data release bundle。
- 运行 Production smoke tests，核查日志、告警和真实关键流程。
- 演练前端、数据和数据库回滚，记录 release 与运行手册。

**知识点**

Production readiness、版本发布、数据与应用版本协调、回滚和事故响应。

**测试与验收**

`docs/TECHNICAL_SPEC.md` 的公开发布门禁全部满足；正式域名流程可用；回滚路径经过真实演练。

**Git 边界**

由通过审核的发布 PR 合并到 `main`，创建正式 release 记录；后续工作继续使用短期分支和同一质量闭环。
