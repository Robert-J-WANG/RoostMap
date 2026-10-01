# RoostMap 产品设计方案

> 文档状态：开发基线  
> 文档职责：定义产品目标、范围、数据含义、业务指标、页面体验和产品验收  
> 文档边界：不记录当前完成状态，不展开技术架构、开发命令和逐步实践过程
> 技术实现：见 `docs/TECHNICAL_SPEC.md`  
> 开发顺序：见 `docs/DEVELOPMENT_OUTLINE.md`  
> 数据覆盖：New Zealand；主要城市用于重点质量验收，不作为发布白名单  
> 统计地理单位：Stats NZ SA2 2019  
> 产品语言与地区：English / New Zealand

## 1. 产品定义与范围

### 1.1 产品定位

RoostMap 是一个面向新西兰租客的区域选择与负担能力分析平台。用户输入住房需求、净收入、工作地点和通勤方式后，系统使用官方租金数据、SA2 地理边界和路线服务，帮助用户发现、分析和比较适合居住的租赁区域。

产品回答三个核心问题：

1. 哪些区域符合住房需求和租金预算？
2. 从这些区域到工作地点需要多少时间和成本？
3. 综合租金、通勤和收入后，哪个区域更适合用户？

### 1.2 目标用户

- 在 New Zealand 寻找租房区域的个人。
- 同时考虑两个工作地点的伴侣或家庭。
- 需要比较多个候选区域的租客。
- 希望平衡租金和通勤成本的上班族。
- 搬到 New Zealand 或在不同城市之间迁居、需要理解区域租金差异的新居民。

### 1.3 核心用户流程

```text
配置住房与通勤需求
→ 发现符合条件的 SA2 区域
→ 查看最新观测租金和历史变化
→ 比较租金与通勤成本
→ 模拟不同生活情景
→ 保存计划
→ 分享结果
```

用户无需注册即可完成区域探索、详情查看、基础比较、负担能力计算和本地保存。永久账户服务于跨设备同步和私密分享。

### 1.4 产品范围原则

- SA2 2019 是唯一租金统计地理单位。
- 产品发布区域由有效 MBIE Location Id 与 Stats NZ SA2 2019 geometry 的可重复关联结果决定，不使用城市白名单截断全国数据。
- Region、territorial authority 和官方 urban/rural 分类只用于导航、搜索、分片与展示，不改变 SA2 租金统计口径。
- 地图、列表、详情、图表、比较和报告使用同一数据切片。
- 一个用户搜索词可以返回多个独立 SA2，不把多个 SA2 强制合并成 suburb。
- 所有租金结论来自经过验证的官方数据。
- 租金数据描述私人房东的新 bond lodgements，不代表实时房源、挂牌租金或全部在租住房。
- 最新数据为 provisional 时，所有相关页面显示状态和可比性警告。
- 通勤结果是从 SA2 代表点到用户工作地点的早高峰单程区域级估算。
- 产品提供区域决策分析，不表示实时可租房源。
- 新功能必须服务于“区域发现、分析、比较、规划、保存或分享”中的一个明确环节。

### 1.5 产品计量约定

| 项目 | 约定 |
|---|---|
| 金额 | NZD |
| 租金 | 每周金额 |
| 收入 | 用户输入的家庭净年收入 |
| 距离 | kilometre |
| 时间 | minute / hour |
| 日期与通勤时段 | 到达时间按工作地点的 IANA 时区解释；新西兰大陆为 `Pacific/Auckland`，Chatham Islands 为 `Pacific/Chatham` |
| 默认通勤时段 | 用户可修改；默认取下一个 Tuesday 08:30 到达工作地点 |
| 界面 locale | `en-NZ` |
| 数据周期 | ISO 日期表示季度起始日 |

### 1.6 页面与路由

产品包含 10 个用户功能页面和 1 个数据说明页面。

| 页面 | 路由 | 主要职责 |
|---|---|---|
| Home | `/` | 价值说明、快速输入、数据更新时间、探索入口 |
| Setup | `/setup` | 住房、收入、工作地点和通勤需求配置 |
| Explore | `/explore` | SA2 地图、列表、搜索、筛选、排序 |
| Area Detail | `/areas/:sa2Id` | 最新观测租金、历史趋势、数据覆盖和通勤 |
| Compare | `/compare` | 最多四个 SA2 的统一口径比较 |
| Scenarios | `/scenarios` | 不同工作和生活情景的成本比较 |
| Plans | `/plans` | 本地或云端计划、收藏和保存时的数据版本 |
| Share Report | `/share#token=<token>` | 由 URL fragment 携带 token 的隐私只读比较报告 |
| Auth | `/auth` | 登录、注册、验证、恢复和身份升级 |
| Account | `/account` | 账户资料、分享、导出和删除 |
| Methodology | `/methodology` | 数据来源、版本、公式和质量说明 |

## 2. 数据来源与产品口径

### 2.1 核心官方数据集

项目只有两个核心官方数据集。

#### MBIE Rental Bond Data

使用 Tenancy Services 发布的 Detailed Quarterly Report，从 2020 年至最新可用周期。

读取字段：

```text
TimeFrame
Location Id
Dwelling Type
Number Of Beds
Total Bonds
Median Rent
Geometric Mean Rent
```

用途：

- 最新观测中位周租金。
- 几何平均租金历史趋势。
- 12 个月租金变化。
- Reported Bonds 数据覆盖信息。
- 房型和卧室筛选。

口径边界：

- 来源只覆盖私人部门新提交的 bond records，按 tenancy start date 统计。
- 数据不是实时可租房源、挂牌价或存量出租房源清单。
- 官方标记 provisional 时，近期值可能因系统迁移、分类和方法调整而修订；产品不把这些变化直接解释为市场变化。
- Methodology 记录官方归属、许可证、发布日期、下载日期和原始文件校验值。

来源：[MBIE Rental Bond Data](https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/)

#### Stats NZ SA2 Higher Geographies 2019

使用 Statistical Area 2 Higher Geographies 2019 generalised boundary。该文件提供 SA2 边界及其官方上级地理对应关系。实际下载文件的 schema 在数据可行性验证阶段锁定；只使用文件中经过验证的字段。

读取字段：

```text
SA2 code
SA2 name
Regional council code and name
Territorial authority code and name
Urban/rural code, name and indicator when present in the verified source schema
Geometry
Land area
```

用途：

- 通过 SA2 code 关联 MBIE Location Id。
- 建立全国 Region、territorial authority、官方 urban/rural area 与 SA2 层级。
- 根据有效 MBIE 记录与 geometry 的关联结果生成可发布 SA2 集合。
- 绘制 SA2 边界。
- 建立 SA2 和经过验证的上级地理名称搜索索引。
- 计算区域内部代表点。

来源：[Stats NZ SA2 Higher Geographies 2019](https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/)

### 2.2 已核查的 MBIE 样本基线

截至 2026-09-30 的下载样本：

| 项目 | 结果 |
|---|---:|
| 原始记录数 | 226,080 |
| 季度数量 | 26 |
| 时间范围 | 2020-01-01 至 2026-04-01 |
| 原始位置标识数量 | 2,011 |
| 无效 Location Id | `NULL`、`-99` |
| 无效位置记录数 | 1,885 |
| 原始租金指标缺失数 | 803 |
| 有效位置中的租金指标缺失数 | 9 |
| Dwelling Type 数量 | 6 |

这些数字是源结构变化检测基线，不作为永久业务常量。每次更新重新计算质量报告。官方页面标记 provisional 时，产品在数据周期和 Methodology 页面同步展示。

### 2.3 地理与分类规则

- `sa2Id` 是租金区域、地图 feature、详情页、比较、计划和分享使用的统一业务标识。
- MBIE `Location Id` 只与 Stats NZ SA2 2019 geometry 关联，不额外构造 suburb 边界。
- Region、territorial authority 和源文件中经过验证的 urban/rural 字段用于导航、搜索和展示，不改变 SA2 的统计口径。
- 搜索上级地理名称时返回其包含的多个独立 SA2；同名 SA2 使用 Region 和 territorial authority 消歧。
- 可发布区域由“存在有效 MBIE 观测且成功关联 SA2 geometry”的固定规则生成，不使用城市白名单。
- Dwelling Type 与 Bedroom Category 只按官方源值精确映射；缺失切片保持缺失，不借用其他类别的数据。
- 默认租金切片为全部 dwelling types 和全部 bedrooms；用户改变筛选后，地图、列表、详情、图表和比较必须使用同一切片。

完整字段、分类允许值、拒绝规则、数据 contract、分片和质量门禁见 `docs/TECHNICAL_SPEC.md`。

### 2.4 数据解释边界

- Median Rent 表示选定季度和租房类别的每周租金中位数。
- Geometric Mean Rent 用于历史趋势和同比计算。
- Total Bonds 在产品中显示为 Reported Bonds，只解释样本覆盖，不转换成准确度评分。
- 最新周期可能是 provisional；相关页面必须同时显示数据周期、观测周期和状态说明。
- 历史缺失值不插值，旧观测不能被表述为当前市场价格。
- 数据描述私人部门新提交的 bond records，不代表挂牌租金、实时房源或全部存量租赁住房。

## 3. 指标与业务计算

### 3.1 最新观测租金

显示：

- Latest Observed Median Weekly Rent。
- Reported Bonds。
- Dataset Latest Period。
- Observation Period。
- Provisional Status 与官方可比性警告。

地图和区域排名只使用同一 `datasetLatestPeriod`。详情可以显示某个切片最后一次有效观测，但必须同时标记 `observationPeriod` 和数据状态，不将旧观测表述为当前市场价。

### 3.2 历史趋势

历史趋势使用 Geometric Mean Weekly Rent。

12 个月变化：

```text
(Current Geometric Mean / Geometric Mean Four Quarters Earlier) - 1
```

要求：

- SA2 相同。
- Dwelling Type 相同。
- Bedroom Category 相同。
- 两个目标季度都有有效值。
- 缺失季度保持 `null`。
- 不跨类别填补数据。

### 3.3 Reported Bonds

`Total Bonds` 在产品中显示为 Reported Bonds，用于解释数据覆盖情况。界面和 Methodology 页面说明其隐私抑制及 base-3 随机取整口径。Reported Bonds 不转换成虚构的准确度评分。

### 3.4 通勤指标

- Outbound One-way Commute Time：从 SA2 代表点到工作地点。
- Outbound One-way Commute Distance，在服务提供时显示。
- Weekly Commute Days。
- Annual Commute Transport Cash Cost。
- Annual Commute Hours。
- 数据计算时间、代表工作日、工作地点到达时间、工作地点时区和交通方式。

单人方案计算一个通勤者。双人方案分别计算后再求和。

路线使用 TravelTime `arrival_searches`：多个候选 SA2 代表点作为 departure locations，一个工作地点作为 arrival location。用户为每个通勤者选择 Typical Workday 和 Desired Arrival Time；默认取计算时刻之后最近的 Tuesday 08:30。请求保存实际使用的带时区日期时间并在结果中显示。

首发不单独计算返程路线。年度距离和时间使用透明的往返近似：

```text
Round-trip Distance = Outbound One-way Distance × 2
Round-trip Commute Hours = Outbound One-way Commute Hours × 2
```

Methodology 和结果解释面板明确说明返程交通、拥堵和公共交通班次可能不同。该近似避免增加第二套返程时间输入和双倍路线请求。

### 3.5 负担能力公式

```text
Annual Rent
= Median Weekly Rent × 52 × Rent Responsibility

Driving Annual Transport Cost
= Round-trip Distance
× Cost per Kilometre
× Commute Days per Week
× Commute Weeks per Year

Annual Parking Cost
= Daily Parking
× Commute Days per Week
× Commute Weeks per Year

Public Transport Annual Transport Cost
= User-entered Round-trip Fare
× Commute Days per Week
× Commute Weeks per Year

Annual Time Cost
= Round-trip Commute Hours
× Commute Days per Week
× Commute Weeks per Year
× User Time Value

Annual Cash Location Cost
= Annual Rent
+ All Commuters' Transport Cost
+ All Parking Cost

Net Rent-to-Income Ratio
= Annual Rent / Combined Net Annual Income

Net Cash Location Cost Ratio
= Annual Cash Location Cost / Combined Net Annual Income

Annual Total Location Cost
= Annual Cash Location Cost + Optional Time Cost

Net Total Location Cost Ratio
= Annual Total Location Cost / Combined Net Annual Income

Weekly Remaining After Cash Location Cost
= Combined Net Annual Income / 52
- Annual Cash Location Cost / 52
```

约束：

- `Rent Responsibility` 是本计划所代表家庭承担的整套周租金比例，取值 0–1；不为每个通勤者重复计算。
- 启用收入比率时 Combined Net Annual Income 必须大于 0。
- Commute Days 取值 0–7，Commute Weeks 取值 0–52，费率、停车费和时间价值不得为负数。
- Typical Workday 必须是有效 day of week；Desired Arrival Time 必须是有效本地时间。Functions 将其解析为工作地点时区中下一次对应日期时间，并把最终 ISO-8601 值返回给前端。
- Annual Transport Cost 和 Annual Time Cost 使用上面定义的单程乘二近似，不把停车费或租金重复计入每个通勤者。
- Net Rent-to-Income Ratio 和 Net Cash Location Cost Ratio 只使用实际现金支出。
- 时间成本是用户主观情景，默认不计入负担能力；启用时只显示 Total Location Cost 及其 ratio。
- 步行和骑行现金成本默认为 0，可由用户修改。
- 公共交通票价由用户输入，不推断不同地区运营商的票价。
- 距离不可用时不伪造距离和距离成本。
- 每个结果提供输入和公式明细。

### 3.6 筛选与排序

硬性筛选：

- Bedroom Category。
- Dwelling Type。
- Maximum Weekly Rent。
- Maximum Commute Time。
- Maximum Net Rent-to-Income Ratio 或 Maximum Net Cash Location Cost Ratio。
- Dataset Latest Period Availability。

排序：

- Lowest Annual Cash Location Cost。
- Lowest Median Rent。
- Shortest Commute。
- Lowest Net Cash Location Cost Ratio。
- Highest Reported Bonds。

通勤和 Cash Location Cost 结果只在路线计算完成后参与最终筛选和排序。

### 3.7 缺失与稀疏数据

| 状态 | 产品行为 |
|---|---|
| 当前周期有记录 | 显示当前指标 |
| 当前周期无记录 | 显示当前周期不可用 |
| 历史存在旧记录 | 显示最后观测日期 |
| 1 个历史点 | 显示快照 |
| 2–3 个历史点 | 显示独立数据点 |
| 4 个以上历史点 | 显示趋势线 |
| 中间季度缺失 | 折线断开 |
| 无法计算同比 | 显示 `N/A` |
| 指标被抑制 | 显示 `Insufficient reported bonds` |

## 4. 用户体验与数据可视化

### 4.1 Home 与 Setup

Home 提供：

- 产品价值和适用场景。
- 全国 Region、territorial authority 或 SA2 入口，以及由官方上级地理生成的主要城市快捷入口。
- 工作地点、预算和卧室快速输入。
- 使用流程。
- 地图和分析预览。
- 官方数据来源与更新时间。

Setup 输入：

- Combined Net Annual Income。
- Weekly Rent Budget。
- Rent Responsibility。
- Bedrooms。
- Dwelling Type。
- 一个或两个 Workplace。
- 每人的 Commute Mode、Days、Weeks、Typical Workday 和 Desired Arrival Time。
- Parking Cost。
- Time Value。
- Maximum Commute Time。

只有房型、卧室、预算上限、最长通勤时间等可公开的筛选状态同步到 URL。收入、精确工作地点、停车费、时间价值和完整计划在未保存时只存在于内存。用户主动保存本地计划后才写入 localStorage，主动同步后才进入云端。

### 4.2 Explore

桌面端使用地图与列表分屏；移动端使用地图/列表切换。

地图图层：

- Latest Observed Median Weekly Rent。
- 12-Month Rent Change。
- Net Cash Location Cost Ratio。
- Reported Bonds。

租金与 Reported Bonds 可直接加载。同比只在有可比季度时显示。现金位置成本比率图层需要收入配置，并在路线结果返回后显示；可选时间成本不进入该图层。

页面展示 latest period 和 provisional 状态；存在官方可比性警告时提供可见摘要和 Methodology 链接。

功能：

- 全国 SA2、Region、territorial authority，以及经过验证的 urban area 名称搜索；上级地理结果展开为多个独立 SA2。
- Region 和 territorial authority 导航与当前范围面包屑。
- 房型和卧室筛选。
- 租金、最长通勤、Net Rent-to-Income Ratio 和 Net Cash Location Cost Ratio 筛选。
- 地图与列表双向联动。
- 区域排序。
- 加入比较。
- 保存区域。
- URL 恢复视口、筛选、图层和选择。

### 4.3 Area Detail

显示：

- SA2 名称和边界。
- 最新观测中位租金。
- Dataset Latest Period、Observation Period 和 Provisional Status。
- Reported Bonds。
- 几何平均租金历史。
- 每季度 Reported Bonds。
- 12 个月变化。
- 工作地点通勤。
- 年度现金位置成本、可选总位置成本和对应收入占比。
- 加入比较和计划。

### 4.4 Compare

最多比较四个 SA2：

- 当前指标表。
- 多区域历史趋势。
- 租金与通勤散点图。
- 年度成本构成。
- 数据周期和覆盖。
- 保存比较。
- 生成分享报告。

### 4.5 Scenarios、Plans 与 Share

Scenarios 复制现有计划并修改特定输入，每个情景保存输入、数据版本和计算结果。

Plans 管理：

- 收藏区域。
- 需求配置。
- 情景。
- 比较记录。
- 保存时的数据版本。
- 最新租金变化。
- 分享链接。

Share Report 是经过隐私处理的只读快照，支持有效期和撤销。

### 4.6 Methodology

Methodology 页面从 manifest 和版本化静态内容显示：

- MBIE 和 Stats NZ 的官方来源、归属、许可证和校验值。
- 官方发布日期、本项目下载日期、latest period 和 pipeline version。
- private bond lodgements、非实时房源、隐私抑制和 provisional 可比性限制。
- Median Rent、Geometric Mean、Reported Bonds、同比和位置成本指标的公式与单位。
- SA2 代表点通勤估算的限制。
- 质量报告摘要和已知限制。

Home、Explore、Area Detail、Compare 和 Share Report 使用简短上下文说明和链接，不要求用户阅读整页后才能正确解释指标。

### 4.7 图表规范

统计图表使用 Recharts。

#### 租金历史折线图

- X：TimeFrame。
- Y：Geometric Mean Weekly Rent。
- 支持 1 年、3 年、2020 年至今。
- 缺失季度断线。

#### Reported Bonds 柱状图

- X：TimeFrame。
- Y：Reported Bonds。
- 与租金趋势共享时间范围。

#### 多区域趋势图

- 最多四条折线。
- 通过 period 对齐。
- 各区域独立保留缺失断点。

#### 租金与通勤散点图

- X：One-way Commute Time。
- Y：Median Weekly Rent。
- 点大小：Reported Bonds，使用受限平方根比例。

#### 年度成本构成图

- Annual Rent。
- Commute Transport Cost。
- Parking Cost。
- Optional Time Cost，与现金成本明确分开。

每个图表提供文字摘要和数据表格，不依赖颜色传达唯一信息。

### 4.8 地图规范

React 通过 `react-map-gl/maplibre` 管理地图组件和交互状态，MapLibre GL JS 负责地图渲染，MapTiler Cloud 提供底图。

- 当前 Region 的简化 GeoJSON 作为自有 source；全国索引只负责导航和分片定位。
- `sa2Id` 作为稳定 feature id。
- 当前切片指标通过 `setFeatureState` 更新。
- fill layer 显示色阶。
- line layer 显示 hover、selected 和 compared。
- 图例、卡片和详情数值一致。
- 地图所有核心操作均可通过同步列表完成。
- MapTiler 浏览器 key 设置域名限制。
- 地图保留 MapTiler 和底层数据源要求的 attribution。

来源：[react-map-gl MapLibre integration](https://visgl.github.io/react-map-gl/docs)、[MapTiler React/MapLibre](https://docs.maptiler.com/react/maplibre-gl-js/get-started/)

### 4.9 响应式与可访问性

- 桌面地图与列表分屏。
- 移动端地图/列表切换和详情 bottom sheet。
- 筛选器在移动端使用全屏面板。
- 支持 `prefers-reduced-motion`。
- Tooltip 不作为传达关键信息的唯一方式。
- 表单 label、说明和错误正确关联。
- 页面 title、heading 和 landmark 正确。
- 文字与背景保持清晰对比度。

### 4.10 视觉系统

- 整体风格现代、克制、可信，以决策数据为中心。
- 蓝绿色作为主要品牌和低成本区间颜色。
- 暖色表达较高成本。
- 中性色表达不可用或尚未计算。
- 地图、图表、卡片和比较视图中的区域颜色保持一致。
- 设计 token 使用 CSS variables 管理颜色、字体、间距、圆角和阴影。
- 数据卡片优先呈现周租金、通勤、Net Rent-to-Income Ratio、Net Cash Location Cost Ratio、Reported Bonds 和数据周期。
- 每个核心页面在实现前确认布局草图，完成时检查手机、平板和桌面关键宽度。
- 关键页面保留基准截图，只对稳定且重要的界面加入视觉回归，避免大量脆弱的截图测试。

## 5. 用户访问与保存边界

### 5.1 无账户使用

用户无需注册即可访问 Home、Setup、Explore、Area Detail、基础 Compare 和 Methodology，并可主动把计划保存到当前浏览器。未保存的私人输入只保留在内存中。

### 5.2 永久账户

永久账户用于跨设备同步、账户管理和私密分享。登录或注册只在用户选择云端保存或分享时出现，不阻断核心探索流程。已有本地计划在用户确认后再合并到云端。

### 5.3 私密分享

分享内容是创建时的只读快照，默认排除精确收入、工作地点名称和坐标。用户可以设置有效期并撤销链接；公开报告只展示理解比较结果所需的数据和计算说明。

认证、数据库、RLS、token 和隐私实现见 `docs/TECHNICAL_SPEC.md`。

## 6. 产品验收

### 6.1 核心能力

用户可以：

- 配置单人或双人的住房、收入和通勤需求；
- 搜索、筛选和排序可发布 SA2；
- 在地图与列表之间使用同一数据口径；
- 查看区域最新观测、历史趋势、Reported Bonds 和数据限制；
- 比较区域及不同生活情景；
- 计算租金、通勤和负担能力，并查看输入与公式；
- 本地保存计划；
- 自愿创建永久账户并同步计划；
- 创建、查看和撤销私密分享报告。

### 6.2 产品质量

- 桌面和移动端的核心流程可完整使用。
- 地图和图表具有文本或表格替代，以及明确的空状态和错误状态。
- 数据来源、版本、许可证、provisional 状态和计算方法可以从产品中查到。
- 不可用、稀疏或过期数据被明确标记，不生成虚构结果。
- 公开界面不暴露收入、精确工作地点、访问 token 或其他私人信息。
- 页面内容、视觉层级和交互达到可以公开展示的商业产品质量。

### 6.3 固定产品决策

| 决策 | 结果 |
|---|---|
| 租金统计地理 | Stats NZ SA2 2019 |
| 数据覆盖 | 全国；由有效 MBIE 观测与 SA2 geometry 的关联结果决定 |
| 核心官方数据 | MBIE Rental Bond Data + Stats NZ SA2 Higher Geographies 2019 |
| 地理导航 | 经过验证的 Region、territorial authority 和 urban/rural 字段 |
| 租金趋势 | Geometric Mean Rent |
| 当前租金 | 最新观测 Median Rent |
| 地图 | react-map-gl/maplibre + MapLibre GL JS + MapTiler Cloud |
| 图表 | Recharts |
| 通勤 | TravelTime 区域级估算 |
| 本地保存 | 用户主动保存的版本化计划 |
| 云端能力 | 永久账户同步与私密分享 |
| 部署 | Azure Static Web Apps + GitHub Actions |
