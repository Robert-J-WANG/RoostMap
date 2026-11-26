import { describe, expect, it } from "vitest";

import type { QuarterlyRent } from "@/data/contracts";
import {
  buildRentHistorySeries,
  countObservedQuarters,
  formatQuarter,
} from "@/features/areas/rentHistory";

// 一条季度记录；中位数和 Bonds 对这里的规则不重要，只关心季度、分类和几何平均租金。
function record(
  period: string,
  geometricMeanRent: number | null,
  dwellingType: QuarterlyRent["dwellingType"] = "ALL",
  bedrooms: QuarterlyRent["bedrooms"] = "ALL",
): QuarterlyRent {
  return { dwellingType, bedrooms, period, reportedBonds: 10, medianRent: 400, geometricMeanRent };
}

describe("rent history series", () => {
  it("fills missing quarters with null between the first record and the latest period", () => {
    const series = buildRentHistorySeries(
      [record("2025-07-01", 400), record("2026-01-01", 420)],
      "ALL",
      "ALL",
      "2026-04-01",
    );

    // 2025-10-01 没有记录，2026-04-01 也没有记录，但都在序列中占一个位置。
    expect(series.map((point) => [point.period, point.geometricMeanRent])).toEqual([
      ["2025-07-01", 400],
      ["2025-10-01", null],
      ["2026-01-01", 420],
      ["2026-04-01", null],
    ]);
    expect(countObservedQuarters(series)).toBe(2);
  });

  it("uses only the selected category", () => {
    const series = buildRentHistorySeries(
      [record("2026-01-01", 420), record("2026-04-01", 600, "House", "3")],
      "House",
      "3",
      "2026-04-01",
    );

    expect(series).toEqual([{ period: "2026-04-01", geometricMeanRent: 600, reportedBonds: 10 }]);
  });

  it("returns an empty series when the category has no records", () => {
    expect(buildRentHistorySeries([record("2026-01-01", 420)], "Room", "1", "2026-04-01")).toEqual([]);
  });

  it("keeps a record without a rent as a gap", () => {
    const series = buildRentHistorySeries(
      [record("2026-01-01", 420), record("2026-04-01", null)],
      "ALL",
      "ALL",
      "2026-04-01",
    );

    expect(series[1]).toEqual({ period: "2026-04-01", geometricMeanRent: null, reportedBonds: 10 });
    expect(countObservedQuarters(series)).toBe(1);
  });

  it("labels each quarter by year and quarter number", () => {
    expect(formatQuarter("2020-01-01")).toBe("2020 Q1");
    expect(formatQuarter("2025-10-01")).toBe("2025 Q4");
  });
});
