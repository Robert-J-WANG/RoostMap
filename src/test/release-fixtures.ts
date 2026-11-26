import { vi } from "vitest";

// Explore 和 Area Detail 的页面测试共用的一份小型 release。

export const currentRentsUrl = "/data/releases/2026-04-01.1/areas/current-rents/03.json";
export const geometryUrl = "/data/releases/2026-04-01.1/geometry/regions/03.geo.json";
export const rentHistoryUrl = "/data/releases/2026-04-01.1/areas/rent-history/03.json";
const wellingtonCurrentRentsUrl = "/data/releases/2026-04-01.1/areas/current-rents/09.json";
const wellingtonGeometryUrl = "/data/releases/2026-04-01.1/geometry/regions/09.geo.json";
const wellingtonRentHistoryUrl = "/data/releases/2026-04-01.1/areas/rent-history/09.json";
export const rentalDataNotice = "Recent quarters may be revised.";
export const mbieSourceUrl = "https://www.tenancy.govt.nz/rental-bond-data/";
export const mbieSourceSha256 = "a".repeat(64);

const manifest = {
  version: "2026-04-01.1",
  generatedAt: "2026-11-21T00:00:00.000Z",
  latestPeriod: "2026-04-01",
  partitions: [
    {
      id: "03",
      name: "Waikato Region",
      areaCount: 3,
      currentRentsUrl,
      geometryUrl,
      rentHistoryUrl,
    },
    {
      id: "09",
      name: "Wellington Region",
      areaCount: 1,
      currentRentsUrl: wellingtonCurrentRentsUrl,
      geometryUrl: wellingtonGeometryUrl,
      rentHistoryUrl: wellingtonRentHistoryUrl,
    },
  ],
  rentalDataStatus: "provisional",
  rentalDataNotice,
  sources: [
    {
      id: "mbie-rental",
      name: "MBIE Rental Bond Data",
      url: mbieSourceUrl,
      licence: "Creative Commons Attribution 3.0 New Zealand",
      retrievedAt: "2026-10-27",
      sha256: mbieSourceSha256,
    },
    {
      id: "stats-sa2-2019",
      name: "Stats NZ SA2 2019",
      url: "https://datafinder.stats.govt.nz/layer/98779/",
      licence: "Creative Commons Attribution 4.0 International",
      retrievedAt: "2026-10-27",
      sha256: "b".repeat(64),
    },
  ],
};

// 当前租金文件中一个分类的当前租金；数据集最新季度对所有分类相同。
function rent(
  dwellingType: string,
  bedrooms: string,
  values: {
    observationPeriod: string | null;
    medianRent: number | null;
    reportedBonds: number | null;
    yearOverYearChange: number | null;
  },
) {
  return { dwellingType, bedrooms, datasetLatestPeriod: "2026-04-01", ...values };
}

// 当前租金文件中的一行；默认属于 Waikato。
function area(
  sa2Id: string,
  name: string,
  territorialAuthorityName: string,
  currentRents: ReturnType<typeof rent>[],
  region = { regionCode: "03", regionName: "Waikato Region" },
) {
  return {
    sa2Id,
    name,
    ...region,
    territorialAuthorityCode: "000",
    territorialAuthorityName,
    currentRents,
  };
}

// Waikato 的三种租金状态：当前季度、旧季度和没有租金。
// 只有 Greensboro 有 House / 3 和 ALL / 1 两个分类，其余区域在这两个分类下应显示为缺失。
// 最后一行和 Wellington 的区域是测试用的虚构区域。
const currentRents = [
  area("179900", "Greensboro", "Hamilton City", [
    rent("ALL", "ALL", {
      observationPeriod: "2026-04-01",
      medianRent: 350,
      reportedBonds: 171,
      yearOverYearChange: 0.0128,
    }),
    rent("House", "3", {
      observationPeriod: "2026-04-01",
      medianRent: 590,
      reportedBonds: 12,
      yearOverYearChange: 0.1423,
    }),
    rent("ALL", "1", {
      observationPeriod: "2026-04-01",
      medianRent: 330,
      reportedBonds: 132,
      yearOverYearChange: null,
    }),
  ]),
  area("167300", "Cooks Beach-Ferry Landing", "Thames-Coromandel District", [
    rent("ALL", "ALL", {
      observationPeriod: "2021-04-01",
      medianRent: 305,
      reportedBonds: 6,
      yearOverYearChange: null,
    }),
  ]),
  area("100100", "Area Without Rent", "Test District", [
    rent("ALL", "ALL", {
      observationPeriod: null,
      medianRent: null,
      reportedBonds: null,
      yearOverYearChange: null,
    }),
  ]),
];

const wellingtonCurrentRents = [
  area(
    "250100",
    "Wellington Test Area",
    "Wellington City",
    [
      rent("ALL", "ALL", {
        observationPeriod: "2026-04-01",
        medianRent: 600,
        reportedBonds: 40,
        yearOverYearChange: 0.02,
      }),
    ],
    { regionCode: "09", regionName: "Wellington Region" },
  ),
];

// Waikato 的租金历史，只包含页面测试需要的季度。
// Greensboro ALL / ALL：2025-10-01 没有记录，其余 4 个季度有租金，折线在缺失季度断开；
// House / 3 只有 2 个季度，只显示点；ALL / 1 只有 1 个季度，用文字说明。
// 其他区域没有历史记录。
function historyRecord(
  dwellingType: string,
  bedrooms: string,
  period: string,
  geometricMeanRent: number,
  reportedBonds: number,
) {
  return { dwellingType, bedrooms, period, reportedBonds, medianRent: geometricMeanRent, geometricMeanRent };
}

const rentHistory = {
  "179900": [
    historyRecord("ALL", "ALL", "2025-04-01", 390, 213),
    historyRecord("ALL", "ALL", "2025-07-01", 392, 180),
    historyRecord("ALL", "ALL", "2026-01-01", 398, 150),
    historyRecord("ALL", "ALL", "2026-04-01", 395, 171),
    historyRecord("House", "3", "2025-04-01", 534, 27),
    historyRecord("House", "3", "2026-04-01", 610, 12),
    historyRecord("ALL", "1", "2026-04-01", 330, 132),
  ],
  "167300": [],
  "100100": [],
};

// 每个区域一个简单的三角形边界，id 是 SA2 编号。
function toGeometry(areas: { sa2Id: string }[]) {
  return {
    type: "FeatureCollection",
    features: areas.map(({ sa2Id }) => ({
      type: "Feature",
      id: sa2Id,
      geometry: { type: "Polygon", coordinates: [[[175, -38], [176, -38], [175, -37], [175, -38]]] },
      properties: { sa2Id },
    })),
  };
}

// 用模拟的 fetch 按地址返回数据；failOnce 中的地址第一次请求返回 503。
export function serveRelease(failOnce: string[] = []) {
  const failedUrls = new Set<string>();

  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (failOnce.includes(url) && !failedUrls.has(url)) {
      failedUrls.add(url);
      return new Response(null, { status: 503 });
    }

    if (url === "/data/manifest.json") return Response.json(manifest);
    if (url === currentRentsUrl) return Response.json(currentRents);
    if (url === geometryUrl) return Response.json(toGeometry(currentRents));
    if (url === rentHistoryUrl) return Response.json(rentHistory);
    if (url === wellingtonCurrentRentsUrl) return Response.json(wellingtonCurrentRents);
    if (url === wellingtonGeometryUrl) return Response.json(toGeometry(wellingtonCurrentRents));
    if (url === wellingtonRentHistoryUrl) return Response.json({ "250100": [] });

    throw new Error(`Unexpected data request: ${url}`);
  }));
}
