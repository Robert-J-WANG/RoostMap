// @vitest-environment node
import { readFileSync } from "node:fs";

import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";

import { areaWithCurrentRentSchema } from "@/data/contracts";

import {
  buildCurrentRent,
  buildRegionCurrentRents,
  toArea,
  toQuarterlyRent,
} from "./first-slice.mjs";

/* -------------- 读取 fixture -------------- */

// MBIE（租金） fixture：每条记录是以 CSV 表头为字段名的对象，所有值都是文本。
const mbieRecords = parse(
  readFileSync(
    new URL("../fixtures/first-slice/mbie-records.csv", import.meta.url),
  ),
  { columns: true, skip_empty_lines: true },
);

// Stats NZ（区域） fixture：每条记录使用 GeoPackage 的原字段名。
const statsNzRows = JSON.parse(
  readFileSync(
    new URL("../fixtures/first-slice/stats-nz-areas.json", import.meta.url),
    "utf8",
  ),
);

/* -------------- 辅助函数 -------------- */

// 从 MBIE（租金） fixture 中取出一个 SA2 的 ALL / ALL 记录，并转换成季度租金记录。
// fixture 中每个 SA2 的记录已按季度从旧到新书写，所以不需要再排序。
const quarterlyRentsOf = (sa2Id) =>
  mbieRecords
    .filter(
      (row) =>
        row["Location Id"] === sa2Id &&
        row["Dwelling Type"] === "ALL" &&
        row["Number Of Beds"] === "ALL",
    )
    .map((row) => toQuarterlyRent(row));

// 以 2026-04-01 作为数据集最新季度，计算一个 SA2 的当前租金。
const currentRentOf = (sa2Id) =>
  buildCurrentRent(quarterlyRentsOf(sa2Id), "2026-04-01");

// 以 2026-04-01 作为数据集最新季度，转换整个 fixture Region。
const regionCurrentRents = buildRegionCurrentRents({
  statsNzRows,
  mbieRecords,
  datasetLatestPeriod: "2026-04-01",
});

/* -------------- 测试 -------------- */

describe("first data slice", () => {
  // Area C 在 2026-04-01 的记录同时包含数字文本 6 和两个 NULL。
  it("converts an MBIE（租金） record into a quarterly rent", () => {
    const record = mbieRecords.find(
      (row) => row["Location Id"] === "900003" && row.TimeFrame === "2026-04-01",
    );

    expect(toQuarterlyRent(record)).toEqual({
      period: "2026-04-01",
      reportedBonds: 6,
      medianRent: null,
      geometricMeanRent: null,
    });
  });

  // 字段名换成 contract 中的名称，Region 编号 "03" 仍是文本。
  it("converts a Stats NZ（区域） row into an area", () => {
    expect(toArea(statsNzRows[0])).toEqual({
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
    expect(currentRentOf("900001")).toMatchObject({
      observationPeriod: "2026-04-01",
      medianRent: 540,
      reportedBonds: 33,
    });
    // Area B：最后一条记录在 2025-10-01，当前租金停在这个旧季度。
    expect(currentRentOf("900002")).toMatchObject({
      observationPeriod: "2025-10-01",
      medianRent: 470,
    });
    // Area C：最新季度租金为 NULL，往前使用 2026-01-01；Bonds 也取这个季度的 9。
    expect(currentRentOf("900003")).toMatchObject({
      observationPeriod: "2026-01-01",
      medianRent: 400,
      reportedBonds: 9,
    });
  });

  it("calculates the 12-month change only when both quarters exist", () => {
    // Area A：525 / 500 - 1 = 0.05。
    expect(currentRentOf("900001").yearOverYearChange).toBe(0.05);
    // Area B：2026-04-01 没有记录。
    expect(currentRentOf("900002").yearOverYearChange).toBeNull();
    // Area C：2026-04-01 的 Geometric Mean Rent 为 NULL。
    expect(currentRentOf("900003").yearOverYearChange).toBeNull();
  });

  // 900004 没有 MBIE（租金） 记录；-99 和 900099 不在这个 Region 中。
  it("publishes only Region areas that appear in the MBIE（租金） records", () => {
    expect(regionCurrentRents.map((area) => area.sa2Id)).toEqual([
      "900001",
      "900002",
      "900003",
    ]);
  });

  // 整个 Region 一起转换时，Area B 的当前租金与单独计算 Area B 的结果相同。
  it("attaches the current rent to each published area", () => {
    const areaB = regionCurrentRents.find((area) => area.sa2Id === "900002");

    expect(areaB.currentRent).toEqual(currentRentOf("900002"));
  });

  // 真实 CSV 按季度从新到旧排列：源记录顺序颠倒时，结果不变。
  it("does not depend on the order of the source records", () => {
    const reversedResult = buildRegionCurrentRents({
      statsNzRows: [...statsNzRows].reverse(),
      mbieRecords: [...mbieRecords].reverse(),
      datasetLatestPeriod: "2026-04-01",
    });

    expect(reversedResult).toEqual(regionCurrentRents);
  });

  // 每个可发布区域都符合第 2 节定义的列表中的一行。
  it("produces rows that satisfy the contract", () => {
    for (const row of regionCurrentRents) {
      areaWithCurrentRentSchema.parse(row);
    }
  });
});
