// 比较全国文件和 Region 分片的数据成本。
// 每组数据都由地图与历史两个 JSON 组成；应用 bundle 不随加载方式改变，因此不混入比较。

import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const comparisonDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/comparison/",
  import.meta.url,
);
const parseIterations = 7;

/**
 * 读取同一范围的地图和历史文件，并测量原始体积、gzip 体积与 JSON 解析时间。
 * @param {{label: string, mapFile: string, historyFile: string}} files
 */
async function measureDataset(files) {
  const [mapText, historyText] = await Promise.all([
    readFile(new URL(files.mapFile, comparisonDirectoryUrl), "utf8"),
    readFile(new URL(files.historyFile, comparisonDirectoryUrl), "utf8"),
  ]);

  const map = JSON.parse(mapText);
  const parseSamples = [];

  for (let iteration = 0; iteration < parseIterations; iteration += 1) {
    const startedAt = performance.now();
    JSON.parse(mapText);
    JSON.parse(historyText);
    parseSamples.push(performance.now() - startedAt);
  }

  return {
    label: files.label,
    areas: map.features.length,
    rawBytes: Buffer.byteLength(mapText) + Buffer.byteLength(historyText),
    gzipBytes:
      gzipSync(mapText).byteLength + gzipSync(historyText).byteLength,
    medianParseMs: median(parseSamples),
  };
}

/** @param {number[]} values */
function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

/** @param {Awaited<ReturnType<typeof measureDataset>>} dataset */
function present(dataset) {
  return {
    label: dataset.label,
    areas: dataset.areas,
    rawMiB: toMiB(dataset.rawBytes),
    gzipMiB: toMiB(dataset.gzipBytes),
    medianParseMs: Number(dataset.medianParseMs.toFixed(2)),
  };
}

/** @param {number} bytes */
function toMiB(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

async function main() {
  const index = JSON.parse(
    await readFile(new URL("regions/index.json", comparisonDirectoryUrl), "utf8"),
  );

  const national = await measureDataset({
    label: "New Zealand",
    mapFile: "national.geo.json",
    historyFile: "national-history.json",
  });

  const regions = await Promise.all(
    index.regions.map((region) => measureDataset({
      label: region.name,
      mapFile: `regions/${region.regionCode}.geo.json`,
      historyFile: `regions/${region.regionCode}-history.json`,
    })),
  );

  const byRawSize = [...regions].sort(
    (left, right) => left.rawBytes - right.rawBytes,
  );
  const smallest = byRawSize[0];
  const largest = byRawSize.at(-1);
  const waikato = regions.find((region) => region.label === "Waikato Region");

  if (!smallest || !largest || !waikato) {
    throw new Error("Could not select the Region comparison samples.");
  }

  console.log(JSON.stringify({
    parseIterations,
    national: present(national),
    regionSamples: {
      largest: present(largest),
      waikato: present(waikato),
      smallest: present(smallest),
    },
    waikatoComparedWithNational: {
      rawPercent: Number((waikato.rawBytes / national.rawBytes * 100).toFixed(1)),
      gzipPercent: Number((waikato.gzipBytes / national.gzipBytes * 100).toFixed(1)),
      parsePercent: Number((waikato.medianParseMs / national.medianParseMs * 100).toFixed(1)),
    },
  }, null, 2));
}

await main();
