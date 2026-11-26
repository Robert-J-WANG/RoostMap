import { describe, expect, it } from "vitest";

import {
  areaWithCurrentRentsSchema,
  manifestSchema,
  regionRentHistorySchema,
} from "@/data/contracts";

// 一个符合 contract 的当前租金，各测试在它的基础上修改单个字段。
const validCurrentRent = {
  dwellingType: "ALL",
  bedrooms: "ALL",
  datasetLatestPeriod: "2026-04-01",
  observationPeriod: "2026-04-01",
  medianRent: 350,
  reportedBonds: 171,
  yearOverYearChange: 0.0128,
};

// 一行符合 contract 的区域列表数据。
const validRow = {
  sa2Id: "179900",
  name: "Greensboro",
  regionCode: "03",
  regionName: "Waikato Region",
  territorialAuthorityCode: "016",
  territorialAuthorityName: "Hamilton City",
  currentRents: [validCurrentRent],
};

// 用一个修改过的当前租金替换 validRow 中的当前租金，返回 safeParse 是否成功。
function acceptsCurrentRent(currentRent: Record<string, unknown>) {
  return areaWithCurrentRentsSchema.safeParse({ ...validRow, currentRents: [currentRent] })
    .success;
}

describe("data contracts", () => {
  it("accepts an area with its current rents", () => {
    expect(areaWithCurrentRentsSchema.parse(validRow)).toEqual(validRow);
  });

  it("rejects unsupported id, period and category values", () => {
    // 不是六位数字的 SA2 编号。
    expect(
      areaWithCurrentRentsSchema.safeParse({ ...validRow, sa2Id: "unknown" }).success,
    ).toBe(false);
    // 2 月不是季度首月。
    expect(acceptsCurrentRent({ ...validCurrentRent, datasetLatestPeriod: "2026-02-01" })).toBe(false);
    // 卧室数 NA 不是发布的分类。
    expect(acceptsCurrentRent({ ...validCurrentRent, bedrooms: "NA" })).toBe(false);
  });

  it("keeps missing rent values as null", () => {
    expect(
      acceptsCurrentRent({
        ...validCurrentRent,
        observationPeriod: null,
        medianRent: null,
        reportedBonds: null,
        yearOverYearChange: null,
      }),
    ).toBe(true);
  });

  it("rejects a rent stored as a string", () => {
    expect(acceptsCurrentRent({ ...validCurrentRent, medianRent: "350" })).toBe(false);
  });

  it("rejects fields outside the contract and an area without current rents", () => {
    expect(
      areaWithCurrentRentsSchema.safeParse({ ...validRow, areaName: "Greensboro" }).success,
    ).toBe(false);
    expect(
      areaWithCurrentRentsSchema.safeParse({ ...validRow, currentRents: [] }).success,
    ).toBe(false);
  });

  it("accepts a rent history keyed by SA2 code", () => {
    const rentHistory = {
      "179900": [
        {
          dwellingType: "ALL",
          bedrooms: "ALL",
          period: "2026-04-01",
          reportedBonds: 171,
          medianRent: 350,
          geometricMeanRent: 395,
        },
      ],
    };

    expect(regionRentHistorySchema.parse(rentHistory)).toEqual(rentHistory);
    expect(regionRentHistorySchema.safeParse({ unknown: [] }).success).toBe(false);
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
      rentHistoryUrl: "/data/releases/2026-04-01.1/areas/rent-history/03.json",
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
      retrievedAt: "2026-10-27",
      sha256: "a".repeat(64),
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
