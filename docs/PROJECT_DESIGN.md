# RoostMap 产品设计方案

> 文档状态：开发基线  
>
> 文档职责：定义产品目标、版本边界、数据含义、业务指标、页面体验和产品验收
>
> 文档边界：不记录当前完成状态，不展开技术架构、开发命令和逐步实践过程
>
> 技术实现：见 `docs/TECHNICAL_SPEC.md`  
> 开发顺序：见 `docs/DEVELOPMENT_OUTLINE.md`  
> 数据覆盖：New Zealand；主要城市用于重点质量验收，不作为发布白名单  
> 统计地理单位：Stats NZ SA2 2019  
> 产品语言与地区：English / New Zealand

## 1. 产品定义与版本边界

### 1.1 产品定位

RoostMap 是一个基于 New Zealand 官方数据的租赁区域证据探索与比较产品。它把租金观测、历史变化、数据覆盖和 SA2 地理边界放在同一界面中，帮助租客理解不同区域之间有证据支持的差异。

RoostMap 不替用户判断“最适合居住的区域”，也不提供实时房源或精确地址级结论。产品提供的是可追溯的区域级租金证据，用户仍需结合房源、生活方式和其他信息自行决策。

V1 回答四个问题：

1. 指定房型和卧室类别在不同 SA2 的最新观测周租金是多少？
2. 同一数据切片的租金在过去几年如何变化？
3. 当前结果由多少 Reported Bonds 支持，数据周期和状态是什么？
4. 用户选中的几个区域在统一口径下有什么差异？

### 1.2 目标用户

- 正在 New Zealand 研究租房区域的个人。
- 希望比较多个候选区域租金水平和历史变化的租客。
- 搬到 New Zealand 或跨城市迁居、需要理解区域租金差异的新居民。
- 希望通过官方统计而不是实时挂牌样本建立初步区域认知的用户。

### 1.3 V1 核心用户流程

```text
选择 Region、Dwelling Type、Bedroom Category 和可选周租金上限
→ 在地图与列表中浏览可发布 SA2
→ 查看区域最新观测、历史趋势和数据覆盖
→ 将候选区域加入比较
→ 在统一数据切片下理解差异与限制
```

V1 无需账户。公开筛选、地图状态和比较选择通过 URL 恢复。

### 1.4 V1 范围原则

- SA2 2019 是唯一租金统计地理单位和区域业务标识。
- 发布区域由有效 MBIE 观测与 Stats NZ SA2 2019 geometry 的可重复关联结果决定，不使用城市白名单截断全国数据。
- Region 和 territorial authority 只用于导航、搜索、分片与展示，不改变 SA2 租金统计口径。
- 地图、列表、详情、图表和比较必须使用同一数据切片和指标定义。
- 上级地理搜索可以返回多个独立 SA2，不把多个 SA2 强制合并成 suburb。
- 缺失观测保持缺失，不从其他 dwelling 或 bedroom 类别填补。
- 最新数据为 provisional 时，相关页面显示状态和可比性说明。
- Maximum Weekly Rent 只筛选具有可用最新观测且不超过指定值的区域。
- 产品描述私人部门新 bond lodgements，不表示实时可租房源、挂牌租金或全部存量租赁住房。

### 1.5 版本边界

#### V1 · Rental evidence explorer

V1 包含全国租金数据、地图与列表探索、区域详情、历史趋势、区域比较、Methodology 和稳定公开部署。V1 是能够独立使用和公开展示的完整产品。

#### V2 · Cloud watchlists and saved searches

V2 只在 V1 稳定上线后开始。它增加可选永久账户、云端关注区域、保存搜索、跨设备同步、应用内数据更新摘要和账户删除。

### 1.6 页面与路由

V1 页面：

| 页面 | 路由 | 主要职责 |
|---|---|---|
| Home | `/` | 解释产品价值、数据边界、当前数据周期和 Explore 入口 |
| Explore | `/explore` | SA2 地图、列表、搜索、筛选、排序和比较选择 |
| Area Detail | `/areas/:sa2Id` | 区域身份、最新观测、历史趋势、Reported Bonds 和限制 |
| Compare | `/compare` | 最多四个 SA2 的统一口径比较 |
| Methodology | `/methodology` | 数据来源、版本、公式、质量和解释限制 |

V2 才增加：

| 页面 | 路由 | 主要职责 |
|---|---|---|
| Auth | `/auth` | 可选注册、登录和恢复 |
| Saved | `/saved` | 关注区域、保存搜索和数据更新摘要 |
| Account | `/account` | 最小账户管理、数据删除和账户删除 |

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

- 来源覆盖私人部门新提交的 bond records，按 tenancy start date 统计。
- 数据不是实时可租房源、挂牌价或全部存量出租住房清单。
- 官方标记 provisional 时，近期值可能因系统迁移、分类和方法调整而修订；产品不把修订直接解释为市场变化。
- Methodology 记录官方归属、许可证、发布日期、下载日期和原始文件校验值。

来源：[MBIE Rental Bond Data](https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/)

#### Stats NZ SA2 Higher Geographies 2019

使用 Statistical Area 2 Higher Geographies 2019 generalised boundary。实际下载文件的 schema 在数据可行性验证阶段锁定，只使用源文件中经过验证的字段。

读取字段：

```text
SA2 code and name
Regional council code and name
Territorial authority code and name
Geometry
```

用途：

- 通过 SA2 code 关联 MBIE Location Id。
- 建立全国 Region、territorial authority 与 SA2 层级。
- 根据有效 MBIE 记录与 geometry 的关联结果生成可发布 SA2 集合。
- 绘制 SA2 边界并建立地理搜索索引。

来源：[Stats NZ SA2 Higher Geographies 2019](https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/)

### 2.2 地理与分类规则

- `sa2Id` 是租金区域、地图 feature、详情页、比较和 V2 保存记录的统一业务标识。
- MBIE `Location Id` 只与 Stats NZ SA2 2019 geometry 关联，不额外构造 suburb 边界。
- Region 和 territorial authority 用于导航、搜索和展示，不改变 SA2 统计口径。
- 搜索上级地理名称时返回其包含的多个独立 SA2；同名 SA2 使用 Region 和 territorial authority 消歧。
- 可发布区域由“存在有效 MBIE 观测且成功关联 SA2 geometry”的固定规则生成。
- Dwelling Type 与 Bedroom Category 只按官方源值和版本化 contract 映射。
- V1 发布的 Dwelling Type 为 `ALL`、`Apartment`、`Boarding House`、`Flat`、`House` 和 `Room`；发布的 Bedroom Category 为 `ALL`、`1`、`2`、`3`、`4` 和 `5+`。
- 源数据中零星出现或含义不明的卧室值（`0`、`5`、`6`、`7`、`9`、`15` 和 `NA`）不发布，排除数量进入质量报告；中位数无法合并重算，因此这些值不并入 `5+`。源分类 `ALL` 仍是包含全部记录的官方合计。
- 默认切片为 contract 中明确表示全部住宅类型和全部卧室的源分类；指定切片缺失时不回退到其他类别。

### 2.3 数据解释边界

- Median Rent 表示选定季度和租房类别的每周租金中位数。
- Geometric Mean Rent 用于历史趋势和同比计算。
- Total Bonds 在产品中显示为 Reported Bonds，只解释数据覆盖，不转换成准确度评分或房源数量。
- 最新周期可能是 provisional；相关页面同时显示 dataset latest period、observation period 和状态说明。
- 历史缺失值不插值，旧观测不能被表述为当前市场价格。
- 页面不根据有限指标生成“最佳区域”、评分或自动推荐。

## 3. V1 指标、筛选与比较

### 3.1 最新观测

每个区域切片显示：

- Latest Observed Median Weekly Rent。
- Reported Bonds。
- Dataset Latest Period。
- Observation Period。
- Provisional Status 与官方可比性说明。

地图和排名只使用同一 `datasetLatestPeriod`。详情可以显示切片最后一次有效观测，但必须标记实际 `observationPeriod`，不能把旧值表述为当前市场价。有效观测指 Median Rent 非空的季度记录。

### 3.2 历史趋势

历史趋势使用 Geometric Mean Weekly Rent。

12 个月变化：

```text
(Current Geometric Mean / Geometric Mean Four Quarters Earlier) - 1
```

计算要求：

- SA2、Dwelling Type 和 Bedroom Category 完全相同。
- 当前季度和四个季度前都有有效值；任一目标季度缺失时保持 `null`。
- 中间季度不参与公式，其缺失不影响两个目标季度之间的计算。
- 不跨类别填补数据。

1 卧分类可比性：

- 从 `2024-10-01` 起，MBIE 源数据中 `1` 卧的 Reported Bonds 和租金出现与全部类别不一致的跳升，判断为源分类变化而不是市场变化。
- Bedroom Category 为 `1` 时，只要当前季度或四个季度前任一目标季度不早于 `2024-10-01`，12 个月变化保持 `null`。
- `1` 卧的最新观测和历史仍然显示，但同时显示固定的可比性说明；Methodology 记录判断依据。
- 其他卧室类别沿用数据集整体的 provisional 说明。

### 3.3 Reported Bonds

`Total Bonds` 显示为 Reported Bonds。界面和 Methodology 说明隐私抑制及 base-3 随机取整口径；该值不转换成虚构的准确度评分。

### 3.4 筛选与排序

V1 筛选：

- Region 或当前地理范围。
- Dwelling Type。
- Bedroom Category。
- Maximum Weekly Rent，可选。
- Dataset Latest Period Availability。

V1 排序：

- Lowest Median Rent。
- Highest Median Rent。
- Largest 12-Month Increase。
- Largest 12-Month Decrease。
- Highest Reported Bonds。
- Area Name。

所有筛选和排序使用同一切片。Maximum Weekly Rent 只比较可用的最新观测中位租金；缺失值不自动视为符合预算。

### 3.5 比较规则

- 最多比较四个 SA2。
- 所有区域使用相同 Dwelling Type、Bedroom Category 和数据周期。
- 当前指标、历史趋势和 Reported Bonds 使用相同定义。
- 缺失值保持缺失，不因比较而回退到其他切片。
- 比较选择和公开筛选可编码在 URL 中，不需要保存到服务器。

### 3.6 缺失与稀疏数据

| 状态 | 产品行为 |
|---|---|
| 当前周期有记录 | 显示当前指标 |
| 当前周期无记录 | 显示当前周期不可用 |
| 历史存在旧记录 | 显示最后观测日期，不称为当前价格 |
| 1 个历史点 | 显示快照 |
| 2–3 个历史点 | 显示独立数据点 |
| 4 个以上历史点 | 显示趋势线 |
| 中间季度缺失 | 折线断开 |
| 无法计算同比 | 显示 `N/A` |

MBIE 不发布 bonds 少于 5 的组合，个别已发布记录的租金也可能为空。产品不单独区分这些情况，统一按缺失观测显示，并在 Methodology 说明隐私抑制规则。

## 4. V1 用户体验与数据可视化

### 4.1 Home

Home 提供：

- 产品用途和不适用范围。
- 当前数据周期和 provisional 状态。
- Region 或 SA2 探索入口。
- 地图、历史和比较能力预览。
- 官方数据来源摘要和 Methodology 链接。

### 4.2 Explore

桌面端使用地图与列表分屏；移动端使用地图/列表切换。

地图图层：

- Latest Observed Median Weekly Rent。
- 12-Month Rent Change。
- Reported Bonds。

页面功能：

- 全国 SA2、Region 和 territorial authority 名称搜索。
- 上级地理结果展开为多个独立 SA2。
- Region 和 territorial authority 导航与当前范围面包屑。
- Dwelling Type、Bedroom Category、Maximum Weekly Rent 和数据可用性筛选。
- 地图与列表双向联动。
- 区域排序、详情入口和加入比较。
- URL 恢复地理范围、视口、筛选、图层、选择和比较列表。
- latest period、provisional 状态、loading、empty、partial 和 error 状态。

### 4.3 Area Detail

Area Detail 显示：

- SA2 名称、上级地理和边界。
- 最新观测中位租金。
- Dataset Latest Period、Observation Period 和 Provisional Status。
- Reported Bonds。
- Geometric Mean Rent 历史。
- 每季度 Reported Bonds。
- 12 个月变化。
- 当前筛选切片与数据限制。
- 加入或移出比较。

### 4.4 Compare

最多四个 SA2，显示：

- 当前指标表。
- 多区域历史趋势。
- Reported Bonds 和数据覆盖。
- 数据周期、状态和缺失值。
- 返回各区域详情和移除比较项。

Compare 不生成综合评分或推荐结论。

### 4.5 Methodology

Methodology 从 manifest 和版本化静态内容显示：

- MBIE 和 Stats NZ 的来源、归属、许可证和校验值。
- 官方发布日期、项目下载日期、latest period 和 pipeline version。
- private bond lodgements、非实时房源、隐私抑制和 provisional 限制。
- Median Rent、Geometric Mean、Reported Bonds 和同比公式。
- join、分类、缺失值、分片和质量报告摘要。

Home、Explore、Area Detail 和 Compare 同时提供简短上下文说明，不要求用户先阅读整页 Methodology 才能正确解释指标。

### 4.6 图表规范

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

每个图表提供文字摘要和数据表格，不依赖颜色传达唯一信息。

### 4.7 地图规范

- 地图显示当前 Region 的 SA2 边界和所选指标。
- 填充颜色表达当前指标区间。
- 边界和强调样式区分 hover、selected 和 compared 状态。
- 图例、列表、卡片和详情数值一致。
- 地图核心操作可以通过同步列表完成。

### 4.8 响应式与视觉系统

- 桌面地图与列表分屏；移动端地图/列表切换。
- 移动筛选器使用空间充足的面板。
- Tooltip 不作为传达关键信息的唯一方式。
- 表单 label、说明和错误正确关联。
- 页面 title、heading、landmark、文字对比和键盘操作清楚。
- 蓝绿色作为主要品牌和较低租金区间颜色，暖色表达较高租金，中性色表达缺失或不可用。
- 地图、图表、卡片和比较视图中的区域颜色保持一致。
- 每个核心页面检查手机、平板和桌面关键宽度。

## 5. V2 云端关注与数据更新

### 5.1 产品目的

V2 解决一个后续出现的真实需求：用户在 V1 找到关注区域后，希望跨设备保存这些区域和搜索条件，并在新的官方季度数据发布后查看变化。

账户只用于建立云端数据所有权。未登录用户仍可完整使用 V1。

### 5.2 云端保存内容

#### Saved area

- `sa2Id`。
- Dwelling Type。
- Bedroom Category。
- 保存时的数据版本，以及存在有效观测时的观测周期。

#### Saved search

- Region，可选；未选择时表示全国。
- Dwelling Type。
- Bedroom Category。
- 可选 Maximum Weekly Rent。
- 排序条件。
- 用户提供的名称，可选，最多 80 个字符。

云端仅保存本节列出的关注区域和搜索条件，以及同步和更新摘要所需的最少元数据。用户主动提供的内容只有区域、筛选和可选名称；系统另外记录保存时的数据版本、可用时的观测周期、内容所有者、创建与更新时间，以及用户最后查看的数据版本。

### 5.3 应用内数据更新摘要

当用户打开 Saved 页面时，系统比较用户最后查看的正式数据版本和当前 manifest。版本对应的 `latestPeriod` 决定指标比较区间；指标统一从当前发布的历史序列读取，因此不会把两个不同 contract 或筛选切片混在一起：

```text
读取 last seen data version 及其 latest period
→ 读取 current data version 及其 latest period
→ 对每个关注区域，以 last seen period 和 saved observation period 中较晚者作为 baseline
→ 使用当前统一 data contract 读取 baseline 与 current period 的观测
→ 显示 Median Rent、12-Month Change 和 Reported Bonds 的变化
→ 用户查看后更新 last seen data version 和 period
```

首次使用 Saved 页面时没有可比较基线，页面只显示当前数据，并在用户查看后记录当前版本和周期。新保存的区域不会显示保存之前的变化。如果版本变化但 `latestPeriod` 相同，页面只说明数据发生修订，不把同一周期的修订伪装成季度变化。该能力称为 `Data update summary` 或 `Changes since your last visit`，不承诺每个区域在每个周期都有新观测。

### 5.4 账户与隐私

- 注册或登录只在用户选择云端保存时出现。
- 用户只能读取和修改自己的 saved areas、saved searches 和 release state。
- 用户可以删除单项保存内容、清除全部云端内容和删除账户。
- 账户删除必须移除用户业务数据和 Auth user，并清除本地 session。

## 6. 产品验收

### 6.1 V1 核心能力

用户可以：

- 搜索、筛选和排序全国可发布 SA2。
- 在地图与列表之间使用同一数据口径。
- 查看区域最新观测、历史趋势、Reported Bonds 和数据限制。
- 在统一 Dwelling Type、Bedroom Category 和 period 下比较最多四个区域。
- 通过 URL 恢复和分享公开筛选与比较状态。
- 从核心页面查到数据来源、版本、公式和已知限制。

### 6.2 V1 质量

- 桌面和移动端核心流程完整可用。
- 地图和图表具有清楚的文字或表格表达，以及明确的 loading、empty、partial 和 error 状态。
- 来源、版本、许可证、provisional 状态和计算方法可追踪。
- 不可用、稀疏或过期数据被明确标记，不生成虚构结果。
- URL 只包含公开筛选、地图和比较状态。
- 页面内容、视觉层级和交互达到可公开展示的作品集质量。

### 6.3 V2 核心能力

- 未登录用户继续完整使用 V1。
- 永久用户可以跨设备 CRUD 自己的 saved areas 和 saved searches。
- 新数据发布后可以在应用内查看关注区域的变化摘要。
- 用户不能读取或修改其他用户的保存内容。
- 用户可以清除云端数据并删除账户。

### 6.4 固定产品决策

| 决策 | 结果 |
|---|---|
| 产品定位 | New Zealand rental-area evidence explorer and comparison product |
| 租金统计地理 | Stats NZ SA2 2019 |
| 数据覆盖 | 全国；由有效 MBIE 观测与 SA2 geometry 的关联结果决定 |
| 核心官方数据 | MBIE Rental Bond Data + Stats NZ SA2 Higher Geographies 2019 |
| 当前租金 | 最新观测 Median Rent |
| 历史趋势 | Geometric Mean Rent |
| 数据覆盖解释 | Reported Bonds |
| V1 个性化 | 公开 URL 筛选和比较状态 |
| V2 云端能力 | Saved areas、saved searches、应用内数据更新摘要 |
