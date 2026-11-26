/* -------------- 发布的分类 -------------- */

// 发布的住宅类型和卧室数，顺序也是写出文件时的排列顺序。
// 其他源值（例如卧室数 0、6、8、15 和 NA）不发布。
export const publishedDwellingTypes = ["ALL", "Apartment", "Boarding House", "Flat", "House", "Room"];
export const publishedBedrooms = ["ALL", "1", "2", "3", "4", "5+"];

// 从这个季度起，MBIE（租金） 的 1 卧记录出现与全部类别不一致的跳升，判断为源分类变化。
// 12 个月变化的任一目标季度不早于这个季度时，1 卧的变化不计算。
const oneBedroomComparabilityBreak = "2024-10-01";

/* -------------- 转换和计算函数 -------------- */

/**
 * 判断一条 MBIE（租金） 记录的住宅类型和卧室数是否属于发布的分类。
 *
 * @param {Record<string, string>} record CSV 解析后的一条记录
 * @returns {boolean} 两个分类都在发布列表中时为 true
 */
export function isPublishedCategory(record) {
  return (
    publishedDwellingTypes.includes(record["Dwelling Type"]) &&
    publishedBedrooms.includes(record["Number Of Beds"])
  );
}

/**
 * 把一条 MBIE（租金） CSV 记录转换成一个季度的租金记录。
 * 数字文本转成数字，NULL 转成 null。
 *
 * @param {Record<string, string>} record CSV 解析后的一条记录，字段名和值都与源文件相同
 * @returns {{ dwellingType: string, bedrooms: string, period: string, reportedBonds: number | null,
 *   medianRent: number | null, geometricMeanRent: number | null }} 一个季度的租金记录
 */
export function convertToQuarterlyRent(record) {
  return {
    dwellingType: record["Dwelling Type"],
    bedrooms: record["Number Of Beds"],
    period: record.TimeFrame,
    reportedBonds: parseNullableNumber(record["Total Bonds"]),
    medianRent: parseNullableNumber(record["Median Rent"]),
    geometricMeanRent: parseNullableNumber(record["Geometric Mean Rent"]),
  };
}

/**
 * 把一条 Stats NZ（区域） SA2 记录转换成区域信息。
 *
 * @param {Record<string, string>} record 一条 SA2 记录，字段名与 GeoPackage 相同
 * @returns {object} SA2 编号和名称，以及所属 Region 和 territorial authority 的编号和名称，
 *   形状符合 contracts.ts 中的 areaSchema
 */
export function convertToArea(record) {
  return {
    sa2Id: record.SA22019_V1_00,
    name: record.SA22019_V1_00_NAME,
    regionCode: record.REGC2019_V1_00,
    regionName: record.REGC2019_V1_00_NAME,
    territorialAuthorityCode: record.TA2019_V1_00,
    territorialAuthorityName: record.TA2019_V1_00_NAME,
  };
}

/**
 * 计算一个 SA2 在一种住宅类型和卧室数下的当前租金和 12 个月变化。
 *
 * @param {object[]} quarterlyRents 这个 SA2 在同一分类下的全部季度租金记录，已按季度从旧到新排列，至少一条
 * @param {string} datasetLatestPeriod 整个 MBIE（租金） 数据集的最新季度，例如 "2026-04-01"
 * @returns {object} 当前租金，形状符合 contracts.ts 中的 currentRentSchema；没有数据的字段为 null
 */
export function buildCurrentRent(quarterlyRents, datasetLatestPeriod) {
  const { dwellingType, bedrooms } = quarterlyRents[0];

  // 当前租金：从最新季度往前，找到最后一个 Median Rent 不为 null 的季度。
  const latestObservedQuarter = quarterlyRents.findLast(
    (quarterlyRent) => quarterlyRent.medianRent !== null,
  );

  // 12 个月变化：比较数据集最新季度和上一年同一季度的 Geometric Mean Rent。
  // 这个季度没有记录，或者记录中的租金为 null，都得到 null。
  const lastYearPeriod = getSameQuarterLastYear(datasetLatestPeriod);
  const currentQuarter = quarterlyRents.find(
    (quarterlyRent) => quarterlyRent.period === datasetLatestPeriod,
  );
  const lastYearQuarter = quarterlyRents.find(
    (quarterlyRent) => quarterlyRent.period === lastYearPeriod,
  );
  const currentGeometricMeanRent = currentQuarter?.geometricMeanRent ?? null;
  const lastYearGeometricMeanRent = lastYearQuarter?.geometricMeanRent ?? null;

  // 1 卧：数据集最新季度不早于分界季度时，跨越分界的比较没有意义，变化为 null。
  const crossesOneBedroomBreak =
    bedrooms === "1" && datasetLatestPeriod >= oneBedroomComparabilityBreak;

  return {
    dwellingType,
    bedrooms,
    datasetLatestPeriod,
    // 季度、Median Rent 和 Reported Bonds 都取自同一条记录；从未有过租金时全部为 null。
    observationPeriod: latestObservedQuarter?.period ?? null,
    medianRent: latestObservedQuarter?.medianRent ?? null,
    reportedBonds: latestObservedQuarter?.reportedBonds ?? null,
    // 两个季度都有租金才计算变化，否则为 null。
    yearOverYearChange:
      !crossesOneBedroomBreak &&
      currentGeometricMeanRent !== null &&
      lastYearGeometricMeanRent !== null
        ? roundChange(currentGeometricMeanRent / lastYearGeometricMeanRent - 1)
        : null,
  };
}

/**
 * 把一个 Region 的 Stats NZ（区域） 记录和 MBIE（租金） 记录按 SA2 编号连接起来，
 * 得到这个 Region 可发布区域的列表，每个区域带有各分类的当前租金。
 * 可发布区域是在发布的分类中，至少有一条 Median Rent 不为 null 的记录的 SA2。
 *
 * @param {object} input
 * @param {Record<string, string>[]} input.statsNzRecords 这个 Region 全部 SA2 的 Stats NZ（区域） 记录
 * @param {Record<string, string>[]} input.mbieRecords MBIE（租金） 记录，可以包含其他 Region 和所有分类
 * @param {string} input.datasetLatestPeriod 整个 MBIE（租金） 数据集的最新季度
 * @returns {object[]} 可发布区域，按 SA2 编号排序，每个元素形状符合 contracts.ts 中的 areaWithCurrentRentsSchema
 */
export function buildAreasWithCurrentRents({ statsNzRecords, mbieRecords, datasetLatestPeriod }) {
  // 1. 确定这个 Region 的 SA2：转换区域记录，记下全部 SA2 编号。
  const areas = statsNzRecords.map((record) => convertToArea(record));
  const regionSa2Ids = new Set(areas.map((area) => area.sa2Id));

  // 2. 按 SA2 和分类收集租金记录：只读一遍 MBIE（租金） 记录。
  const publishableSa2Ids = new Set();
  const quarterlyRentsBySa2Id = new Map();

  for (const record of mbieRecords) {
    const sa2Id = record["Location Id"];

    // 不属于这个 Region 的编号（包括 -99 和 NULL）和不发布的分类都跳过。
    if (!regionSa2Ids.has(sa2Id) || !isPublishedCategory(record)) {
      continue;
    }

    // 发布的分类中有一条 Median Rent 不为 null 的记录，这个 SA2 就可以发布。
    const quarterlyRent = convertToQuarterlyRent(record);
    if (quarterlyRent.medianRent !== null) {
      publishableSa2Ids.add(sa2Id);
    }

    if (!quarterlyRentsBySa2Id.has(sa2Id)) {
      quarterlyRentsBySa2Id.set(sa2Id, []);
    }
    quarterlyRentsBySa2Id.get(sa2Id).push(quarterlyRent);
  }

  // 3. 确定可发布区域：有有效租金的 SA2，按编号排序。
  const publishedAreas = areas
    .filter((area) => publishableSa2Ids.has(area.sa2Id))
    .sort((left, right) => left.sa2Id.localeCompare(right.sa2Id));

  // 4. 计算每个可发布区域在各分类下的当前租金。
  // 记录排序后按分类分组，Map 保留插入顺序，所以分类也按发布顺序排列。
  // 只计算有记录的分类；没有记录的分类不出现，页面显示为缺失。
  return publishedAreas.map((area) => {
    const rentsByCategory = new Map();

    for (const quarterlyRent of sortQuarterlyRents(quarterlyRentsBySa2Id.get(area.sa2Id))) {
      const category = `${quarterlyRent.dwellingType}|${quarterlyRent.bedrooms}`;

      if (!rentsByCategory.has(category)) {
        rentsByCategory.set(category, []);
      }
      rentsByCategory.get(category).push(quarterlyRent);
    }

    const currentRents = [...rentsByCategory.values()].map((categoryRents) =>
      buildCurrentRent(categoryRents, datasetLatestPeriod),
    );

    return { ...area, currentRents };
  });
}

/**
 * 按发布分类的顺序、再按季度从旧到新排列季度租金记录，使输出不依赖源记录的顺序。
 *
 * @param {object[]} quarterlyRents 季度租金记录
 * @returns {object[]} 排好序的新数组
 */
export function sortQuarterlyRents(quarterlyRents) {
  return [...quarterlyRents].sort(
    (left, right) =>
      publishedDwellingTypes.indexOf(left.dwellingType) -
        publishedDwellingTypes.indexOf(right.dwellingType) ||
      publishedBedrooms.indexOf(left.bedrooms) - publishedBedrooms.indexOf(right.bedrooms) ||
      left.period.localeCompare(right.period),
  );
}

/* -------------- 辅助函数 -------------- */

// MBIE（租金） 用 NULL 表示没有统计值；空字符串同样视为缺失，都转成 null。
function parseNullableNumber(value) {
  return value === "NULL" || value === "" ? null : Number(value);
}

// 返回上一年的同一季度，例如 2026-04-01 → 2025-04-01。
function getSameQuarterLastYear(period) {
  const year = Number(period.slice(0, 4));
  return `${year - 1}${period.slice(4)}`;
}

// 变化率四舍五入到 4 位小数，去掉浮点误差，例如 0.050000000000000044 → 0.05。
function roundChange(value) {
  return Math.round(value * 10000) / 10000;
}
