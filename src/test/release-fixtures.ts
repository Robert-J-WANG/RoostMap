import { vi } from "vitest";

// Explore 和 Area Detail 的页面测试共用的一份小型 release。

export const currentRentsUrl = "/data/releases/2026-04-01.1/areas/current-rents/03.json";
export const geometryUrl = "/data/releases/2026-04-01.1/geometry/regions/03.geo.json";
export const rentalDataNotice = "Recent quarters may be revised.";
export const mbieSourceUrl = "https://www.tenancy.govt.nz/rental-bond-data/";
export const mbieSourceSha256 = "a".repeat(64);

const manifest = {
  version: "2026-04-01.1",
  generatedAt: "2026-11-21T00:00:00.000Z",
  latestPeriod: "2026-04-01",
  partitions: [
    { id: "03", name: "Waikato Region", areaCount: 3, currentRentsUrl, geometryUrl },
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

// 生成当前租金文件中的一行；Region 信息和数据集最新季度对所有区域相同。
function area(
  sa2Id: string,
  name: string,
  territorialAuthorityName: string,
  currentRent: {
    observationPeriod: string | null;
    medianRent: number | null;
    reportedBonds: number | null;
    yearOverYearChange: number | null;
  },
) {
  return {
    sa2Id,
    name,
    regionCode: "03",
    regionName: "Waikato Region",
    territorialAuthorityCode: "000",
    territorialAuthorityName,
    currentRent: { datasetLatestPeriod: "2026-04-01", ...currentRent },
  };
}

// 三种租金状态：当前季度、旧季度和没有租金。最后一行是测试用的虚构区域。
const currentRents = [
  area("179900", "Greensboro", "Hamilton City", {
    observationPeriod: "2026-04-01",
    medianRent: 350,
    reportedBonds: 171,
    yearOverYearChange: 0.0128,
  }),
  area("167300", "Cooks Beach-Ferry Landing", "Thames-Coromandel District", {
    observationPeriod: "2021-04-01",
    medianRent: 305,
    reportedBonds: 6,
    yearOverYearChange: null,
  }),
  area("100100", "Area Without Rent", "Test District", {
    observationPeriod: null,
    medianRent: null,
    reportedBonds: null,
    yearOverYearChange: null,
  }),
];

const geometry = {
  type: "FeatureCollection",
  features: currentRents.map(({ sa2Id }) => ({
    type: "Feature",
    id: sa2Id,
    geometry: { type: "Polygon", coordinates: [[[175, -38], [176, -38], [175, -37], [175, -38]]] },
    properties: { sa2Id },
  })),
};

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
    if (url === geometryUrl) return Response.json(geometry);

    throw new Error(`Unexpected data request: ${url}`);
  }));
}
