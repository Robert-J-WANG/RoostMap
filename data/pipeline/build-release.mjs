// 生成一个版本化 data release：
// 先确认源文件与 data/source-lock.json 一致，再为指定 Region 写出当前租金、边界和 manifest。
//
// 用法：npm run data:release

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

import { parse } from "csv-parse/sync";

import { buildAreasWithCurrentRent } from "./current-rents.mjs";
import { convertToGeometryFeature } from "./geometry.mjs";

/* -------------- 配置 -------------- */

// 本次 release 包含的 Region 编号。
const regionCodes = ["03"];

const repositoryRootUrl = new URL("../../", import.meta.url);
const publicDataUrl = new URL("public/data/", repositoryRootUrl);

/* -------------- 主流程 -------------- */

const sourceLock = JSON.parse(
  await readFile(new URL("data/source-lock.json", repositoryRootUrl), "utf8"),
);
const { version, generatedAt } = sourceLock.release;

// 1. 确认源文件与 source lock 一致。
const mbieFile = await readLockedSource("mbie-rental");
const statsNzFile = await readLockedSource("stats-sa2-2019");

// 2. 读取全部 MBIE（租金） 记录，取得数据集最新季度。
const mbieRecords = parse(mbieFile.content, {
  bom: true,
  columns: true,
  skip_empty_lines: true,
});
const datasetLatestPeriod = getLatestPeriod(mbieRecords);

// 3. 为每个 Region 写出当前租金和边界。
const releaseUrl = new URL(`releases/${version}/`, publicDataUrl);
const partitions = [];

for (const regionCode of regionCodes) {
  const statsNzRecords = readRegionRecords(statsNzFile.url, regionCode);
  const areasWithCurrentRent = buildAreasWithCurrentRent({
    statsNzRecords,
    mbieRecords,
    datasetLatestPeriod,
  });

  // 边界只包含可发布区域，地图与列表使用同一组 SA2。
  const publishedSa2Ids = new Set(areasWithCurrentRent.map((area) => area.sa2Id));
  const geometry = {
    type: "FeatureCollection",
    features: statsNzRecords
      .filter((record) => publishedSa2Ids.has(record.SA22019_V1_00))
      .map((record) => convertToGeometryFeature(record)),
  };

  const currentRentsPath = `areas/current-rents/${regionCode}.json`;
  const geometryPath = `geometry/regions/${regionCode}.geo.json`;
  await writeJson(new URL(currentRentsPath, releaseUrl), areasWithCurrentRent);
  await writeJson(new URL(geometryPath, releaseUrl), geometry);

  partitions.push({
    id: regionCode,
    name: statsNzRecords[0].REGC2019_V1_00_NAME,
    areaCount: areasWithCurrentRent.length,
    currentRentsUrl: `/data/releases/${version}/${currentRentsPath}`,
    geometryUrl: `/data/releases/${version}/${geometryPath}`,
  });
}

// 4. 写出版本目录中的 manifest，以及指向当前版本的顶层 manifest。
// 租金数据的状态和说明、各来源的名称、地址、许可证、下载日期和 SHA-256 都取自 source lock，
// 页面据此注明来源，Methodology 据此说明数据由哪个源文件生成。
const mbieSource = sourceLock.sources.find((source) => source.id === "mbie-rental");
const manifest = {
  version,
  generatedAt,
  latestPeriod: datasetLatestPeriod,
  partitions,
  rentalDataStatus: mbieSource.status,
  rentalDataNotice: mbieSource.notice ?? null,
  sources: sourceLock.sources.map(({ id, name, url, licence, retrievedAt, sha256 }) => ({
    id,
    name,
    url,
    licence,
    retrievedAt,
    sha256,
  })),
};
await writeJson(new URL("manifest.json", releaseUrl), manifest);
await writeJson(new URL("manifest.json", publicDataUrl), manifest);

console.log(JSON.stringify({ version, latestPeriod: datasetLatestPeriod, partitions }, null, 2));

/* -------------- 辅助函数 -------------- */

/**
 * 读取 source lock 中的一个源文件，并确认它的 SHA-256 与锁定值相同。
 *
 * @param {string} sourceId source lock 中的来源编号，例如 "mbie-rental"
 * @returns {Promise<{ url: URL, content: Buffer }>} 文件位置和文件内容
 * @throws {Error} SHA-256 与锁定值不同时停止生成
 */
async function readLockedSource(sourceId) {
  const source = sourceLock.sources.find((item) => item.id === sourceId);
  const url = new URL(source.path, repositoryRootUrl);
  const content = await readFile(url);
  const sha256 = createHash("sha256").update(content).digest("hex");

  if (sha256 !== source.sha256) {
    throw new Error(
      `${sourceId} does not match data/source-lock.json: expected ${source.sha256}, got ${sha256}`,
    );
  }

  return { url, content };
}

/**
 * 找出 MBIE（租金） 记录中最新的季度。
 * 季度是 YYYY-MM-DD 文本，文本顺序就是时间顺序，因此可以直接比较。
 *
 * @param {Record<string, string>[]} records CSV 解析后的 MBIE（租金） 记录
 * @returns {string} 最新季度，例如 "2026-04-01"
 */
function getLatestPeriod(records) {
  let latestPeriod = records[0].TimeFrame;

  for (const record of records) {
    if (record.TimeFrame > latestPeriod) {
      latestPeriod = record.TimeFrame;
    }
  }

  return latestPeriod;
}

/**
 * 从 GeoPackage 只读查询一个 Region 的全部 SA2。
 *
 * @param {URL} geoPackageUrl GeoPackage 文件位置
 * @param {string} regionCode Region 编号，例如 "03"
 * @returns {object[]} SA2 记录，按 SA2 编号排序；字段名与 GeoPackage 相同，geom 为边界字节
 */
function readRegionRecords(geoPackageUrl, regionCode) {
  const database = new DatabaseSync(geoPackageUrl, { readOnly: true });

  try {
    return database
      .prepare(
        `SELECT SA22019_V1_00, SA22019_V1_00_NAME, REGC2019_V1_00, REGC2019_V1_00_NAME,
                TA2019_V1_00, TA2019_V1_00_NAME, geom
         FROM statistical_area_2_higher_geographies_2019_generalised
         WHERE REGC2019_V1_00 = ?
         ORDER BY SA22019_V1_00`,
      )
      .all(regionCode);
  } finally {
    database.close();
  }
}

/**
 * 把数据写成紧凑 JSON；所在目录不存在时先创建。
 *
 * @param {URL} fileUrl 输出文件位置
 * @param {unknown} data 要写出的数据
 * @returns {Promise<void>}
 */
async function writeJson(fileUrl, data) {
  await mkdir(new URL("./", fileUrl), { recursive: true });
  await writeFile(fileUrl, JSON.stringify(data));
}
