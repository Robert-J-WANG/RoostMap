// 生成 Waikato 地图与图表样例数据。
//
// 输入：
//   - Stats NZ 的 SA2 边界（GeoPackage）
//   - MBIE 的季度租赁数据（CSV）
// 输出（写入 public/data/spike/map-chart/）：
//   - waikato.geo.json：SA2 边界，附带指定季度的租金指标，用于地图
//   - waikato-history.json：Waikato 各 SA2 的季度租金历史，用于图表

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

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

// 保存到 public 目录，供开发服务器通过 /data/spike/map-chart/ 提供文件。
const outputDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/",
  import.meta.url,
);

const regionName = "Waikato Region"; // 目标大区
const latestPeriod = "2026-04-01"; // 地图使用的季度
const initialSa2Id = "179900"; // 图表初始展示的 SA2
const dwellingType = "ALL"; // 住宅类型筛选
const bedroomCategory = "ALL"; // 卧室分类筛选

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

/**
 * 脚本入口，按数据流向依次执行：
 * 读取边界 → 扫描租金 CSV → 整理地图与各地区历史 → 输出核对摘要 → 写出文件。
 */
async function main() {
  // 1. 读取边界，并建立当前大区的 SA2 编号集合。
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const waikatoSa2Ids = new Set(geometryFeatures.map((feature) => feature.id));

  // 2. 扫描 CSV，取得地图指标、各地区历史和季度范围。
  const {
    mbieWaikatoSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(waikatoSa2Ids);

  // 3. 分别整理地图 features 和各地区季度历史。
  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    mbieWaikatoSa2Ids,
    currentMetrics,
  );
  const histories = buildHistories(
    mapFeatures,
    historyObservations,
    sortedPeriods,
  );

  // 4. 保留原有的数据核对摘要。
  const checkSummary = buildCheckSummary({
    geometryFeatures,
    mbieWaikatoSa2Ids,
    mapFeatures,
    currentMetrics,
    historyObservations,
  });
  console.log(JSON.stringify(checkSummary));

  // 5. 写出地图与大区历史文件，再打印生成摘要。
  const writeResult = await writeOutputFiles(
    mapFeatures,
    histories,
    sortedPeriods,
  );
  console.log(JSON.stringify(writeResult));
}

// main 依赖上面的配置常量，需等它们初始化完成后再执行。
await main();

// ─────────────────────────────────────────────
// 边界：读取 Stats NZ 的 SA2 数据并转换为 GeoJSON features
// ─────────────────────────────────────────────

/**
 * 使用 Node.js 内置 SQLite 接口，只读查询目标大区的 SA2 属性和边界。
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
    WHERE REGC2019_V1_00_NAME = ?
    ORDER BY SA22019_V1_00;
  `;

  const database = new DatabaseSync(statsNzFileUrl, { readOnly: true });

  try {
    return database.prepare(query).all(regionName);
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
// 租金：流式扫描 MBIE CSV，一次遍历收集三组结果
// ─────────────────────────────────────────────

/**
 * 流式扫描 MBIE CSV，同一次遍历收集四组结果：
 *   1. mbieWaikatoSa2Ids：MBIE 中出现过的 Waikato SA2 编号（关联范围，不限分类）
 *   2. currentMetrics：指定季度的地图指标，按 SA2 保存
 *   3. historyObservations：按 SA2 编号保存各地区的季度历史，数组按日期升序
 *   4. sortedPeriods：源文件中的季度日期，去重后按时间升序排列
 *
 * @param {Set<string>} waikatoSa2Ids 目标大区的 SA2 编号集合
 * @returns {Promise<{
 *   mbieWaikatoSa2Ids: Set<string>,
 *   currentMetrics: Map<string, {medianRent: number|null, reportedBonds: number|null}>,
 *   historyObservations: Map<string, {period: string, geometricMeanRent: number|null, reportedBonds: number|null}[]>,
 *   sortedPeriods: string[],
 * }>}
 */
async function scanMbieCsv(waikatoSa2Ids) {
  const mbieWaikatoSa2Ids = new Set();
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
    if (/^\d{6}$/.test(sa2Id) && waikatoSa2Ids.has(sa2Id)) {
      mbieWaikatoSa2Ids.add(sa2Id);
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
    if (period === latestPeriod && waikatoSa2Ids.has(sa2Id)) {
      currentMetrics.set(sa2Id, {
        medianRent: sourceNumber(record, "Median Rent"),
        reportedBonds,
      });
    }

    // 地区保留各季度的 Geometric Mean Rent 和 Reported Bonds。
    if (waikatoSa2Ids.has(sa2Id)) {
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
    mbieWaikatoSa2Ids,
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
 * @param {object[]} geometryFeatures 目标大区的全部边界 features
 * @param {Set<string>} mbieWaikatoSa2Ids MBIE 中出现过的 SA2 编号
 * @param {Map<string, object>} currentMetrics 指定季度的指标，按 SA2 索引
 * @returns {object[]} 附带 medianRent / reportedBonds 的 features
 */
function buildMapFeatures(
  geometryFeatures,
  mbieWaikatoSa2Ids,
  currentMetrics,
) {
  return geometryFeatures
    .filter(
      (feature) =>
        feature.geometry !== null && mbieWaikatoSa2Ids.has(feature.id),
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

// 按地图可选地区整理历史数组，保留缺失季度。
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

// ─────────────────────────────────────────────
// 输出：核对摘要
// ─────────────────────────────────────────────

/**
 * 生成核对摘要：数据源与可发布地区数量、缺失边界和缺失指标的数量、
 * 初始地区的当前指标、整区历史的地区数与记录总数，以及初始地区的历史区间。
 *
 * @param {object} data
 * @param {object[]} data.geometryFeatures 目标大区的全部边界 features
 * @param {Set<string>} data.mbieWaikatoSa2Ids MBIE 中出现过的 SA2 编号
 * @param {object[]} data.mapFeatures 可发布的地图 features
 * @param {Map<string, object>} data.currentMetrics 指定季度的指标
 * @param {Map<string, object[]>} data.historyObservations 各地区的历史观测
 * @returns {object}
 */
function buildCheckSummary({
  geometryFeatures,
  mbieWaikatoSa2Ids,
  mapFeatures,
  currentMetrics,
  historyObservations,
}) {
  const missingGeometryCount = geometryFeatures.filter(
    (feature) => feature.geometry === null,
  ).length;

  const initialMapFeature = mapFeatures.find(
    (feature) => feature.id === initialSa2Id,
  );
  // 摘要在使用数据时，从 Map 中取得初始地区的记录。
  const initialHistory = historyObservations.get(initialSa2Id) ?? [];

  // 统计所有地区在当前分类下的历史记录总数。
  let totalHistoryRecords = 0;
  for (const observations of historyObservations.values()) {
    totalHistoryRecords += observations.length;
  }

  return {
    region: regionName,
    sourceAreaCount: geometryFeatures.length,
    associatedAreaCount: mbieWaikatoSa2Ids.size,
    publishableAreaCount: mapFeatures.length,
    missingGeometry: missingGeometryCount,
    mapSlice: {
      period: latestPeriod,
      dwellingType,
      bedroomCategory,
      metricRecords: currentMetrics.size,
      missingMetricRecords: mapFeatures.length - currentMetrics.size,
      initialFeature: initialMapFeature
        ? {
          id: initialMapFeature.id,
          name: initialMapFeature.properties.name,
          medianRent: initialMapFeature.properties.medianRent,
          reportedBonds: initialMapFeature.properties.reportedBonds,
        }
        : null,
    },
    history: {
      areaCount: historyObservations.size,
      totalRecords: totalHistoryRecords,
      sa2Id: initialSa2Id,
      observations: initialHistory.length,
      start: initialHistory.at(0)?.period ?? null,
      end: initialHistory.at(-1)?.period ?? null,
    },
  };
}

// ─────────────────────────────────────────────
// 文件写入
// ─────────────────────────────────────────────

/**
 * 保存地图数据和大区历史数据，返回文件路径与覆盖范围。
 * @param {object[]} mapFeatures 地图可选地区的 features
 * @param {Object<string, object[]>} histories 按 SA2 编号保存的季度历史
 * @param {string[]} sortedPeriods 按时间升序排列的季度日期
 * @returns {Promise<object>} 文件路径、地区数量和季度范围
 */
async function writeOutputFiles(mapFeatures, histories, sortedPeriods) {
  const mapData = {
    type: "FeatureCollection",
    features: mapFeatures,
  };

  const historyData = {
    region: regionName,
    dwellingType,
    bedroomCategory,
    metric: "geometricMeanRent",
    periods: sortedPeriods,
    histories,
  };

  const mapFileUrl = new URL("waikato.geo.json", outputDirectoryUrl);
  const historyFileUrl = new URL("waikato-history.json", outputDirectoryUrl);

  await mkdir(outputDirectoryUrl, { recursive: true });
  await writeFile(mapFileUrl, JSON.stringify(mapData), "utf8");
  await writeFile(historyFileUrl, JSON.stringify(historyData), "utf8");

  return {
    mapFile: fileURLToPath(mapFileUrl),
    mapFeatures: mapData.features.length,
    historyFile: fileURLToPath(historyFileUrl),
    historyAreas: Object.keys(histories).length,
    periods: sortedPeriods.length,
    start: sortedPeriods.at(0),
    end: sortedPeriods.at(-1),
  };
}
