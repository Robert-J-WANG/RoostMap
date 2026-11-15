# RoostMap 技术规范

> 文档状态：开发基线  
>
> 文档职责：定义版本化系统架构、数据 contract、前端边界、V2 API 与数据库、安全、测试和交付约束
>
> 文档边界：不重新定义产品范围，不展开逐步操作，也不记录当前完成状态
>
> 产品范围与业务含义：见 `docs/PROJECT_DESIGN.md`  
> 实施顺序：见 `docs/DEVELOPMENT_OUTLINE.md`  
> 基线日期：2026-11-16

## 0. 技术基线与版本纪律

- 本地前端、数据工具与常规 CI 使用 Node.js 24 LTS；当前确认版本为 `v24.21.0`，npm 为 `11.19.0`。
- 使用 npm 和 `package-lock.json`；依赖升级通过独立、可审查的变更完成。
- V1 是静态数据产品，不建立业务 API、Supabase project、用户数据库或自定义应用服务器。
- V2 才引入 Supabase Auth、PostgreSQL、RLS 和 Azure Static Web Apps managed Functions。
- Functions runtime 在第一个 Functions 切片实施时从 Azure Static Web Apps 当时支持的值中选择，不改变前端 Node 24 基线。
- 不因为未来版本可能需要某项依赖而提前安装、配置或创建目录。

参考：

- [Vite Getting Started](https://vite.dev/guide/)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)
- [Supabase documentation](https://supabase.com/docs)

## 1. 系统与前端架构

### 1.1 V1 系统组成

```text
Official MBIE and Stats NZ files
        │
        ▼
Versioned Node.js data pipeline
        │
        ├── contracts and quality report
        ├── national geography/search index
        └── Region summary/map/geometry/history partitions
                        │
                        ▼
Azure Static Web Apps / CDN
        ├── React application
        └── versioned static rental data
                        │
                        ▼
Browser
        ├── React Router
        ├── TanStack Query
        ├── MapLibre + MapTiler
        └── Recharts
```

V1 的运行时数据读取是公开静态 HTTP GET。筛选、比较和页面状态在浏览器与 URL 中完成。数据处理脚本属于构建和发布工具，不构成常驻后端服务。

### 1.2 V2 系统扩展

```text
Browser
├── V1 static application and rental data
└── Supabase browser client
        ├── Supabase Auth
        └── PostgreSQL through Data API + RLS
                ├── saved_areas
                ├── saved_searches
                └── user_release_state

GitHub Actions data release
└── deploy verified static data bundle and current manifest

Authenticated browser
└── Azure managed Function
        └── delete account with Supabase Auth Admin API
```

普通用户所有权 CRUD 直接经过 Supabase Data API 和 PostgreSQL RLS。Functions 只承担浏览器不能安全完成的特权服务端操作，不为普通 CRUD 重复建立 API 层。

### 1.3 前端技术栈

- React、TypeScript strict 和 Vite。
- React Router 负责集中路由。
- TanStack Query 负责静态数据请求；V2 扩展为云端 server state。
- Zustand 只负责地图交互和 compare tray 等客户端交互状态。
- React Hook Form 与 Zod 只在真实表单边界出现时使用。
- `react-map-gl/maplibre`、MapLibre GL JS 和 MapTiler Cloud。
- Recharts。
- Tailwind CSS、按需加入的 shadcn/ui 源码和 Lucide icons。
- Vitest、React Testing Library 和 Playwright。

依赖按当前功能需要加入。简单结构使用语义化 HTML 和 Tailwind；不围绕 Radix 或 shadcn/ui 再建立第二套组件框架。

### 1.4 状态边界

#### V1 URL state

- Active Region / partition。
- Map centre and zoom。
- Dataset latest period。
- Dwelling Type。
- Bedroom Category。
- Optional Maximum Weekly Rent。
- Selected layer。
- Selected SA2。
- Compared SA2 ids，最多四个。

URL state 必须可验证、可复制和可恢复。V1 不收集私人输入。

#### TanStack Query

V1：

- Manifest。
- Geography/search index。
- Region summary、map 和 geometry。
- Area history。

V2 扩展：

- Saved areas。
- Saved searches。
- User release state。

#### Zustand

- 地图交互状态。
- 当前选择。
- Compare tray。

可以由 URL 或 TanStack Query 表达的状态不重复进入 Zustand。

### 1.5 项目目录边界

V1：

```text
RoostMap/
├── .github/workflows/  GitHub Actions
├── data/               fixture、source lock、contracts 和流水线
├── docs/               设计、规范、纲要和学习笔记
├── public/data/        版本化生成数据
├── src/                React 前端
└── tests/e2e/          Playwright
```

V2 开始时增加 Supabase 文件；真正引入特权操作时再增加 Functions：

```text
supabase/               migrations、seed 和 pgTAP tests
api/                    Azure managed Functions（账户删除切片）
```

前端功能边界：

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── pages/
├── features/
│   ├── areas/
│   ├── compare/
│   ├── explore/
│   ├── saved/          V2
│   └── auth/           V2
├── components/
│   ├── ui/
│   ├── charts/
│   └── layout/
├── data/
├── lib/
├── services/
├── stores/
├── styles/
├── types/
└── test/
```

功能私有组件、schema、service 和 tests 留在 feature 内；只有真实跨功能复用后才移动到 shared boundary。

### 1.6 V1 性能策略

- 构建阶段按官方 Region 分片并简化 geometry，不一次加载全国 SA2 polygons。
- GeoJSON 和 JSON 通过托管平台 gzip/brotli。
- Explore 首次加载 manifest 和紧凑地理/搜索索引；确定 Region 后再加载该 Region 的 summary、map 和 geometry。
- Area Detail 和 Compare 需要历史时再加载相关 Region history。
- 同一资源由 TanStack Query 去重和缓存；不额外建立自定义浏览器缓存层。
- 使用真实构建产物和数据 payload 测量后再优化，不提前加入 worker、IndexedDB 或自定义二进制格式。

## 2. 数据 contract 与流水线

### 2.1 统一位置模型

```ts
export type RentalArea = {
  sa2Id: string;
  name: string;
  regionCode: string;
  regionName: string;
  territorialAuthorityCode: string;
  territorialAuthorityName: string;
};
```

统一规则：

- `sa2Id` 是地图 feature id 和区域业务主标识。
- 租金记录通过 MBIE `Location Id` 关联 `sa2Id`。
- 详情、比较和 V2 saved areas 保存 `sa2Id`。
- 搜索使用官方 SA2、Region 和 territorial authority 名称。
- 上级地理搜索返回其包含的多个独立 SA2，不合并 geometry 或租金指标。
- 同名 SA2 使用 Region 和 territorial authority 标签消歧。
- Region 和 territorial authority 入口由官方上级地理字段生成；代表性城市只用于质量验收，不作为发布白名单。

### 2.2 分类规范

`Dwelling Type` 和 `Number Of Beds` 使用官方源文件中的分类值。

- 原始类别只做精确、版本化映射。
- 完整源值 profiling 后再确定发布分类。
- 指定切片缺失时显示缺失，不回退到其他类别。
- 有效记录复合键为 `period + sa2Id + dwellingType + bedrooms`。
- 重复复合键使构建失败。
- 默认筛选使用 contract 中明确表示全部住宅类型和全部卧室的源分类。

### 2.3 标准化数据模型

```ts
export type RentalObservation = {
  period: string;
  sa2Id: string;
  dwellingType: string;
  bedrooms: string;
  reportedBonds: number | null;
  medianRent: number | null;
  geometricMeanRent: number | null;
};

export type AreaMetricSlice = {
  dwellingType: RentalObservation["dwellingType"];
  bedrooms: RentalObservation["bedrooms"];
  datasetLatestPeriod: string;
  observationPeriod: string | null;
  medianRent: number | null;
  geometricMeanRent: number | null;
  reportedBonds: number | null;
  yearOverYearChange: number | null;
};

export type AreaSummary = RentalArea & {
  metricSlices: AreaMetricSlice[];
};

export type GeographyIndex = {
  regions: Array<{
    code: string;
    name: string;
    partitionId: string;
    territorialAuthorities: Array<{
      code: string;
      name: string;
      sa2Ids: string[];
    }>;
  }>;
};

export type DataManifest = {
  version: string;
  pipelineVersion: string;
  generatedAt: string;
  latestPeriod: string;
  historyStartPeriod: string;
  geographyVersion: "SA2_2019";
  areaCount: number;
  partitionCount: number;
  partitions: Array<{
    id: string;
    name: string;
    areaCount: number;
    summaryUrl: string;
    geometryUrl: string;
    mapUrl: string;
    historyUrl: string;
  }>;
  rentalDataStatus: "provisional" | "final";
  rentalDataNotice: string | null;
  sources: Array<{
    id: "mbie-rental" | "stats-sa2-2019";
    url: string;
    publishedAt: string | null;
    retrievedAt: string;
    licence: string;
    sha256: string;
  }>;
};
```

`generatedAt` 来自锁定的 release metadata，不读取流水线实际运行时钟。`retrievedAt` 同样记录在 source lock 中。因此相同的锁定输入、pipeline version 和 release metadata 必须生成字节一致的 manifest 与数据文件。

### 2.4 数据处理流水线

```text
下载或读取锁定的官方源文件
→ 计算 SHA-256
→ 记录发布日期、下载日期、许可证和 provisional 状态
→ 验证字段和时间范围
→ 规范 Location Id
→ 隔离汇总、无效和异常记录
→ 规范 Dwelling Type 与 Bedroom Category
→ 通过 sa2Id 关联租金和边界
→ 以成功关联且存在有效租金观测的 SA2 建立全国可发布集合
→ 验证 Region 和 territorial authority 层级
→ 转换 geometry 到 WGS84 / EPSG:4326
→ 修复并验证 polygon geometry
→ 计算 12 个月变化
→ 建立全国上级地理与 SA2 搜索索引
→ 按官方 Region 分片并简化 GeoJSON
→ 生成版本化静态数据
→ 生成质量报告
```

原始官方数据保存在 Git 之外。小型 fixture、`data/source-lock.json` 和数据 contract 进入 Git。每次成功数据发布保存不可变 data release bundle，避免来源变化或暂时不可用时无法回滚。

### 2.5 构建输出

```text
public/data/manifest.json
public/data/releases/{version}/manifest.json
public/data/releases/{version}/geographies/index.json
public/data/releases/{version}/areas/summary/{regionCode}.json
public/data/releases/{version}/areas/history/{regionCode}.json
public/data/releases/{version}/maps/{regionCode}.json
public/data/releases/{version}/geometry/regions/{regionCode}.geo.json
public/data/releases/{version}/search/areas.json
public/data/releases/{version}/quality-report.json
```

- 顶层 `manifest.json`：当前数据版本、来源和版本化分片入口；发布时用已验证版本替换，回滚时恢复上一个已验证 manifest。
- `releases/{version}/manifest.json`：随不可变 bundle 保存的同版本 manifest。
- `geographies/index.json`：Region、territorial authority 和分片定位。
- `summary/{regionCode}.json`：区域身份、上级地理和当前 metric slices。
- `history/{regionCode}.json`：以 `sa2Id` 索引的季度观测。
- `maps/{regionCode}.json`：当前 `datasetLatestPeriod` 下该 Region 的紧凑地图指标；历史季度由 history 分片提供，不单独生成历史地图文件。
- `regions/{regionCode}.geo.json`：简化边界和稳定 feature id。
- `search/areas.json`：全国标准化搜索索引。
- `quality-report.json`：流水线发布证据。

`version` 是不可变 release 标识，顶层 manifest 中的所有资源 URL 必须指向同一个版本目录。Region code 是稳定分片键。无法归入普通 regional council 的官方记录使用明确保留分片，不通过自定义城市名称重新分类。生成文件不作为手工维护源文件；大型生产数据不进入普通功能提交。

每个成功 data release bundle 包含锁定输入、source lock、生成数据、quality report、pipeline version 和 SHA-256 清单。保留当前成功生产版本；存在更早的成功生产版本时，同时保留上一个版本用于回滚。

### 2.6 数据质量门禁

发布必须满足：

- 必需字段完整且类型正确。
- Period 格式合法并可排序。
- 允许分类之外的值已隔离。
- 复合键唯一。
- 所有接受发布的 SA2 code 成功关联 geometry。
- 输入、成功、拒绝和未关联数量进入质量报告。
- Region 和 territorial authority 层级通过源 schema 验证。
- 同一 SA2 只属于一个发布分片。
- GeoJSON feature id 唯一，geometry 可加载。
- 分片 area counts 与 manifest 一致，跨分片不存在重复 `sa2Id`。
- 租金和 Reported Bonds 数值范围合法。
- 缺失率、拒绝数和记录数变化产生差异报告。
- 所有输出通过 Zod contract。
- source lock 记录 URL、日期、许可证、状态、SHA-256、pipeline version 和质量摘要。

## 3. V2 身份、数据库与 Functions

本节定义批准的 V2 边界。V1 不创建这里的服务、目录或依赖。

### 3.1 用户访问模型

#### Public user

无需账户即可完整使用 V1，包括 Explore、Area Detail、Compare 和 Methodology。

#### Permanent user

只有用户主动选择跨设备保存时才注册或登录。V2 不使用匿名 Supabase 账户，不自动把公开浏览行为写入数据库。

生产认证方式在 V2 实施时从 Supabase 支持方式中选择一个最小方案，并验证回调、恢复和域名行为。

### 3.2 PostgreSQL tables

#### saved_areas

```text
id uuid primary key
user_id uuid not null references auth.users on delete cascade
sa2_id text not null
dwelling_type text not null
bedroom_category text not null
saved_data_version text not null
saved_observation_period text nullable
created_at timestamptz not null
updated_at timestamptz not null
unique(user_id, sa2_id, dwelling_type, bedroom_category)
```

#### saved_searches

```text
id uuid primary key
user_id uuid not null references auth.users on delete cascade
name varchar(80) nullable
region_code text nullable
dwelling_type text not null
bedroom_category text not null
maximum_weekly_rent numeric nullable check (maximum_weekly_rent >= 0)
sort_key text not null
created_at timestamptz not null
updated_at timestamptz not null
```

#### user_release_state

```text
user_id uuid primary key references auth.users on delete cascade
last_seen_version text nullable
last_seen_latest_period text nullable
updated_at timestamptz not null
```

### 3.3 RLS 与 CRUD

- 所有用户业务表启用 RLS。
- `anon` 不获得用户业务表权限；`authenticated` 只获得当前功能需要的操作权限。
- `saved_areas`、`saved_searches` 和 `user_release_state` 的 SELECT、INSERT、UPDATE、DELETE 分别使用清楚的 owner policy，并显式要求 `auth.uid() IS NOT NULL AND user_id = auth.uid()`。
- 插入和更新同时使用 `WITH CHECK` 验证 owner。
- 浏览器使用 Supabase publishable key 和用户 JWT，不持有 Supabase secret key。
- 所有 schema 变化通过 migration；seed 和 RLS denial 通过本地 reset 与 pgTAP 重现。
- 普通 owner CRUD 直接通过 Supabase Data API，不建立同义 Function endpoint。

### 3.4 Managed Functions

V2 使用 Azure Static Web Apps managed Functions，只使用范围明确的 HTTP triggers。

#### Delete account

```http
DELETE /api/account
Authorization: Bearer <supabase-jwt>
```

流程：

```text
通过 Supabase Auth 在服务端验证 JWT 并取得当前 user id
→ 使用 Auth Admin API 删除当前 Auth user
→ 由外键级联删除用户业务记录
→ 验证账户和关联业务记录已删除
→ 返回成功
→ 前端清除 session
```

删除接口不得接受其他用户 id。失败时返回可解释状态，不记录 token 或私人内容。

### 3.5 应用内数据更新摘要

- 当前版本以静态 `manifest.json` 为来源。
- 用户最后查看版本来自 `user_release_state`。
- 只有两个版本不同时才显示更新入口。
- 用户上次查看的版本和 latest period 来自 `user_release_state`；当前值来自静态 manifest。
- 每个 saved area 以 `last_seen_latest_period` 和自身 `saved_observation_period` 中较晚者作为 baseline。
- 关注区域的指标使用当前发布的同一静态 history contract，按 baseline 和 current latest period 读取和比较。
- 没有 last seen state 时只建立当前基线，不生成变化结论。
- baseline 与 current latest period 相同时不生成该区域的变化结论。
- 两个版本的 latest period 相同时只显示数据修订说明，不计算虚构的期间变化。
- 缺失观测、分类变化和 provisional 状态必须显式表达。
- 用户查看摘要后才同时更新 `last_seen_version` 和 `last_seen_latest_period`。

### 3.6 V2 安全与隐私

- Supabase secret key 只存在 Functions 环境。
- 只有有意公开的配置使用 `VITE_` 前缀。
- API 验证请求方法、认证和当前用户身份，不接受客户端指定待删除用户 id。
- 日志不记录 access token、Supabase secret key 或用户保存内容。
- 用户提供的 Saved 内容只包含数据库 contract 列出的区域、筛选和可选名称；系统元数据限于所有权、记录时间、保存时的数据版本、可用时的观测周期和 release state。
- 账户删除是 V2 上线门禁的一部分。
- Supabase Auth 使用实施时验证过的平台保护和比例适当的 rate limits。

## 4. 交付与运行架构

### 4.1 V1 环境

#### Local

- Node.js 24 LTS。
- Vite。
- 本地 fixture 和范围明确的派生数据。
- 域名限制前的开发 MapTiler key。

#### Preview

- 每个 PR 的 Azure Static Web Apps temporary URL。
- fixture 或批准的派生静态数据。
- Preview MapTiler 配置。
- 外部 fork 不读取 repository secrets。

#### Production

- 自定义域名和 HTTPS。
- 版本化静态应用与 data release bundle。
- 域名受限 MapTiler key。
- Azure Static Web Apps 平台指标和部署日志。

### 4.2 V2 环境扩展

#### Local

- Supabase CLI 提供 PostgreSQL、Auth、PostgREST 和 Studio。
- Local Azure Functions runtime，版本在账户删除切片开始时核查。

#### Preview

- Staging Supabase project。
- Preview Functions settings。
- Synthetic accounts。
- 普通 PR 不共享或修改 production user data。

#### Production

- Production Supabase project。
- Functions 中的 Supabase secret key。
- Supabase logs 与 managed Functions Application Insights。

V2 浏览器配置：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

V2 Functions 配置：

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

### 4.3 Git 策略

- `main` 始终可测试和部署。
- 所有变更从最新 `main` 创建短分支。
- 一个分支交付一个可审查目标。
- required checks 通过后使用 Pull Request 和 squash merge。
- 不维护长期 `develop`。
- 数据更新使用独立 `data/*` 分支和 PR。

### 4.4 CI

| 引入能力 | 对应门禁 |
|---|---|
| TypeScript | production build 中的 `tsc -b` |
| 代码规范 | ESLint |
| 数据计算 | unit tests |
| React 页面 | component tests |
| 用户流程 | Playwright |
| 数据流水线 | fixture、contract、quality tests |
| Supabase V2 | migration reset、seed、pgTAP、RLS denial |
| Functions V2 | API tests 和 Functions build |
| 公网行为 | Preview / Production smoke tests |

CI 使用 `npm ci`。前端、数据工具和常规检查使用 Node 24；V2 Functions job 使用经 Azure 支持列表验证的 runtime major。

### 4.5 CD 与数据交付

PR：

```text
Build and focused tests
→ Generate required fixture assets
→ Deploy temporary Preview
→ Run Preview smoke tests
→ Review and merge
```

Main：

```text
Required checks passed
→ Resolve approved data version
→ Verify bundle manifest and SHA-256
→ Build application
→ Deploy Azure Static Web Apps
→ Run Production smoke tests
→ Record app and data version
```

V2 数据库变更先执行 backward-compatible migration，再部署兼容应用。数据发布仍以静态 bundle、manifest 和 smoke test 为准，不依赖数据库登记。

数据更新：

```text
Check official source
→ Compare source lock
→ Download changed source
→ Run full pipeline
→ Generate QA report and immutable bundle
→ Create data branch and PR
→ CI and Preview
→ Review and merge
→ Main deployment and smoke test
```

### 4.6 公开托管

V1：

```text
Frontend and static data  Azure Static Web Apps
Basemap                  MapTiler Cloud
CI/CD                    GitHub Actions
```

V2 additions：

```text
HTTP API                 SWA managed Azure Functions
Auth and PostgreSQL      Supabase
```

部署配置包括 SPA fallback、`/data/*` 排除规则、安全 headers、MapTiler domain restriction、attribution、robots、sitemap、manifest、favicon 和 Open Graph。V2 再增加 Supabase callback URLs、`/api/*` 规则和 Auth/Account noindex。

### 4.7 Containers

React 和 Functions 不制作自定义应用镜像。V1 不需要本地容器；V2 本地容器只限 Supabase CLI 提供的开发服务。

### 4.8 监控与回滚

V1 监控：

- Static Web Apps 部署和平台指标。
- Production smoke tests。
- Manifest、data partition 和 MapTiler load failures。
- 数据流水线 source version、counts、rejects、join、output size 和 workflow URL。

V2 增加：

- Functions failures 和 latency。
- Auth、database 和 RLS errors。
- Account deletion failures。

浏览器监控 SDK 不属于默认依赖；只有真实故障定位收益高于隐私和维护成本时才评估。

回滚：

- 前端：重新部署稳定 commit 或 release。
- 数据：部署上一个已验证 immutable bundle。
- V2 Functions：重新部署兼容版本。
- V2 database：使用 backward-compatible migration 和 forward-fix，不依赖 destructive rollback。

## 5. 测试与质量门禁

### 5.1 功能切片完成标准

一个功能切片只有同时满足以下条件才完成：

- 验收标准明确，normal、loading、empty、partial 和 error 已处理。
- 业务计算、contract、组件或 API 边界有比例适当的测试。
- 相关关键流程更新 Playwright。
- 桌面和移动行为经过检查。
- 当前 lint、tests、production build 和 CI 通过。
- Preview 自审通过。
- 合并后部署与 smoke test 通过。
- 学习笔记与真实实现一致。

### 5.2 数据验收

- MBIE 与 SA2 2019 可重复关联，全国发布集合不依赖城市白名单。
- Region、territorial authority 和分片可重复生成。
- 主要城市、较小中心、稀疏区域和 Chatham Islands 代表样本通过人工核查。
- 所有发布数据可追踪来源、许可证、状态、校验值和 pipeline version。
- 地图、列表、详情和比较口径一致，缺失季度没有被填补。
- 数据更新通过自动 PR、质量门禁和部署流程。

### 5.3 V1 工程验收

- TypeScript strict、lint、unit/component tests、Playwright 和 build 通过。
- 数据 pipeline 具有 contract 和质量测试。
- URL 状态可恢复且不包含私人数据。
- 地图、图表和列表表达一致。
- 性能预算基于真实 bundle 和 payload 测量。
- Preview 和 Production 可重复部署，静态应用与数据可回滚。

### 5.4 V1 公开发布门禁

- 正式域名、HTTPS、SPA 路由和安全 headers 正常。
- MapTiler domain restriction 和 attribution 生效。
- 数据来源、版本、Methodology 和已知限制可访问。
- 全国数据、关键页面和主要筛选 smoke tests 通过。
- 前端与 data bundle 回滚经过演练。

### 5.5 V2 验收

- migration reset、seed 和 pgTAP 可重复执行。
- 每张用户表启用 RLS，跨用户 CRUD 被拒绝。
- 未登录用户仍能完成全部 V1 流程。
- saved areas 和 saved searches 跨设备 CRUD 正确。
- 更新摘要使用统一数据 contract，缺失值不产生虚构变化。
- account deletion 删除业务数据与 Auth user。
- Functions secrets 不进入浏览器、日志或 artifact。
- V2 Preview、Production 和回滚路径通过对应 smoke tests。

## 6. 固定技术决策

| 领域 | 决策 |
|---|---|
| V1 架构 | React 静态应用 + 版本化静态数据 |
| 前端 | React + TypeScript strict + Vite |
| 包管理 | npm + `package-lock.json` |
| 本地/CI Node | Node.js 24 LTS，当前基线 24.21.0 |
| 路由与状态 | React Router、TanStack Query；Zustand 仅用于地图与比较交互 |
| UI | Tailwind CSS、按需 shadcn/ui、Lucide icons |
| 地图与图表 | react-map-gl/maplibre、MapLibre GL JS、MapTiler Cloud、Recharts |
| 静态数据 | 全国紧凑索引 + Region summary/map/geometry/history 分片 |
| V2 认证与数据库 | Supabase Auth + PostgreSQL + RLS |
| V2 API | Azure Static Web Apps managed Functions，仅用于账户删除等已批准特权操作 |
| V2 云端数据 | Saved areas、saved searches、user release state |
| 测试 | Vitest、React Testing Library、Playwright；V2 加入 pgTAP 和 API tests |
| CI/CD | GitHub Actions + Azure Static Web Apps Preview / Production |
| Git | 稳定 `main` + 短期分支 + Pull Request + squash merge |
| 容器 | V1 无容器；V2 仅 Supabase CLI 本地服务 |
