// 准备全国地图与历史数据，并按官方 Region 编号生成比较分片。
// 输入：Stats NZ SA2 边界与 MBIE 季度 CSV。
// 输出：comparison/ 下的全国文件、各大区文件与 regions/index.json。

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import { parse } from "csv-parse";
import wkx from "wkx";

// ─────────────────────────────────────────────
// 配置：数据源路径、输出路径与本次样例的筛选条件
// ─────────────────────────────────────────────

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

const outputDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/comparison/",
  import.meta.url,
);

const latestPeriod = "2026-04-01"; // 地图使用的季度
const dwellingType = "ALL"; // 住宅类型筛选
const bedroomCategory = "ALL"; // 卧室分类筛选

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

/**
 * 脚本入口，按数据流向依次执行：
 * 读取全国边界 → 关联租金与历史 → 写出全国文件 → 按 Region 写出同一批记录。
 */
async function main() {
  // 读取全国边界，用 SA2 编号集合限定 CSV 关联范围。
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));
  const {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(sa2Ids);

  // 地图保留有边界且在 MBIE 出现过的地区，历史使用相同的地区集合。
  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    matchedSa2Ids,
    currentMetrics,
  );
  const histories = buildHistories(
    mapFeatures,
    historyObservations,
    sortedPeriods,
  );

  console.log(JSON.stringify({
    sourceAreas: geometryFeatures.length,
    matchedAreas: matchedSa2Ids.size,
    mapAreas: mapFeatures.length,
    historyAreas: Object.keys(histories).length,
    periods: sortedPeriods.length,
  }, null, 2));

  // 全国文件与分片取自同一批数据，保证比较时内容一致。
  await mkdir(outputDirectoryUrl, { recursive: true });
  const national = await writeDataset(
    "national", "New Zealand", mapFeatures, histories, sortedPeriods,
  );
  console.log(JSON.stringify(national, null, 2));

  // 按官方 Region 编号分组；每个大区分别写出地图和历史。
  const regions = groupFeaturesByRegion(mapFeatures);
  await mkdir(new URL("regions/", outputDirectoryUrl), { recursive: true });
  const regionFiles = [];

  for (const { regionCode, name, features } of regions) {
    // 按当前大区的 SA2 编号取出历史，与该大区地图保持一一对应。
    const regionHistories = Object.fromEntries(
      features.map((feature) => [feature.id, histories[feature.id]]),
    );
    const files = await writeDataset(
      `regions/${regionCode}`, name, features, regionHistories, sortedPeriods,
    );
    regionFiles.push({ regionCode, name, ...files });
  }

  // 保存大区编号、名称与文件路径，供按大区定位数据文件。
  const index = {
    period: latestPeriod,
    dwellingType,
    bedroomCategory,
    regions: regionFiles,
  };
  await writeFile(
    new URL("regions/index.json", outputDirectoryUrl),
    JSON.stringify(index),
    "utf8",
  );
  console.log(JSON.stringify({
    nationalAreas: mapFeatures.length,
    partitionAreas: regionFiles.reduce((sum, region) => sum + region.areaCount, 0),
    regions: regionFiles.length,
  }, null, 2));
}

// main 依赖上面的配置常量，需等它们初始化完成后再执行。
await main();

// ─────────────────────────────────────────────
// 边界：读取 Stats NZ 的 SA2 数据并转换为 GeoJSON features
// ─────────────────────────────────────────────

/**
 * 使用 Node.js 内置 SQLite 接口，只读查询全国 SA2 属性和边界。
 * geom 二进制字段直接返回 Uint8Array，供后续解析为 GeoJSON。
 * @returns {object[]} 数据库行对象数组
 */
function readStatsNzRows() {
  const query = `
    SELECT
      SA22019_V1_00 AS sa2Id,
      SA22019_V1_00_NAME AS name,
      TA2019_V1_00_NAME AS territorialAuthority,
      REGC2019_V1_00 AS regionCode,
      REGC2019_V1_00_NAME AS region,
      LAND_AREA_SQ_KM AS landAreaSqKm,
      geom
    FROM statistical_area_2_higher_geographies_2019_generalised
    ORDER BY SA22019_V1_00;
  `;

  const database = new DatabaseSync(statsNzFileUrl, { readOnly: true });

  try {
    return database.prepare(query).all();
  } finally {
    database.close();
  }
}

/**
 * 将一行 SA2 数据库记录转换为 GeoJSON feature。
 * SA2 编号保持字符串，供后续与租金数据关联和地图选择使用。
 * @param {object} row readStatsNzRows 返回的一行记录
 * @returns {object} GeoJSON feature
 */
function toGeometryFeature(row) {
  const sa2Id = String(row.sa2Id).trim();

  return {
    type: "Feature",
    id: sa2Id,
    geometry: row.geom?.byteLength
      ? wkx.Geometry.parse(geoPackageWkb(row.geom)).toGeoJSON()
      : null,
    properties: {
      sa2Id,
      name: row.name,
      territorialAuthority: row.territorialAuthority,
      regionCode: String(row.regionCode).trim(),
      region: row.region,
      landAreaSqKm: Number(row.landAreaSqKm),
    },
  };
}

/**
 * 从 GeoPackage 几何数据中取出 WKB，供 wkx 解析。
 *
 * GeoPackage 几何由「头部 + 可选 envelope + WKB」组成：
 *   - 固定头部 8 字节：魔数 "GP"(2) + 版本(1) + flags(1) + SRS ID(4)
 *   - flags 的第 1~3 位表示 envelope 类型，决定 envelope 的坐标个数
 *   - envelope 中每个坐标值占 8 字节
 *
 * @param {Uint8Array} geometryBytes 从 geom 字段读取的 GeoPackage 几何字节
 * @returns {Buffer} 去掉头部和 envelope 之后的 WKB
 */
function geoPackageWkb(geometryBytes) {
  // 将字节数组转为 Buffer，以读取头部并截取 WKB，字节内容保持不变。
  const geometryBuffer = Buffer.from(geometryBytes);

  if (
    geometryBuffer.length < 8 ||
    geometryBuffer.toString("ascii", 0, 2) !== "GP"
  ) {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const flags = geometryBuffer.readUInt8(3);
  const envelopeType = (flags >> 1) & 0b111;

  // 下标即 envelope 类型：0 无、1 XY、2 XYZ、3 XYM、4 XYZM。
  const envelopeCoordinateCounts = [0, 4, 6, 6, 8];
  const envelopeCoordinateCount = envelopeCoordinateCounts[envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  const headerLength = 8 + envelopeCoordinateCount * 8;
  return geometryBuffer.subarray(headerLength);
}

// ─────────────────────────────────────────────
// 租金：流式扫描 MBIE CSV，一次遍历收集四组结果
// ─────────────────────────────────────────────

/**
 * 流式扫描 MBIE CSV，同一次遍历收集四组结果：
 *   1. matchedSa2Ids：MBIE 中出现过的本次范围内 SA2 编号（关联范围，不限分类）
 *   2. currentMetrics：指定季度的地图指标，按 SA2 保存
 *   3. historyObservations：按 SA2 编号保存各地区的季度历史，数组按日期升序
 *   4. sortedPeriods：源文件中的季度日期，去重后按时间升序排列
 *
 * @param {Set<string>} sa2Ids 本次读取的全国 SA2 编号集合
 * @returns {Promise<{
 *   matchedSa2Ids: Set<string>,
 *   currentMetrics: Map<string, {medianRent: number|null, reportedBonds: number|null}>,
 *   historyObservations: Map<string, {period: string, geometricMeanRent: number|null, reportedBonds: number|null}[]>,
 *   sortedPeriods: string[],
 * }>}
 */
async function scanMbieCsv(sa2Ids) {
  const matchedSa2Ids = new Set();
  const currentMetrics = new Map();
  const historyObservations = new Map();
  // 收集源文件的全部季度，供各地区历史按同一时间范围排列。
  const periods = new Set();

  // 流式读取 CSV，按表头将每一行解析成字段对象。
  const parser = createReadStream(mbieFileUrl).pipe(
    parse({
      bom: true,
      columns: true,
      skip_empty_lines: true,
    }),
  );

  // parser 是异步数据流，for await 会等待下一条记录，直到文件读取结束。
  for await (const record of parser) {
    const period = sourceValue(record, "TimeFrame");
    periods.add(period);
    const sa2Id = sourceValue(record, "Location Id");
    const recordDwellingType = sourceValue(record, "Dwelling Type");
    const recordBedroomCategory = sourceValue(record, "Number Of Beds");

    // 关联范围统计所有分类，因此在住宅类型和卧室分类筛选之前收集编号。
    if (/^\d{6}$/.test(sa2Id) && sa2Ids.has(sa2Id)) {
      matchedSa2Ids.add(sa2Id);
    }

    // 后续地图指标和历史记录使用本次指定的住宅类型与卧室分类。
    if (
      recordDwellingType !== dwellingType ||
      recordBedroomCategory !== bedroomCategory
    ) {
      continue;
    }

    const reportedBonds = sourceNumber(record, "Total Bonds");

    // 地图只取指定季度，按 SA2 保存 Median Rent 和 Reported Bonds。
    if (period === latestPeriod && sa2Ids.has(sa2Id)) {
      currentMetrics.set(sa2Id, {
        medianRent: sourceNumber(record, "Median Rent"),
        reportedBonds,
      });
    }

    // 地区保留各季度的 Geometric Mean Rent 和 Reported Bonds。
    if (sa2Ids.has(sa2Id)) {
      let observations = historyObservations.get(sa2Id);

      if (!observations) {
        observations = [];
        historyObservations.set(sa2Id, observations);
      }

      observations.push({
        period,
        geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
        reportedBonds,
      });
    }
  }

  // Map 中每个值都是一个地区的记录数组，分别按季度升序排列。
  for (const observations of historyObservations.values()) {
    observations.sort((left, right) =>
      left.period.localeCompare(right.period),
    );
  }

  const sortedPeriods = [...periods].sort();

  return {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  };
}

/**
 * 读取 CSV 字段并去掉两端空白；字段不存在时按空字符串处理。
 * @param {object} record CSV 解析出的一行记录
 * @param {string} field 字段名（CSV 表头）
 * @returns {string}
 */
function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

/**
 * 读取 CSV 数值字段。
 * 来源中的空值（空字符串或 "NULL"）返回 null 而不是 0，
 * 避免「无数据」被误当成「数值为零」；非数字内容直接抛错。
 * @param {object} record CSV 解析出的一行记录
 * @param {string} field 字段名（CSV 表头）
 * @returns {number|null}
 */
function sourceNumber(record, field) {
  const value = sourceValue(record, field);

  if (value === "" || value === "NULL") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return number;
}

// ─────────────────────────────────────────────
// 组装：合并边界与指标，生成可发布的地图 features
// ─────────────────────────────────────────────

/**
 * 生成可发布的地图 features。
 * 发布范围要求同时具有边界和 MBIE 观测，不以当前季度是否有指标为条件；
 * 当前指标按 SA2 附加到边界属性上，没有指标的地区保留 null。
 *
 * @param {object[]} geometryFeatures 全国边界 features
 * @param {Set<string>} matchedSa2Ids MBIE 中出现过的 SA2 编号
 * @param {Map<string, object>} currentMetrics 指定季度的指标，按 SA2 索引
 * @returns {object[]} 附带 medianRent / reportedBonds 的 features
 */
function buildMapFeatures(
  geometryFeatures,
  matchedSa2Ids,
  currentMetrics,
) {
  return geometryFeatures
    .filter(
      (feature) =>
        feature.geometry !== null && matchedSa2Ids.has(feature.id),
    )
    .map((feature) => {
      const metric = currentMetrics.get(feature.id);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          medianRent: metric?.medianRent ?? null,
          reportedBonds: metric?.reportedBonds ?? null,
        },
      };
    });
}

// 按地图可选地区整理历史：已有观测按完整季度轴补 null，没有任何观测则保留空数组。
function buildHistories(mapFeatures, historyObservations, sortedPeriods) {
  const histories = {};

  for (const feature of mapFeatures) {
    const areaObservations = historyObservations.get(feature.id) ?? [];
    const observedQuarters = new Map(
      areaObservations.map((observation) => [
        observation.period,
        observation,
      ]),
    );

    histories[feature.id] = observedQuarters.size === 0
      ? []
      : sortedPeriods.map((period) =>
        observedQuarters.get(period) ?? {
          period,
          geometricMeanRent: null,
          reportedBonds: null,
        },
      );
  }

  return histories;
}

// 分组只调整记录的归属，不重新计算坐标、租金或季度历史。
function groupFeaturesByRegion(mapFeatures) {
  const regions = new Map();

  for (const feature of mapFeatures) {
    const { regionCode, region } = feature.properties;
    if (!regions.has(regionCode)) {
      regions.set(regionCode, { regionCode, name: region, features: [] });
    }
    regions.get(regionCode).features.push(feature);
  }

  return [...regions.values()].sort((left, right) =>
    left.regionCode.localeCompare(right.regionCode),
  );
}

// 为一组地区写出地图和历史；fileStem 决定文件名前缀。
async function writeDataset(fileStem, region, features, histories, periods) {
  const mapFile = `${fileStem}.geo.json`;
  const historyFile = `${fileStem}-history.json`;
  const mapData = { type: "FeatureCollection", features };
  const historyData = {
    region,
    dwellingType,
    bedroomCategory,
    metric: "geometricMeanRent",
    periods,
    histories,
  };

  await writeFile(
    new URL(mapFile, outputDirectoryUrl),
    JSON.stringify(mapData),
    "utf8",
  );
  await writeFile(
    new URL(historyFile, outputDirectoryUrl),
    JSON.stringify(historyData),
    "utf8",
  );

  return {
    areaCount: features.length,
    mapFile: `/data/spike/map-chart/comparison/${mapFile}`,
    historyFile: `/data/spike/map-chart/comparison/${historyFile}`,
  };
}
