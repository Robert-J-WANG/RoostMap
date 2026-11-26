// @vitest-environment node
import { readFileSync } from "node:fs";

import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";

import { areaWithCurrentRentsSchema } from "@/data/contracts";

import {
  buildAreasWithCurrentRents,
  buildCurrentRent,
  convertToArea,
  convertToQuarterlyRent,
} from "./current-rents.mjs";

/* -------------- 读取 fixture -------------- */

// MBIE（租金） fixture：每条记录是以 CSV 表头为字段名的对象，所有值都是文本。
const mbieRecords = parse(
  readFileSync(
    new URL("../fixtures/first-slice/mbie-records.csv", import.meta.url),
  ),
  { columns: true, skip_empty_lines: true },
);

// Stats NZ（区域） fixture：每条记录使用 GeoPackage 的原字段名。
const statsNzRecords = JSON.parse(
  readFileSync(
    new URL("../fixtures/first-slice/stats-nz-areas.json", import.meta.url),
    "utf8",
  ),
);

/* -------------- 辅助函数 -------------- */

// 从 fixture 中取出一个 SA2 在一种分类下的记录，以 2026-04-01 作为数据集最新季度计算当前租金。
// fixture 中每个 SA2 的记录已按季度从旧到新书写，所以不需要再排序。
function calculateCurrentRentFromFixture(sa2Id, dwellingType = "ALL", bedrooms = "ALL") {
  const quarterlyRents = mbieRecords
    .filter(
      (record) =>
        record["Location Id"] === sa2Id &&
        record["Dwelling Type"] === dwellingType &&
        record["Number Of Beds"] === bedrooms,
    )
    .map((record) => convertToQuarterlyRent(record));

  return buildCurrentRent(quarterlyRents, "2026-04-01");
}

// 以 2026-04-01 作为数据集最新季度，转换整个 fixture Region。
const areasWithCurrentRents = buildAreasWithCurrentRents({
  statsNzRecords,
  mbieRecords,
  datasetLatestPeriod: "2026-04-01",
});

/* -------------- 测试 -------------- */

describe("rent conversion", () => {
  // Area C 在 2026-04-01 的记录同时包含数字文本 6 和两个 NULL。
  it("converts an MBIE（租金） record into a quarterly rent", () => {
    const areaCRecord = mbieRecords.find(
      (record) =>
        record["Location Id"] === "900003" && record.TimeFrame === "2026-04-01",
    );

    expect(convertToQuarterlyRent(areaCRecord)).toEqual({
      dwellingType: "ALL",
      bedrooms: "ALL",
      period: "2026-04-01",
      reportedBonds: 6,
      medianRent: null,
      geometricMeanRent: null,
    });
  });

  // 字段名换成 contract 中的名称，Region 编号 "03" 仍是文本。
  it("converts a Stats NZ（区域） record into an area", () => {
    expect(convertToArea(statsNzRecords[0])).toEqual({
      sa2Id: "900001",
      name: "Fixture Area A",
      regionCode: "03",
      regionName: "Waikato Region",
      territorialAuthorityCode: "901",
      territorialAuthorityName: "Fixture District",
    });
  });

  it("uses the latest observed quarter as the current rent", () => {
    // Area A：最新季度有租金，直接使用最新季度。
    expect(calculateCurrentRentFromFixture("900001")).toMatchObject({
      observationPeriod: "2026-04-01",
      medianRent: 540,
      reportedBonds: 33,
    });
    // Area B：最后一条记录在 2025-10-01，当前租金停在这个旧季度。
    expect(calculateCurrentRentFromFixture("900002")).toMatchObject({
      observationPeriod: "2025-10-01",
      medianRent: 470,
    });
    // Area C：最新季度租金为 NULL，往前使用 2026-01-01；Bonds 也取这个季度的 9。
    expect(calculateCurrentRentFromFixture("900003")).toMatchObject({
      observationPeriod: "2026-01-01",
      medianRent: 400,
      reportedBonds: 9,
    });
  });

  it("calculates the 12-month change only when both quarters exist", () => {
    // Area A：525 / 500 - 1 = 0.05。
    expect(calculateCurrentRentFromFixture("900001").yearOverYearChange).toBe(0.05);
    // Area B：2026-04-01 没有记录。
    expect(calculateCurrentRentFromFixture("900002").yearOverYearChange).toBeNull();
    // Area C：2026-04-01 的 Geometric Mean Rent 为 NULL。
    expect(calculateCurrentRentFromFixture("900003").yearOverYearChange).toBeNull();
  });

  // Area A 的 1 卧两个季度都有租金（370 / 290），但比较跨越了 2024-10-01 的分类变化。
  it("does not calculate the 12-month change for one-bedroom rents", () => {
    expect(calculateCurrentRentFromFixture("900001", "ALL", "1")).toMatchObject({
      dwellingType: "ALL",
      bedrooms: "1",
      medianRent: 360,
      yearOverYearChange: null,
    });
  });

  // 900004 只有卧室数 NA 的记录，NA 不是发布的分类；-99 和 900099 不在这个 Region 中。
  it("publishes only Region areas with a valid rent in a published category", () => {
    expect(areasWithCurrentRents.map((area) => area.sa2Id)).toEqual([
      "900001",
      "900002",
      "900003",
    ]);
  });

  // Area A 有 ALL / ALL、ALL / 1、House / 3 三个发布的分类，NA 不出现；分类按发布顺序排列。
  it("attaches the current rent of each published category", () => {
    const areaA = areasWithCurrentRents.find((area) => area.sa2Id === "900001");

    expect(
      areaA.currentRents.map(({ dwellingType, bedrooms }) => `${dwellingType} / ${bedrooms}`),
    ).toEqual(["ALL / ALL", "ALL / 1", "House / 3"]);
  });

  // 整个 Region 一起转换时，Area B 的当前租金与 3.2 的手工答案一致。
  it("keeps the hand-checked Area B result when the whole Region is converted", () => {
    const areaB = areasWithCurrentRents.find((area) => area.sa2Id === "900002");

    expect(areaB.currentRents).toEqual([
      {
        dwellingType: "ALL",
        bedrooms: "ALL",
        datasetLatestPeriod: "2026-04-01",
        observationPeriod: "2025-10-01",
        medianRent: 470,
        reportedBonds: 12,
        yearOverYearChange: null,
      },
    ]);
  });

  // 真实 CSV 按季度从新到旧排列：源记录顺序颠倒时，结果不变。
  it("does not depend on the order of the source records", () => {
    const reversedResult = buildAreasWithCurrentRents({
      statsNzRecords: [...statsNzRecords].reverse(),
      mbieRecords: [...mbieRecords].reverse(),
      datasetLatestPeriod: "2026-04-01",
    });

    expect(reversedResult).toEqual(areasWithCurrentRents);
  });

  // 每个可发布区域都符合 contract 中区域列表的一行。
  it("produces rows that satisfy the contract", () => {
    for (const row of areasWithCurrentRents) {
      areaWithCurrentRentsSchema.parse(row);
    }
  });
});
