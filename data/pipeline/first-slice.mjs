/* -------------- 固定分类 -------------- */

// 只计算 MBIE（租金） 中“全部住宅类型、全部卧室数”这一种分类的租金。
const defaultDwellingType = "ALL";
const defaultBedrooms = "ALL";

/* -------------- 转换和计算函数 -------------- */

/**
 * 把一条 MBIE（租金） CSV 记录转换成一个季度的租金记录。
 * 只保留计算当前租金需要的季度和三个数值；数字文本转成数字，NULL 转成 null。
 *
 * @param {Record<string, string>} record CSV 解析后的一条记录，字段名和值都与源文件相同
 * @returns {{ period: string, reportedBonds: number | null, medianRent: number | null, geometricMeanRent: number | null }}
 *   一个季度的租金记录
 */
export function convertToQuarterlyRent(record) {
  return {
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
 * 计算一个 SA2 的当前租金和 12 个月变化。
 *
 * @param {object[]} quarterlyRents 这个 SA2 的全部 ALL / ALL 季度租金记录，已按季度从旧到新排列
 * @param {string} datasetLatestPeriod 整个 MBIE（租金） 数据集的最新季度，例如 "2026-04-01"
 * @returns {object} 当前租金，形状符合 contracts.ts 中的 currentRentSchema；没有数据的字段为 null
 */
export function buildCurrentRent(quarterlyRents, datasetLatestPeriod) {
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

  return {
    datasetLatestPeriod,
    // 季度、Median Rent 和 Reported Bonds 都取自同一条记录；从未有过租金时全部为 null。
    observationPeriod: latestObservedQuarter?.period ?? null,
    medianRent: latestObservedQuarter?.medianRent ?? null,
    reportedBonds: latestObservedQuarter?.reportedBonds ?? null,
    // 两个季度都有租金才计算变化，否则为 null。
    yearOverYearChange:
      currentGeometricMeanRent !== null && lastYearGeometricMeanRent !== null
        ? roundChange(currentGeometricMeanRent / lastYearGeometricMeanRent - 1)
        : null,
  };
}

/**
 * 把一个 Region 的 Stats NZ（区域） 记录和 MBIE（租金） 记录按 SA2 编号连接起来，
 * 得到这个 Region 可发布区域的列表，每个区域带有当前租金。
 * 可发布区域是至少有一条 Median Rent 不为 null 的记录的 SA2。
 *
 * @param {object} input
 * @param {Record<string, string>[]} input.statsNzRecords 这个 Region 全部 SA2 的 Stats NZ（区域） 记录
 * @param {Record<string, string>[]} input.mbieRecords MBIE（租金） 记录，可以包含其他 Region 和所有分类
 * @param {string} input.datasetLatestPeriod 整个 MBIE（租金） 数据集的最新季度
 * @returns {object[]} 可发布区域，按 SA2 编号排序，每个元素形状符合 contracts.ts 中的 areaWithCurrentRentSchema
 */
export function buildAreasWithCurrentRent({ statsNzRecords, mbieRecords, datasetLatestPeriod }) {
  // 1. 确定这个 Region 的 SA2：转换区域记录，记下全部 SA2 编号。
  const areas = statsNzRecords.map((record) => convertToArea(record));
  const regionSa2Ids = new Set(areas.map((area) => area.sa2Id));

  // 2. 按 SA2 收集租金记录：只读一遍 MBIE（租金） 记录。
  const publishableSa2Ids = new Set();
  const quarterlyRentsBySa2Id = new Map();

  for (const record of mbieRecords) {
    const sa2Id = record["Location Id"];

    // 不属于这个 Region 的编号（包括 -99 和 NULL）跳过。
    if (!regionSa2Ids.has(sa2Id)) {
      continue;
    }

    // 任意住宅类型和卧室数中有一条 Median Rent 不为 null 的记录，这个 SA2 就可以发布。
    if (parseNullableNumber(record["Median Rent"]) !== null) {
      publishableSa2Ids.add(sa2Id);
    }

    // 只有 ALL / ALL 记录转换后放进这个 SA2 的列表，用于计算当前租金。
    if (
      record["Dwelling Type"] === defaultDwellingType &&
      record["Number Of Beds"] === defaultBedrooms
    ) {
      if (!quarterlyRentsBySa2Id.has(sa2Id)) {
        quarterlyRentsBySa2Id.set(sa2Id, []);
      }
      quarterlyRentsBySa2Id.get(sa2Id).push(convertToQuarterlyRent(record));
    }
  }

  // 3. 确定可发布区域：有有效租金的 SA2，按编号排序。
  const publishedAreas = areas
    .filter((area) => publishableSa2Ids.has(area.sa2Id))
    .sort((left, right) => left.sa2Id.localeCompare(right.sa2Id));

  // 4. 计算每个可发布区域的当前租金：租金记录先按季度从旧到新排序。
  // 没有 ALL / ALL 记录的可发布区域使用空列表，当前租金中的数值都为 null。
  const areasWithCurrentRent = [];

  for (const area of publishedAreas) {
    const quarterlyRents = quarterlyRentsBySa2Id.get(area.sa2Id) ?? [];
    quarterlyRents.sort((left, right) => left.period.localeCompare(right.period));

    areasWithCurrentRent.push({
      ...area,
      currentRent: buildCurrentRent(quarterlyRents, datasetLatestPeriod),
    });
  }

  return areasWithCurrentRent;
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
