import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchManifest, fetchRegionCurrentRents } from "@/data/repository";

const manifest = {
  version: "2026-04-01.1",
  generatedAt: "2026-11-21T00:00:00.000Z",
  latestPeriod: "2026-04-01",
  partitions: [
    {
      id: "03",
      name: "Waikato Region",
      areaCount: 1,
      currentRentsUrl: "/data/releases/2026-04-01.1/areas/current-rents/03.json",
      geometryUrl: "/data/releases/2026-04-01.1/geometry/regions/03.geo.json",
    },
  ],
};

// 让 fetch 返回指定的 JSON 和 HTTP 状态，不发出真实请求。
function mockFetchResponse(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("data repository", () => {
  it("reads the manifest from its fixed address", async () => {
    mockFetchResponse(manifest);

    await expect(fetchManifest()).resolves.toEqual(manifest);
    expect(fetch).toHaveBeenCalledWith("/data/manifest.json", {
      signal: undefined,
    });
  });

  it("reports the file address when a request fails", async () => {
    mockFetchResponse({}, 404);

    await expect(fetchManifest()).rejects.toThrow(
      "Could not load /data/manifest.json (HTTP 404)",
    );
  });

  // 租金写成了字符串 "350"，不符合 contract。
  it("rejects a data file that does not match the contract", async () => {
    mockFetchResponse([
      {
        sa2Id: "179900",
        name: "Greensboro",
        regionCode: "03",
        regionName: "Waikato Region",
        territorialAuthorityCode: "016",
        territorialAuthorityName: "Hamilton City",
        currentRent: {
          datasetLatestPeriod: "2026-04-01",
          observationPeriod: "2026-04-01",
          medianRent: "350",
          reportedBonds: 171,
          yearOverYearChange: 0.0128,
        },
      },
    ]);

    await expect(
      fetchRegionCurrentRents(manifest.partitions[0]),
    ).rejects.toThrow(
      "/data/releases/2026-04-01.1/areas/current-rents/03.json does not match the data contract",
    );
  });
});
