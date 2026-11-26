// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  areaWithCurrentRentsSchema,
  manifestSchema,
  regionGeometrySchema,
  regionRentHistorySchema,
} from "@/data/contracts";

// 读取 public 目录中的 JSON；参数是页面请求时使用的路径，例如 /data/manifest.json。
function readPublishedJson(path) {
  return JSON.parse(
    readFileSync(new URL(`../../public${path}`, import.meta.url), "utf8"),
  );
}

// 读取 manifest 和每个 Region 的三个文件。
const manifest = readPublishedJson("/data/manifest.json");
const regions = manifest.partitions.map((partition) => ({
  partition,
  currentRents: readPublishedJson(partition.currentRentsUrl),
  geometry: readPublishedJson(partition.geometryUrl),
  rentHistory: readPublishedJson(partition.rentHistoryUrl),
}));

// 在全国数据中找到一个 SA2 在指定分类下的当前租金。
function findCurrentRent(sa2Id, dwellingType, bedrooms) {
  const area = regions
    .flatMap((region) => region.currentRents)
    .find((item) => item.sa2Id === sa2Id);

  return area.currentRents.find(
    (currentRent) =>
      currentRent.dwellingType === dwellingType && currentRent.bedrooms === bedrooms,
  );
}

describe("data release", () => {
  it("points every file in the manifest at the same release version", () => {
    for (const { partition } of regions) {
      expect(partition.currentRentsUrl).toContain(`/releases/${manifest.version}/`);
      expect(partition.geometryUrl).toContain(`/releases/${manifest.version}/`);
      expect(partition.rentHistoryUrl).toContain(`/releases/${manifest.version}/`);
    }
  });

  it("publishes a manifest and Region files that satisfy the contract", () => {
    manifestSchema.parse(manifest);

    for (const region of regions) {
      for (const row of region.currentRents) {
        areaWithCurrentRentsSchema.parse(row);
      }
      regionGeometrySchema.parse(region.geometry);
      regionRentHistorySchema.parse(region.rentHistory);
    }
  });

  it("uses the same areas in each Region's current rents, geometry and rent history", () => {
    for (const { partition, currentRents, geometry, rentHistory } of regions) {
      const sa2Ids = currentRents.map((area) => area.sa2Id);

      expect(currentRents).toHaveLength(partition.areaCount);
      expect(geometry.features.map((feature) => feature.id)).toEqual(sa2Ids);
      expect(Object.keys(rentHistory)).toEqual(sa2Ids);
    }
  });

  it("publishes each SA2 in only one Region", () => {
    const sa2Ids = regions.flatMap((region) => region.currentRents.map((area) => area.sa2Id));

    expect(new Set(sa2Ids).size).toBe(sa2Ids.length);
  });

  it("copies the rental data status and sources from the source lock", () => {
    const sourceLock = JSON.parse(
      readFileSync(new URL("../source-lock.json", import.meta.url), "utf8"),
    );
    const mbieSource = sourceLock.sources.find((source) => source.id === "mbie-rental");

    expect(manifest.rentalDataStatus).toBe(mbieSource.status);
    expect(manifest.rentalDataNotice).toBe(mbieSource.notice);
    expect(manifest.sources).toEqual(
      sourceLock.sources.map(({ id, name, url, licence, retrievedAt, sha256 }) => ({
        id,
        name,
        url,
        licence,
        retrievedAt,
        sha256,
      })),
    );
  });

  // 代表区域的源记录已手工核对（ALL / ALL，2026-04-01 与 2025-04-01 的记录）：
  // Greensboro：Median 350，Bonds 171，Geometric Mean 395 / 390；
  // Hobsonville Point（大城市）：Median 700，Bonds 156，Geometric Mean 710 / 699；
  // Hokitika（较小中心）：Median 480，Bonds 21，Geometric Mean 480 / 383；
  // Cooks Beach-Ferry Landing：最后一个有租金的季度是 2021-04-01，Median 305，Bonds 6。
  it("keeps the values of representative areas from the source records", () => {
    expect(findCurrentRent("179900", "ALL", "ALL")).toMatchObject({
      observationPeriod: "2026-04-01",
      medianRent: 350,
      reportedBonds: 171,
      yearOverYearChange: 0.0128,
    });
    expect(findCurrentRent("120200", "ALL", "ALL")).toMatchObject({
      observationPeriod: "2026-04-01",
      medianRent: 700,
      reportedBonds: 156,
      yearOverYearChange: 0.0157,
    });
    expect(findCurrentRent("311500", "ALL", "ALL")).toMatchObject({
      observationPeriod: "2026-04-01",
      medianRent: 480,
      reportedBonds: 21,
      yearOverYearChange: 0.2533,
    });
    expect(findCurrentRent("167300", "ALL", "ALL")).toMatchObject({
      observationPeriod: "2021-04-01",
      medianRent: 305,
      reportedBonds: 6,
      yearOverYearChange: null,
    });
  });

  // Hobsonville Point 的 ALL / 1 卧：Geometric Mean 702 / 547，Bonds 从 15 跳到 102，是源分类变化。
  it("does not calculate the 12-month change for one-bedroom rents", () => {
    expect(findCurrentRent("120200", "ALL", "1")).toMatchObject({
      medianRent: 670,
      reportedBonds: 102,
      yearOverYearChange: null,
    });
  });
});
