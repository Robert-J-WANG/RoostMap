import { describe, expect, it } from "vitest";

import { areaWithCurrentRentSchema } from "@/data/contracts";

// 一行符合 contract 的区域列表数据，各测试在它的基础上修改单个字段。
const validRow = {
  sa2Id: "179900",
  name: "Greensboro",
  regionCode: "03",
  regionName: "Waikato Region",
  territorialAuthorityCode: "016",
  territorialAuthorityName: "Hamilton City",
  currentRent: {
    datasetLatestPeriod: "2026-04-01",
    observationPeriod: "2026-04-01",
    medianRent: 350,
    reportedBonds: 171,
    yearOverYearChange: 0.0128,
  },
};

describe("data contracts", () => {
  it("accepts an area with its current rent", () => {
    expect(areaWithCurrentRentSchema.parse(validRow)).toEqual(validRow);
  });

  it("rejects unsupported id and period formats", () => {
    // 不是六位数字的 SA2 编号。
    expect(
      areaWithCurrentRentSchema.safeParse({ ...validRow, sa2Id: "unknown" })
        .success,
    ).toBe(false);
    // 2 月不是季度首月。
    expect(
      areaWithCurrentRentSchema.safeParse({
        ...validRow,
        currentRent: { ...validRow.currentRent, datasetLatestPeriod: "2026-02-01" },
      }).success,
    ).toBe(false);
  });

  it("keeps missing rent values as null", () => {
    const row = areaWithCurrentRentSchema.parse({
      ...validRow,
      currentRent: {
        datasetLatestPeriod: "2026-04-01",
        observationPeriod: null,
        medianRent: null,
        reportedBonds: null,
        yearOverYearChange: null,
      },
    });

    expect(row.currentRent.medianRent).toBeNull();
    expect(row.currentRent.observationPeriod).toBeNull();
  });

  it("rejects a rent stored as a string", () => {
    const result = areaWithCurrentRentSchema.safeParse({
      ...validRow,
      currentRent: { ...validRow.currentRent, medianRent: "350" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fields outside the contract", () => {
    const result = areaWithCurrentRentSchema.safeParse({
      ...validRow,
      areaName: "Greensboro",
    });

    expect(result.success).toBe(false);
  });
});
