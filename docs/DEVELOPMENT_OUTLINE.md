# RoostMap 开发纲要

> 文档状态：开发基线  
>
> 文档职责：定义从空项目到 V1、V2 稳定发布的实施顺序、阶段成果和验收边界
>
> 文档边界：不展开逐条命令和完整代码，也不把计划中的 Step 表述为已完成
>
> 产品依据：`docs/PROJECT_DESIGN.md`  
> 技术依据：`docs/TECHNICAL_SPEC.md`  
> 实践记录：`docs/steps.md`

## 1. 开发目标与边界

RoostMap 采用可运行、可验证、可部署的增量开发方式。每个 Step 交付一个具有独立工程意义的结果，并在同一步加入与当前能力匹配的测试和质量门禁。

项目治理文档在正式开发前建立，并在 Step 02 纳入仓库。正式开发从创建 React + TypeScript 应用开始；后续产品边界调整修改开发基线，但不改写 `docs/steps.md` 中已经发生的学习历史。

开发原则：

- 先完成不依赖账户和业务后端的 V1 数据产品。
- V1 稳定上线后才开始 V2 云端关注功能。
- 数据、地图和图表高风险能力先验证，再形成正式纵向切片。
- Supabase、PostgreSQL 和 Functions 只在 V2 的真实功能需要时引入。
- 测试、错误状态、数据限制和交付门禁随功能一起完成。
- `main` 始终保持可构建和可部署。
- 只有当前 Step 在 `docs/steps.md` 中逐步展开。

## 2. 技术路线

实现必须遵循 `docs/TECHNICAL_SPEC.md` 中已经批准的架构和技术边界。本纲要只决定这些能力在什么阶段引入，不重复维护依赖清单或系统 contract。

V1 先完成版本化静态数据与浏览器端产品流程；V2 只在 V1 稳定后引入云端保存所需的身份、数据库和 Functions。依赖在第一次解决当前需求时加入，不为后续 Step 提前建立服务或目录。

## 3. Git 与交付方式

```text
stable main
→ short-lived branch
→ implementation and verification
→ Pull Request + CI + Preview
→ squash merge
→ main deployment + smoke test
```

- Step 01 建立初始 `main` 和远程基线。
- 从 Step 02 起，每个独立成果使用短分支，不维护长期 `develop`。
- 一个 Step 可以包含多个有意义的提交，不为单个命令创建提交。
- Pull Request 记录交付结果、真实验证和已知限制。
- 所有 Git、依赖安装、实现、测试和部署操作由项目所有者手动完成。

## 4. 阶段与里程碑

| 阶段 | Steps | 里程碑 |
|---|---:|---|
| 工程与交付基础 | 01–05 | 应用可在 PR 中验证并由 `main` 自动部署 |
| 高风险技术可行性 | 06–07 | 数据关联、地图、图表和分片有真实证据 |
| V1 数据基础 | 08–10 | 全国版本化数据可重复生成、核查和发布 |
| V1 核心产品 | 11–13 | 用户可探索、分析和比较租赁区域 |
| V1 稳定发布 | 14–15 | V1 通过发布门禁并稳定上线 |
| V2 云端关注 | 16–18 | 用户可跨设备保存并查看数据更新摘要 |

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

完整本地质量门禁可重复通过 lint、组件测试、production build 和首页浏览器 smoke test；失败信息能够定位到对应测试层。

**Git 边界**

使用独立 `test/foundation` 分支和 Pull Request。

## Step 04 · 建立应用外壳与基础 UI

**产出**

具备路由、共享布局、页面错误边界、设计 token 和基础 UI 组件的最小产品外壳。

**主要内容**

- 引入 React Router，建立当前需要的首页、方法说明路由和 404。
- 建立 Header、Main、Footer，以及位于共享布局内部的页面错误边界。
- 配置 Tailwind CSS 并初始化 shadcn/ui，在同一步建立基础颜色、间距和响应式设计 token。
- 只加入当前应用外壳实际使用的 Button 组件，不批量生成组件。
- 为 Home、Methodology、Not Found 和 Route Error 页面建立清晰的页面边界与 title。

**知识点**

SPA 路由、嵌套路由与 Outlet、布局和页面边界、design token、shadcn/ui 源码组件的维护边界、语义 HTML。

**测试与验收**

路由、404 和页面错误边界通过组件或浏览器测试；共享布局在页面错误时保持存在；桌面与移动布局可用。

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

Required checks 处于等待或失败状态时阻止合并；Preview 和 Production URL 可访问；SPA 刷新、404、基础 headers 和 smoke test 正常。

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
- 从 Region 历史分片选择单一 SA2 的季度记录，并使用 Recharts 渲染。
- 验证 Region 分片、按需加载、地图交互和图表非视觉替代。
- 测量数据体积、解析时间和基本交互性能。

**知识点**

GeoJSON、坐标系统、专题地图、时序图表、bundle 与数据 payload 的区别。

**测试与验收**

地图和图表使用同一 `sa2Id` 与筛选切片；真实样本显示正确；结论足以确认或调整分片策略。

**Git 边界**

使用 `spike/map-chart`；提交技术样例代码和部署时实际请求的 Region 派生静态数据，不提交原始数据、全国测量文件或其他生成文件。

---

## 阶段三：V1 数据基础

## Step 08 · 建立第一个正式数据纵向切片

**产出**

从小型官方数据 fixture 到 Explore 最小区域列表、地图和 Area Detail 的第一条正式数据链路。

**主要内容**

- 根据 Step 06–07 证据，只为本步页面定义 TypeScript/Zod contracts：区域信息和默认分类（`ALL / ALL`）的当前租金。
- 转换一个代表性 Region 的 current rents 和 geometry，并作为首个版本化数据切片提交，使 Preview 可以读取。
- 建立 manifest 和 data repository。
- 用同一份当前租金驱动区域列表、地图选择和最小详情。
- 显示来源、数据周期、observation period、provisional 和缺失状态。
- 使 Home 与 Methodology 的公开说明和 V1 产品定位一致。
- 用正式数据页面替代 spike 页面，并移除 spike 路由及其静态数据。

**知识点**

数据 contract、按需演进的数据模型、静态 repository、纵向切片、来源追踪和 UI 数据状态。

**测试与验收**

fixture、transform、contract 和页面测试通过；源值可逐项追踪到 UI；Preview 可验证真实切片。

**Git 边界**

使用 `feat/data-first-slice`。

## Step 09 · 完成全国数据流水线

**产出**

可重复生成全国可发布 SA2 集合、搜索索引、Region 分片和质量报告的数据流水线。

**主要内容**

- 完成分类、拒绝、join、geometry、12 个月变化和缺失处理。
- 扩展 contracts：当前租金覆盖全部发布分类，并加入租金历史。
- 生成 manifest、geography/search index、Region current-rents/geometry/rent-history 和 quality report。
- 建立 source lock、SHA-256、pipeline version 和 immutable release bundle。
- 核查主要城市、较小中心和稀疏区域，并确认 Chatham Islands 等没有 MBIE 观测的区域被正确排除。

**知识点**

确定性构建、数据血缘、地理分片、质量阈值和可回滚数据发布。

**测试与验收**

contracts 和质量门禁通过；分片计数一致、无重复 SA2、geometry 有效；锁定输入可重复生成相同输出。

**Git 边界**

使用 `feat/national-data-pipeline`；大型生成数据不进入普通功能提交。

## Step 10 · 发布首个版本化数据集与 Methodology

**产出**

可部署的首个全国版本化数据 bundle，以及与真实 manifest 一致的 Methodology。

**主要内容**

- 将通过门禁的全国数据打包为 immutable bundle，并由 current manifest 指向该版本。
- 保留 source lock、quality report 和 SHA-256；bundle 通过 data PR 提交，回滚通过 revert 该 PR 完成。
- 完成来源、许可证、指标、缺失值、provisional 和数据质量说明。
- 在 Preview 验证应用能够读取批准的数据版本。

**知识点**

数据发布、应用/数据版本分离、来源归属和可重复部署。

**测试与验收**

bundle、manifest、quality report 和 Methodology 相互一致；锁定输入可重建同一版本；Preview 使用批准版本。

**Git 边界**

使用 `data/first-release`。

---

## 阶段四：V1 核心产品

## Step 11 · 完成区域探索

**产出**

可在全国数据中搜索、浏览、筛选和排序 SA2 的 Explore 页面。

**主要内容**

- 组合 Region 导航、搜索、地图、区域列表和详情入口。
- 同步 URL、视口、选择、Dwelling Type、Bedroom Category、Maximum Weekly Rent、图层和排序。
- 建立统一的分类选择规则，让地图、列表和详情读取同一住宅类型和卧室数的当前租金。
- 支持最新租金、12 个月变化、Reported Bonds 和数据可用性图层/筛选。
- 完成桌面与移动布局及 loading、empty、partial、error。

**知识点**

URL state、地图与列表协调、派生数据、按需加载和响应式交互。

**测试与验收**

上级地理搜索返回独立 SA2；地图与列表一致；缺失值不被视为符合预算；刷新和复制 URL 后状态恢复。

**Git 边界**

使用 `feat/explore`。

## Step 12 · 完成区域详情与历史分析

**产出**

Area Detail 页面及完整的历史租金和 Reported Bonds 解释。

**主要内容**

- 显示区域身份、最新观测、period、provisional 和覆盖信息。
- 绘制 Geometric Mean Rent 与 Reported Bonds 历史。
- 提供 12 个月变化、tooltip、文字摘要和数据表。
- 处理旧观测、缺失季度、稀疏切片和加载失败。

**知识点**

时序数据、图表语义、旧值与当前值、缺失状态和数据解释。

**测试与验收**

图表、文字和数据表一致；12 个月变化公式经过单元测试；缺失季度不连线或错误表述。

**Git 边界**

使用 `feat/area-history`。

## Step 13 · 完成区域比较

**产出**

最多四个 SA2 的统一数据切片比较，并形成完整 V1 用户流程。

**主要内容**

- 建立 compare tray 和 URL compare state。
- 显示当前指标表、多区域历史趋势和 Reported Bonds。
- 统一 Dwelling Type、Bedroom Category、period 和缺失规则。
- 从 Explore、Area Detail 和 Compare 完成加入、移除和返回流程。

**知识点**

多区域比较、时间序列对齐、URL state 和跨页面交互。

**测试与验收**

最多四区限制明确；所有区域口径一致；缺失切片不回退；复制 Compare URL 可以恢复同一结果。

**Git 边界**

使用 `feat/area-compare`。

---

## 阶段五：V1 稳定发布

## Step 14 · 完成 V1 发布前质量加固

**产出**

通过数据、性能、响应式、安全和可解释性门禁的 V1 release candidate。

**主要内容**

- 完成 V1 全局回归和桌面/移动检查。
- 根据真实 bundle、payload 和 Core Web Vitals 优化必要瓶颈。
- 核查 URL、headers、MapTiler key、attribution 和依赖风险。
- 校对产品措辞，确保页面准确表达 V1 的证据范围。
- 建立定期 source check、schema 验证、差异报告和数据更新 PR。
- 完成 production data bundle，并在 Preview 演练应用与数据回滚。

**知识点**

Release candidate、性能预算、数据维护、安全 headers 和运行准备。

**测试与验收**

V1 技术规范门禁全部通过；无来源变化时不产生更新 PR，schema drift 阻止数据发布；阻断问题清零；已知限制可查；Preview 完成最终自审。

**Git 边界**

使用 `release/v1-hardening`。

## Step 15 · 稳定发布 V1

**产出**

通过正式域名访问、可监测、可回滚的 RoostMap V1。

**主要内容**

- 发布批准的应用版本和 immutable data bundle。
- 验证域名、HTTPS、SPA route、MapTiler restriction 和数据 attribution。
- 运行 Production smoke tests。
- 在 Production 演练前端和数据回滚并记录 release。
- 在 V1 稳定后形成是否开始 V2 的明确决定。

**知识点**

Production readiness、版本协调、smoke test、release 和回滚。

**测试与验收**

V1 公开发布门禁全部满足；正式域名核心流程可用；回滚路径经过验证。

**Git 边界**

使用通过审核的 V1 release PR；后续修复继续使用短分支。

---

## 阶段六：V2 云端关注

V2 是一个完整产品版本，但仍按可审查的功能切片实施。只有 V1 稳定上线后才开始。

## Step 16 · 建立云端关注纵向切片

**产出**

永久用户可以登录，并在 PostgreSQL 中跨设备 CRUD 自己的第一个 saved area。

**主要内容**

- 验证 V2 时点的 Supabase Auth、CLI 和 Preview 边界。
- 建立 Supabase migrations、seed 和 pgTAP。
- 建立最小永久认证流程，不使用匿名账户。
- 建立 `saved_areas`、owner RLS 和前端 CRUD。
- 未登录用户继续完整使用 V1。

**知识点**

Authentication、authorisation、PostgreSQL migration、RLS、Data API 和 server state。

**测试与验收**

跨用户访问被拒绝；owner CRUD 正确；session 变化可处理；V1 不被登录墙阻断。

**Git 边界**

使用 `feat/cloud-watchlist`。

## Step 17 · 完成 V2 保存与数据更新

**产出**

完整的 saved areas、saved searches、应用内数据更新摘要和账户删除。

**主要内容**

- 建立 `saved_searches` 和 `user_release_state`。
- 完成 Saved 与 Account 页面。
- 使用统一 rent history contract 比较 last seen 与 current data version。
- 核查 managed Functions 当时支持的 runtime、HTTP trigger 和本地/Preview 边界。
- 建立受保护的账户删除 Function。
- 完成清除全部云端数据和 session 的行为。

**知识点**

Supabase server secret、数据版本协调、账户生命周期和 Functions 失败处理。

**测试与验收**

Saved CRUD、RLS、更新摘要和账户删除通过 migration、pgTAP、API、component 和 E2E 测试。

**Git 边界**

按可审查纵向能力使用短分支；V2 milestone 只有所有切片共同通过后才完成。

## Step 18 · 稳定发布 V2

**产出**

在不削弱 V1 公开流程的前提下，稳定运行的 RoostMap V2 云端关注版本。

**主要内容**

- 完成 Auth、RLS、Functions、数据版本和账户删除的发布前回归。
- 配置 Production Supabase callbacks、Functions settings 和 monitoring。
- 应用 backward-compatible migrations，部署应用与 Functions。
- 运行 public V1 与 authenticated V2 smoke tests。
- 演练应用、Functions 和数据库 forward-fix 路径。

**知识点**

Full-stack release、migration compatibility、secret boundary、monitoring 和 incident recovery。

**测试与验收**

V2 技术规范门禁全部满足；未登录 V1 与登录 V2 均可用；跨用户隔离、数据删除和回滚路径经过验证。

**Git 边界**

使用 V2 release PR 和正式 release 记录。
