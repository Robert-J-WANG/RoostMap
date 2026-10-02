# RoostMap 技术规范

> 文档状态：开发基线  
> 文档职责：定义系统架构、数据 contract、前端边界、API、身份与数据库、安全、测试和交付约束  
> 文档边界：不重新定义产品范围，不展开逐步操作，也不记录当前完成状态
> 产品范围与业务含义：见 `docs/PROJECT_DESIGN.md`  
> 实施顺序：见 `docs/DEVELOPMENT_OUTLINE.md`  
> 基线日期：2026-10-01

## 0. 技术基线

- 本地前端、数据工具与常规 CI 使用 Node.js 24 LTS；当前确认版本为 `v24.21.0`，npm 为 `11.19.0`。
- Vite 的最低兼容版本不是项目必须降级到的版本；实际依赖以创建项目时生成的 `package.json` 和 `package-lock.json` 为准。
- Azure Static Web Apps managed Functions 的 runtime 独立遵循 Azure 的受支持值。基线日期的官方配置表列出 `node:22`、尚未列出 `node:24`，所以 Functions 可行性步骤必须再次核查并记录选择，不能据此把整个项目改为 Node 22。
- 不在设计阶段锁定第三方包的小版本；安装后由 lockfile 固定可重复构建版本。

参考：

- [Vite Getting Started](https://vite.dev/guide/)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [Azure Static Web Apps runtime configuration](https://learn.microsoft.com/azure/static-web-apps/configuration#select-the-api-language-runtime-version)

## 1. 系统与前端架构

### 1.1 系统组成

```text
Browser
├── React application
├── Versioned static rental data
├── react-map-gl/maplibre + MapLibre + MapTiler
└── Supabase browser client
        │
        ├── Supabase Auth and PostgreSQL
        │
        └── Azure Static Web Apps /api
                ├── TravelTime proxy
                ├── Share API
                ├── Maintenance cleanup job
                └── Health endpoint
```

### 1.2 前端技术栈

- Node.js 24 LTS；当前开发基线为 24.21.0。
- npm 与 lockfile。
- React。
- TypeScript strict。
- Vite。
- ESLint。
- React Router。
- TanStack Query。
- Zustand。
- React Hook Form。
- Zod。
- react-map-gl，使用 `react-map-gl/maplibre` 入口。
- MapLibre GL JS。
- MapTiler Cloud。
- Recharts。
- Tailwind CSS。
- shadcn/ui，按当前功能需要将组件源码加入仓库。
- Lucide icons。
- Vitest。
- React Testing Library。
- Playwright。

依赖版本在首次安装时锁定到 `package-lock.json`。升级通过独立 PR 完成。

UI 以 Tailwind CSS 负责样式与设计 token，shadcn/ui 提供可访问组件源码，Lucide 提供图标。shadcn/ui 组件按功能需要逐个加入并由项目维护；简单结构继续使用语义化 HTML 和 Tailwind。Radix 只在所选 shadcn/ui 组件内部需要时作为依赖出现，不单独建立一套底层组件系统。

### 1.3 状态边界

#### URL

- Active Region / partition。
- Map centre and zoom。
- Dataset latest period。
- Dwelling type。
- Bedrooms。
- 可公开的 budget 和 commute limit filters。
- Selected layer。
- Compared SA2 ids。

收入、精确工作地点、停车费、时间价值和完整计划不进入 URL。

#### TanStack Query

- Manifest。
- Area summaries。
- Area history。
- Route estimates。
- Cloud plans。
- Share reports。

#### Zustand

- 地图交互。
- 当前选择。
- Compare tray。
- Scenario draft。
- Guest plan。

#### React Hook Form + Zod

- Setup。
- Auth。
- Scenario editing。
- Account settings。
- Share settings。

#### Local storage repository

- 通过版本化 `PlanRepository` 接口保存少量本地计划。
- 未保存的 Setup/Scenario draft 只保存在内存，不自动写入持久化存储。
- 用户明确选择 Save locally 后，首发实现才使用 localStorage，包含 schema version、迁移和容量/写入错误处理。
- 保存前说明计划可能包含收入、工作地点标签/坐标等私人数据；localStorage 仅表示数据留在该浏览器，并非加密保险库。
- Plans 提供单项删除和 Clear all local data；共享设备提示不会被描述为安全隔离。
- 只在真实数据规模证明 localStorage 不足时更换存储实现。

### 1.4 项目目录边界

```text
RoostMap/
├── .github/workflows/  GitHub Actions
├── api/                Azure Static Web Apps managed Functions
├── data/               数据源记录、fixture 和数据流水线
├── docs/               项目设计、技术规范、开发纲要和学习笔记
├── public/data/        数据流水线生成的版本化公开数据
├── src/                React 前端源码
├── supabase/           migrations、seed 和数据库测试
└── tests/e2e/          Playwright 浏览器测试
```

工具管理或生成的目录在对应开发步骤中建立。前端源码目录在项目基础配置阶段按以下边界规划；没有真实文件的本地空目录不使用占位文件进入 Git。

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── config/
├── pages/
├── features/
│   ├── auth/
│   ├── areas/
│   ├── affordability/
│   ├── compare/
│   ├── commute/
│   ├── explore/
│   ├── plans/
│   ├── scenarios/
│   └── sharing/
├── components/
│   ├── ui/
│   ├── charts/
│   └── layout/
├── data/
├── hooks/
├── lib/
├── services/
├── stores/
├── styles/
├── types/
└── test/
```

功能私有组件、schema、service 和 tests 留在 feature 内；真正跨功能复用的内容进入 shared 目录。

### 1.5 Azure Functions API

使用 Azure Static Web Apps managed Functions，固定挂载 `/api`，只使用 HTTP triggers。Functions runtime 按实施时 Azure Static Web Apps 官方支持列表配置；它与前端本地开发的 Node 24 基线分别记录。

来源：[Azure Static Web Apps Functions](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions)、[Runtime Configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration)

#### 工作地点搜索

```http
POST /api/locations/search
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "query": "<query>"
}
```

精确工作地点不得放入浏览器 URL、query string 或遥测属性。Functions 验证 body schema 和长度，调用 provider 时固定 `within.country=NZ` 和受控 `limit`，并对日志进行脱敏。前端使用 300 ms debounce、`AbortController` 和递增请求序号，取消旧请求并丢弃乱序响应；`sessionId` 不进入 contract。

#### 路线矩阵

```http
POST /api/routes/matrix
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "workplace": {
    "latitude": -41.2866,
    "longitude": 174.7756,
    "timeZone": "Pacific/Auckland"
  },
  "candidateSa2Ids": ["<sa2Id>"],
  "travelMode": "driving",
  "typicalDayOfWeek": "Tuesday",
  "desiredArrivalTime": "08:30"
}
```

流程：

```text
验证 JWT
→ 验证请求 schema、坐标范围和允许的 New Zealand 时区
→ 应用 user/IP rate limit
→ 查找许可期限内的 route cache
→ 合并未缓存组合
→ 将 SA2 代表点作为 departures、工作地点作为 arrival
→ 解析工作地点时区中的下一次目标到达日期时间
→ 调用 TravelTime Matrix `arrival_searches`
→ 标准化错误和结果
→ 按许可写入缓存
→ 返回结果和 attribution
```

路线端点使用 40 秒应用超时预算，在 Azure Static Web Apps 45 秒平台上限之前中止 provider 请求并返回标准化超时错误。

#### 分享管理

```http
POST   /api/shares
Authorization: Bearer <permanent-user-supabase-jwt>

POST   /api/shares/resolve
Content-Type: application/json

{
  "token": "<share-token>"
}

DELETE /api/shares/:id
Authorization: Bearer <permanent-user-supabase-jwt>
```

创建和撤销要求永久用户 JWT。公开解析端点使用 IP quota、输入长度限制和 `Cache-Control: no-store`。分享 token 只出现在 `/share#token=<token>` 的 fragment 和 resolve request body 中，不进入 path、query string、referrer 或遥测属性。

#### 账户删除

```http
DELETE /api/account
Authorization: Bearer <supabase-jwt>
```

要求永久用户的有效 JWT 和近期重新认证，先删除或匿名化用户业务数据，再通过 service role 删除 Auth user。返回后清除本地 session，全流程有失败处理和审计摘要，不记录私人内容。

#### 维护清理

```http
POST /api/jobs/maintenance
```

由定时 GitHub Actions 使用独立 job secret 调用。任务删除已过期的 route cache 和 API usage windows，并且只删除超过保留期、仍为匿名且没有业务数据的账户。任务幂等，只记录不含个人信息的清理数量。

#### 健康检查

```http
GET /api/health
```

返回应用、Functions 和数据版本，不返回密钥或用户信息。

### 1.6 TravelTime

TravelTime 用于 New Zealand 工作地点搜索和路线矩阵，支持驾车、公共交通、骑行和步行。

- 请求通过 Functions 发出。
- Matrix 使用 `arrival_searches`，以候选 SA2 代表点为 departure locations、工作地点为单一 arrival location。
- 用户输入 day of week 和本地到达时间；Functions 按工作地点时区解析下一次对应日期时间，并把实际请求时间返回页面。
- 凭据不进入浏览器。
- 免费 key 只用于内部评估。
- 公开产品使用 Production licence。
- 缓存范围和期限遵守 Production Order。
- 页面显示规定 attribution。
- 上线前使用多个 Region、南北岛主要城市和一个较稀疏区域的典型地址抽样验证四种交通方式。
- 工作地点选择结果标准化为 label、coordinates 和 time zone；Functions 只接受受支持的 New Zealand 时区，并校验 Chatham Islands 的坐标与 `Pacific/Chatham` 是否一致。
- 通勤请求使用工作地点对应的 IANA 时区；`Pacific/Chatham` 路径单独验证，未通过前不发布该区域的时间相关结果。

来源：[TravelTime Matrix](https://docs.traveltime.com/api/overview/travel-time-distance-matrix)、[Supported Countries](https://docs.traveltime.com/api/overview/supported-countries)、[Attribution](https://docs.traveltime.com/api/overview/attribution)、[Terms](https://traveltime.com/terms-of-service)

### 1.7 认证邮件

Supabase 生产认证通过自定义 SMTP 发送邮箱验证、密码恢复和账户安全邮件。SMTP provider 不在项目初期固定；在账户功能开发阶段根据送达率、域名验证、费用和当时的服务可用性选择兼容供应商。认证邮件不用于租金更新营销或摘要通知。

- 本地使用 Mailpit。
- Staging 使用受控测试发件身份。
- Production 使用已验证域名和 TLS。
- SMTP 凭据只保存在 Supabase Auth 配置和所选 provider 中，不进入浏览器、Git 或普通日志。

来源：[Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

### 1.8 性能策略

- 构建阶段按官方 Region 分片并简化 geometry，不一次加载全国 SA2 polygons。
- GeoJSON 使用 gzip/brotli。
- Explore 首次只加载 manifest 和全国紧凑地理/搜索索引；存在默认或已选择 Region 时才加载该 Region 的 summary、map data 和 geometry。
- Area Detail 按 `sa2Id` 懒加载 history。
- Compare 并行加载 2–4 个区域。
- 静态数据使用版本化 URL 和长期缓存。
- manifest 使用短缓存发现新版本。
- 地图、图表、账户和报告按路由拆包。
- 测量最大 Region 分片、代表性主要城市和稀疏区域的真实渲染性能；只在指标不达标时引入虚拟化或进一步拆分。
- 路线矩阵只处理初筛候选。
- 地图指标通过 feature-state 更新。

目标：

- LCP 不高于 2.5 秒。
- 常规交互 INP 不高于 200 毫秒。
- 首次地图加载有明确进度。
- 筛选更新保持即时反馈。

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
  urbanAreaCode: string | null;
  urbanAreaName: string | null;
  urbanRuralIndicator: string | null;
  timeZone: "Pacific/Auckland" | "Pacific/Chatham";
  centroid: {
    latitude: number;
    longitude: number;
  };
};
```

统一规则：

- `sa2Id` 是地图 feature id 和业务主标识。
- 租金记录通过 `Location Id` 关联 `sa2Id`。
- 路由、比较、收藏、情景和分享保存 `sa2Id`。
- 搜索使用官方 SA2、Region、territorial authority，以及源文件中经过验证的 urban area 名称进行标准化精确、前缀和包含匹配。
- 搜索上级地理名称时返回其包含的多个独立 SA2，不合并 SA2 geometry 或租金指标。
- 同名 SA2 使用 Region 和 territorial authority 标签消歧。
- 主要城市入口由官方上级地理字段生成，用作导航和重点验收，不作为发布白名单。
- 代表点使用 polygon 内部点算法，确保坐标位于区域内部。

### 2.2 分类规范

Dwelling Type 允许值：

```text
ALL
Apartment
Boarding House
Flat
House
Room
```

Bedroom Category 允许值：

```text
ALL
1
2
3
4
5+
NA
```

处理规则：

- 原始类别只做精确映射。
- `NULL`、`-99` 和空 Location Id 不进入发布数据。
- `0`、`5`、`6`、`7`、`8`、`9`、`15` 等不等同于来源中的 `5+` 汇总类别，进入 rejected records。
- 有效记录复合键为 `period + sa2Id + dwellingType + bedrooms`。
- 重复复合键使构建失败。
- 指定数据切片缺失时显示缺失状态，不回退到其他房型或卧室类别。
- 默认切片为 `dwellingType=ALL`、`bedrooms=ALL`。

### 2.3 标准化数据模型

```ts
export type RentalObservation = {
  period: string;
  sa2Id: string;
  dwellingType:
    | "ALL"
    | "Apartment"
    | "Boarding House"
    | "Flat"
    | "House"
    | "Room";
  bedrooms: "ALL" | "1" | "2" | "3" | "4" | "5+" | "NA";
  reportedBonds: number;
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

export type AreaSummary = {
  sa2Id: string;
  name: string;
  regionCode: string;
  regionName: string;
  territorialAuthorityCode: string;
  territorialAuthorityName: string;
  urbanAreaCode: string | null;
  urbanAreaName: string | null;
  urbanRuralIndicator: string | null;
  timeZone: "Pacific/Auckland" | "Pacific/Chatham";
  centroid: {
    latitude: number;
    longitude: number;
  };
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
    urbanAreas: Array<{
      code: string;
      name: string;
      indicator: string;
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
    mapUrlTemplate: string;
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
→ 验证 Region、territorial authority、urban/rural 和时区层级
→ 转换 geometry 到 WGS84 / EPSG:4326
→ 修复并验证 polygon geometry
→ 计算区域内部代表点
→ 计算 12 个月变化
→ 建立全国上级地理与 SA2 搜索索引
→ 按官方 Region 分片并简化 GeoJSON
→ 生成版本化静态数据
→ 生成质量报告
```

原始官方数据保存在 Git 之外。小型测试 fixture、`data/source-lock.json` 和数据 contract 进入 Git。生产数据优先由锁定来源和 pipeline version 重建；每次成功数据发布同时保存不可变 data release bundle，避免官方下载地址变化或暂时不可用时无法回滚。

### 2.5 构建输出

```text
public/data/manifest.json
public/data/geographies/index.json
public/data/areas/summary/{regionCode}.json
public/data/areas/{sa2Id}/history.json
public/data/periods/{period}/{regionCode}/map.json
public/data/geometry/regions/{regionCode}.geo.json
public/data/search/areas.json
public/data/quality-report.json
```

职责：

- `manifest.json`：当前数据版本和来源校验信息。
- `geographies/index.json`：Region、territorial authority、经过验证的 urban area 和 SA2 层级，以及分片定位信息。
- `summary/{regionCode}.json`：该 Region 内的区域身份、上级地理、时区、代表点和当前周期 metric slices。
- `history.json`：单个 SA2 的完整季度观测。
- `{regionCode}/map.json`：该 Region 当前周期按复合筛选键组织的紧凑指标。
- `regions/{regionCode}.geo.json`：该 Region 的名称、`sa2Id`、上级地理标识和简化边界。
- `search/areas.json`：全国 SA2 与经过验证的上级地理名称标准化搜索索引。
- `quality-report.json`：流水线发布证据。

Region code 作为稳定分片键；无法归入普通 regional council 的官方记录使用明确的保留分片，不通过自定义城市名称重新分类。territorial authority 和 urban area 是 Region 下并列的官方导航维度，不把 urban area 强制归入某个 territorial authority；跨 Region 的同一官方 urban area 可在相关分片保留相同 code 和各自的 SA2 membership。全国索引保持紧凑，Explore 只加载当前 Region 的 summary、map 和 geometry。用户从搜索结果进入其他 Region 时切换分片。

生成文件不作为手工维护源文件，也不提交到普通功能分支。每个成功的数据版本生成不可变 data release bundle，包含锁定的原始输入、`source-lock.json`、生成的 `public/data`、quality report、pipeline version 和 SHA-256 清单。main 部署记录 bundle id；至少保留当前和上一个成功生产版本，正式 release 将对应 bundle 作为长期 release artifact 保存。

### 2.6 数据质量门禁

发布必须满足：

- 必需字段完整且类型正确。
- Period 格式合法并可排序。
- 允许分类之外的值已隔离。
- 复合键唯一。
- 排除明确无效 Location Id 后，所有接受发布的 SA2 code 成功关联边界。
- 可发布集合规则固定为“存在有效 MBIE 观测并成功关联 SA2 geometry”，输入、成功、拒绝和未关联数量进入质量报告。
- Region、territorial authority 和可用的 urban/rural 层级通过源 schema 验证；同一 SA2 只属于一个发布分片。
- GeoJSON feature id 唯一。
- 各分片 `areaCount` 之和与 manifest `areaCount` 一致，跨分片不存在重复 `sa2Id`。
- Geometry 可加载且代表点位于 polygon 内。
- 租金和 Reported Bonds 数值范围合法。
- 缺失率、拒绝数和记录数变化产生差异报告。
- 所有输出通过 Zod contract。
- `data/source-lock.json` 记录 URL、发布与下载日期、周期、许可证、数据状态、SHA-256、pipeline version 和质量摘要。

## 3. 身份、数据库与安全

### 3.1 用户访问模型

#### Public

可以访问 Home、Explore、Area Detail、基础 Compare 和 Methodology。

#### Anonymous authenticated user

用户第一次使用工作地点搜索或路线功能时，先通过 Cloudflare Turnstile，再调用 `signInAnonymously()`。匿名用户获得唯一 user id 和 JWT，用于配合 user/IP quota 保护高成本 API，但计划继续保存在本地。JWT 只提供身份，不单独视为防滥用措施。

#### Permanent user

云端保存、跨设备同步和私密分享要求永久账户。

### 3.2 匿名身份升级

Supabase 项目必须启用 manual identity linking。

- Email/password：先验证邮箱，再设置密码。
- Google OAuth：使用 `linkIdentity()`。
- 升级后保留原 user id。
- 登录已有账户时，本地计划由用户确认后合并。
- RLS 使用 JWT `is_anonymous` 区分匿名和永久用户。

来源：[Supabase Anonymous Sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)、[Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)

### 3.3 数据库表

```text
profiles
plans
scenarios
saved_areas
share_links
route_cache
api_usage_windows
```

#### profiles

```text
id uuid primary key references auth.users
display_name nullable
created_at
updated_at
```

认证邮箱以 `auth.users` 为准，不在 profiles 重复存储。

#### plans

```text
id uuid primary key
user_id uuid
name
schema_version
requirements jsonb
active_scenario_id uuid nullable
created_at
updated_at
```

#### scenarios

```text
id uuid primary key
plan_id uuid
name
inputs jsonb
calculation_snapshot jsonb
data_version
created_at
updated_at
```

#### saved_areas

```text
id uuid primary key
plan_id uuid
sa2_id text
saved_period
saved_median_rent
saved_data_version
created_at
unique(plan_id, sa2_id)
```

#### share_links

```text
id uuid primary key
plan_id uuid
owner_id uuid
token_hash text unique
snapshot jsonb
expires_at
revoked_at
created_at
```

#### route_cache

```text
cache_key text primary key
provider text
workplace_geohash text
sa2_id text
sa2_point_version text
travel_mode text
direction text check (direction = 'sa2_to_workplace')
typical_day_of_week text
desired_arrival_time text
effective_arrival_at timestamptz
workplace_time_zone text
distance_meters integer nullable
duration_seconds integer
calculated_at
expires_at
```

#### api_usage_windows

```text
key_hash text
window_start timestamptz
request_count integer
expires_at timestamptz
primary key(key_hash, window_start)
```

### 3.4 RLS 与数据库规则

- 所有用户业务表启用 RLS。
- 永久用户只能访问属于 `auth.uid()` 的记录。
- 匿名用户属于 `authenticated` role，限制规则必须检查 `is_anonymous`。
- 匿名用户不直接写入 plans 和 shares。
- `route_cache` 与 `api_usage_windows` 只允许 service role。
- 每张用户表先定义 owner access 的 permissive policy，再使用 restrictive policy 限制匿名账户或特定操作；不创建没有任何 permissive policy 配合的孤立 restrictive policy。
- 所有 schema 变化通过 migration。
- migration、seed 和 RLS 通过本地 reset 与 pgTAP 重现。

### 3.5 分享安全

- 创建高熵随机 token。
- 数据库只存 token hash。
- 分享内容是生成时的只读快照。
- 默认不包含精确收入、工作地点名称和坐标，只保留解释结果必需的区间或通勤指标。
- 支持有效期和撤销。
- token 使用 URL fragment 和 POST body 传递，Functions 验证 token hash 后读取。
- Share 页面使用 `Referrer-Policy: no-referrer`；resolve 响应使用 `Cache-Control: no-store`。
- CDN、Functions 和浏览器遥测不记录原始 token；测试验证 token 不出现在 path、query、referrer 或自定义 telemetry properties。

### 3.6 隐私和 API 安全

- 收入、工作地点和计划视为私人数据。
- 云端保存由用户主动触发。
- 未保存的计划不写入 localStorage；本地保存前说明浏览器存储不加密，并提供 Clear all local data。
- route cache 只保存取整 workplace geohash，不保存完整地址或工作地点名称。
- route cache 键包含 workplace geohash、SA2 代表点版本、固定方向、交通方式、代表工作日、到达时间、effective arrival datetime 和工作地点时区，TTL 遵守 provider licence。
- 工作地点查询通过 POST body 传输，不进入 URL、query string、referrer 或自定义遥测属性。
- rate-limit key 使用 user id 或截断 IP 的 keyed hash。
- 日志不记录完整地址、收入、access token 或 secret。
- 用户可以导出和删除个人数据。
- API 限制输入大小、区域数量、请求频率和超时。
- service role、TravelTime 和 job secrets 只存在于 Functions。
- 浏览器 MapTiler key 使用域名限制。
- 分享、数据更新和匿名账户清理任务必须幂等。
- 公开匿名认证前启用 Cloudflare Turnstile、Supabase Auth rate limit 和路线 API user/IP quota。
- 匿名账户按保留期清理，清理条件必须确认账户仍为匿名且没有需要保留的业务数据。

## 4. 交付与运行架构

### 4.1 环境

#### Local

- Node.js 24 LTS（前端、数据工具和 CI 基线）。
- Vite。
- Local Azure Functions。
- Local Supabase containers。
- Test MapTiler key。
- Mock TravelTime 默认开启。
- Mailpit。

#### Preview

- 每个 PR 的 Azure SWA temporary URL。
- 共用一个 Staging Supabase project。
- 普通 PR 使用本地 migration tests，不修改 staging schema。
- 数据库变更 PR 串行重建 staging 并部署对应 Preview。
- Staging MapTiler 和 TravelTime credentials。
- Synthetic accounts。
- 受控的认证邮件测试发件身份。
- 外部 fork 只使用 fixture，不读取 secrets。

#### Production

- 自定义域名。
- Production Supabase。
- 域名受限 MapTiler key。
- TravelTime Production licence。
- 用于认证邮件的已验证域名和 Supabase custom SMTP。
- managed Functions 的 Application Insights；浏览器遥测仅在发布强化阶段确认需要后启用。

#### 配置边界

浏览器可见配置：

```text
VITE_APP_URL
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_MAPTILER_KEY
VITE_MAP_STYLE_URL
VITE_TURNSTILE_SITE_KEY
VITE_APP_VERSION
VITE_DATA_VERSION
```

Functions secrets：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TRAVELTIME_APPLICATION_ID
TRAVELTIME_API_KEY
TURNSTILE_SECRET_KEY
SHARE_TOKEN_SECRET
MAINTENANCE_JOB_SECRET
```

部署流程明确区分 Preview 与 Production。Azure Static Web Apps Deployment Token 在首次静态前端部署阶段保存在 repository secret；后续出现 Supabase、MapTiler、TravelTime 或 Functions 等环境专属配置时，再使用 GitHub Environment 与 Azure application settings 隔离。secret 不进入浏览器构建、日志或 PR artifact。

### 4.2 Git 策略

- `main` 始终可测试和可部署。
- 初始工程基线后，所有变更从 `main` 创建短分支。
- 不维护长期 `develop`。
- 一个分支交付一个可审查的目标。
- Pull Request 必须通过 required checks。
- 使用 squash merge 和 linear history。
- 禁止 force push 和删除 `main`。
- 正式里程碑使用日期型 release tag。

分支示例：

```text
chore/project-foundation
spike/data-join
feat/data-first-sa2
feat/explore-map
feat/rent-history
fix/missing-periods
data/2026-04-refresh
```

### 4.3 持续集成

`pull-request.yml` 在首次交付步骤建立，并随着项目能力增长持续增加 PR 门禁；`production.yml` 负责 `main` 的正式部署和部署后 smoke test：

| 引入能力 | 在对应 Step 加入 CI |
|---|---|
| TypeScript | production build 中的 `tsc -b` |
| 代码规范 | lint |
| 业务计算 | unit tests |
| React 页面 | component tests |
| 用户流程 | Playwright |
| 数据流水线 | fixture、contract、quality tests |
| Supabase | migration reset、seed、pgTAP、RLS |
| Functions | API tests、build |
| 公网行为 | Preview 和 Production smoke tests |

CI 使用 `npm ci`。前端、数据工具和常规检查使用 Node 24；Functions job 使用其已验证的 Azure runtime major，二者分别记录。

### 4.4 持续部署

#### PR Preview

```text
Build
→ Test
→ Generate fixture assets
→ Deploy temporary Preview
→ Run Preview smoke tests
→ Expose Preview URL from deployment output
→ Remove environment when PR closes
```

#### Main deployment

```text
Required checks passed
→ Validate environment
→ Resolve approved data version and data release bundle
→ Verify bundle manifest and SHA-256
→ Build frontend and Functions
→ Apply backward-compatible migrations
→ Deploy Azure Static Web Apps
→ Run smoke tests
→ Record app and data version
```

第一次技术部署在产品功能前完成。此后每次 main 合并自动更新稳定环境。正式公开发布在全部上线门禁通过后进行。

### 4.5 数据更新交付

数据流水线完成后立即建立 `refresh-rental-data.yml`：

```text
Check official source
→ Compare source lock
→ Download changed source
→ Run full pipeline
→ Generate QA report
→ Package immutable data release bundle
→ Create data branch and PR
→ CI and Preview
→ Review and merge
→ Main deployment
→ Production smoke test
```

### 4.6 公网部署

```text
Frontend and static data  Azure Static Web Apps
HTTP API                 SWA managed Azure Functions
Auth and PostgreSQL      Supabase
Basemap                  MapTiler Cloud
Address and commute      TravelTime
Auth email               Supabase custom SMTP；provider 在账户阶段选择
CI/CD                    GitHub Actions
Monitoring               SWA metrics + Functions Application Insights + Supabase logs
```

部署配置包括：

- 在选择 Azure Static Web Apps 生产套餐前测量总静态体积、文件数、带宽和并行 Preview 需求。
- SPA navigation fallback。
- `/api/*` 和 `/data/*` 排除规则。
- CSP。
- X-Content-Type-Options。
- Referrer-Policy。
- Permissions-Policy。
- Supabase redirect URLs。
- MapTiler domain restriction。
- MapTiler 和 TravelTime attribution。
- robots、sitemap、manifest、favicon 和 Open Graph。
- Account、Auth、Plans 和 Share 的 noindex 策略。

### 4.7 本地容器

本地容器只用于 Supabase CLI 提供 PostgreSQL、Auth、PostgREST、Studio 和 Mailpit。React 和 managed Functions 不制作自定义应用镜像。

### 4.8 监控

监控先使用 Azure Static Web Apps 平台指标、managed Functions Application Insights 和 Supabase logs。Functions 的请求、异常和延迟属于服务端基线监控；Preview 与 Production 使用独立资源或明确的 environment tag。

Application Insights Browser SDK 不属于初始依赖。Step 19 根据真实前端故障定位需求、性能观测价值和隐私成本决定是否启用。启用时才加入 `VITE_APPLICATION_INSIGHTS_CONNECTION_STRING`；该连接字符串是浏览器公开配置，不视为 secret。发送前必须移除 URL fragment、query、工作地点、收入、token、请求/响应 body 和自由文本，并开启采样和成本告警。

监控项目：

- Frontend runtime errors；仅在启用 Browser SDK 时采集。
- Functions failures 和 latency。
- TravelTime provider errors。
- Share API failures。
- Maintenance cleanup failures。
- Manifest load failures。

Supabase：

- Auth errors。
- Database errors。
- RLS denial anomalies。
- Anonymous user growth。
- Query latency。

数据流水线：

- Source version 和 SHA-256。
- Input/output counts。
- Rejected rows。
- Missing metrics。
- Join result。
- Output sizes。
- Workflow URL。

如果启用浏览器遥测，Telemetry 不得包含私人输入或 token。必须先在开发和测试环境验证 sanitizer；无法证明脱敏时保持关闭。

### 4.9 回滚

- 前端和 Functions：重新部署稳定 commit 或 release tag。
- 数据：按 main 记录的 bundle id 部署上一个成功 data release bundle，不在回滚时重新下载可变来源。
- 数据库：使用 expand-and-contract migration 和 forward-fix。
- 数据库 migration 必须对当前线上应用保持向后兼容。
- 每个正式发布前演练至少一次关键恢复路径。

## 5. 测试与质量门禁

### 5.1 功能切片完成定义

一个功能切片只有同时满足以下条件才完成：

- 验收标准明确，正常、加载、空数据、部分数据和错误状态已处理；
- 对业务计算、数据 contract、组件行为或 API 边界增加了必要测试；
- 已建立的关键用户流程同步更新 Playwright 测试；
- 桌面与移动端、隐私和日志行为通过检查；
- 当前 `check`、production build 和 CI 通过；
- Pull Request Preview 与自审通过；
- 合并 `main` 后部署和 smoke test 通过；
- 学习笔记与公开状态说明与真实实现一致。

### 5.2 数据验收

- MBIE 与 SA2 2019 可重复关联，全国可发布集合不依赖城市白名单。
- Region、territorial authority、经过验证的 urban/rural 层级、分片和时区映射可重复生成。
- 南北岛主要城市、较小中心、稀疏区域和 Chatham Islands 时区边界的代表样本通过人工核查。
- 所有发布数据可追踪来源、许可证、状态、校验值和 pipeline version。
- 地图、详情、比较和报告口径一致，缺失季度没有被填补。
- 新数据通过自动 Pull Request、质量门禁和部署流程发布。

### 5.3 工程质量验收

- TypeScript strict 无错误；lint、测试与 build 可在 CI 重复执行，build 通过 `tsc -b` 执行类型检查。
- 关键计算具有单元测试，数据 pipeline 具有 contract 与质量测试。
- RLS 与跨用户拒绝在数据库功能出现时通过 pgTAP。
- 关键用户流程通过 Playwright；桌面和移动核心流程正常。
- 页面、地图与图表具有清晰语义、足够的文字对比度和非视觉替代。
- 性能预算、API 认证、限流、secret 和日志脱敏通过对应门禁。
- Local、Preview 和 Production 环境可重复建立并能回滚。

### 5.4 公开发布门禁

- 生产域名、HTTPS、SPA 路由和安全 headers 正常。
- Supabase callbacks、认证邮件、TravelTime Production licence 与 MapTiler domain restriction 生效。
- 数据来源、版本、Methodology、Privacy、Terms 和账户删除可用。
- managed Functions 监控和告警生效；如启用浏览器遥测，其隐私过滤验证通过。
- 前端、数据与 migration 回滚演练通过。
- Production smoke tests 全部通过。

## 6. 固定技术决策

| 领域 | 决策 |
|---|---|
| 前端 | React + TypeScript strict + Vite |
| 包管理 | npm + `package-lock.json` |
| 本地/CI Node | Node.js 24 LTS，当前基线 24.21.0 |
| 路由与状态 | React Router、TanStack Query、Zustand、React Hook Form + Zod |
| UI | Tailwind CSS、shadcn/ui、Lucide icons |
| 地图与图表 | react-map-gl/maplibre、MapLibre GL JS、MapTiler Cloud、Recharts |
| 静态数据 | 全国紧凑索引 + Region 分片 + 单区域历史文件 |
| API | Azure Static Web Apps managed Functions HTTP triggers；runtime 实施时按官方支持值确认 |
| 认证与数据库 | Supabase Auth + PostgreSQL + RLS |
| 通勤 | TravelTime，经 Functions 代理 |
| 测试 | Vitest、React Testing Library、Playwright；数据库阶段加入 pgTAP |
| CI/CD | GitHub Actions + Azure Static Web Apps Preview / Production |
| Git | 稳定 `main` + 短期分支 + Pull Request + squash merge |
| 容器 | 仅 Supabase CLI 本地服务，不构建自定义应用镜像 |
