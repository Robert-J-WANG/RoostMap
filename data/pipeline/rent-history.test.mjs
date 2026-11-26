// @vitest-environment node
import { readFileSync } from "node:fs";

import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";

import { regionRentHistorySchema } from "@/data/contracts";

import { buildRegionRentHistory } from "./rent-history.mjs";

// 与当前租金测试使用同一份 MBIE（租金） fixture。
const mbieRecords = parse(
  readFileSync(
    new URL("../fixtures/first-slice/mbie-records.csv", import.meta.url),
  ),
  { columns: true, skip_empty_lines: true },
);

// fixture Region 的三个可发布区域。
const rentHistory = buildRegionRentHistory({
  sa2Ids: ["900001", "900002", "900003"],
  mbieRecords,
});

describe("rent history", () => {
  it("keeps one entry for each published area", () => {
    expect(Object.keys(rentHistory)).toEqual(["900001", "900002", "900003"]);
  });

  // Area A 的 NA 记录不出现；记录按分类、再按季度从旧到新排列。
  it("keeps the published categories of an area in order", () => {
    expect(
      rentHistory["900001"].map(
        ({ dwellingType, bedrooms, period }) => `${dwellingType} / ${bedrooms} / ${period}`,
      ),
    ).toEqual([
      "ALL / ALL / 2025-04-01",
      "ALL / ALL / 2026-04-01",
      "ALL / 1 / 2025-04-01",
      "ALL / 1 / 2026-04-01",
      "House / 3 / 2026-04-01",
    ]);
  });

  // Area C 的最新季度没有租金，历史中仍保留这个季度，值为 null。
  it("keeps quarters without a rent as null", () => {
    expect(rentHistory["900003"].at(-1)).toEqual({
      dwellingType: "ALL",
      bedrooms: "ALL",
      period: "2026-04-01",
      reportedBonds: 6,
      medianRent: null,
      geometricMeanRent: null,
    });
  });

  // 源记录顺序颠倒时，结果不变。
  it("does not depend on the order of the source records", () => {
    expect(
      buildRegionRentHistory({
        sa2Ids: ["900001", "900002", "900003"],
        mbieRecords: [...mbieRecords].reverse(),
      }),
    ).toEqual(rentHistory);
  });

  it("produces a history that satisfies the contract", () => {
    regionRentHistorySchema.parse(rentHistory);
  });
});
