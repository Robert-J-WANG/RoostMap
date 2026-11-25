import { describe, expect, it } from "vitest";

import { areaWithCurrentRentSchema, manifestSchema } from "@/data/contracts";

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

// 一份符合 contract 的 manifest，各测试在它的基础上修改单个字段。
const validManifest = {
  version: "2026-04-01.1",
  generatedAt: "2026-11-21T00:00:00.000Z",
  latestPeriod: "2026-04-01",
  partitions: [
    {
      id: "03",
      name: "Waikato Region",
      areaCount: 222,
      currentRentsUrl: "/data/releases/2026-04-01.1/areas/current-rents/03.json",
      geometryUrl: "/data/releases/2026-04-01.1/geometry/regions/03.geo.json",
    },
  ],
  rentalDataStatus: "provisional",
  rentalDataNotice: "Recent quarters may be revised.",
  sources: [
    {
      id: "mbie-rental",
      name: "MBIE Rental Bond Data",
      url: "https://www.tenancy.govt.nz/rental-bond-data/",
      licence: "Creative Commons Attribution 3.0 New Zealand",
    },
  ],
};

describe("manifest contract", () => {
  it("accepts a manifest with its data status and sources", () => {
    expect(manifestSchema.parse(validManifest)).toEqual(validManifest);
  });

  it("rejects an unknown data status, a missing source list and a non-https source link", () => {
    // 状态只能是 provisional 或 final。
    expect(
      manifestSchema.safeParse({ ...validManifest, rentalDataStatus: "draft" }).success,
    ).toBe(false);
    // 页面必须能注明来源。
    expect(
      manifestSchema.safeParse({ ...validManifest, sources: [] }).success,
    ).toBe(false);
    // 来源地址会显示为链接，只接受 https。
    expect(
      manifestSchema.safeParse({
        ...validManifest,
        sources: [{ ...validManifest.sources[0], url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
});
