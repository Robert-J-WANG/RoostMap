// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { areaWithCurrentRentSchema } from "@/data/contracts";

// 读取 public 目录中的 JSON；参数是页面请求时使用的路径，例如 /data/manifest.json。
function readPublishedJson(path) {
  return JSON.parse(
    readFileSync(new URL(`../../public${path}`, import.meta.url), "utf8"),
  );
}

const manifest = readPublishedJson("/data/manifest.json");
const [waikato] = manifest.partitions;
const waikatoCurrentRents = readPublishedJson(waikato.currentRentsUrl);
const waikatoGeometry = readPublishedJson(waikato.geometryUrl);

describe("data release", () => {
  it("points every file in the manifest at the same release version", () => {
    for (const partition of manifest.partitions) {
      expect(partition.currentRentsUrl).toContain(`/releases/${manifest.version}/`);
      expect(partition.geometryUrl).toContain(`/releases/${manifest.version}/`);
    }
  });

  it("publishes current rents that satisfy the contract", () => {
    for (const row of waikatoCurrentRents) {
      areaWithCurrentRentSchema.parse(row);
    }
  });

  it("uses the same areas in the manifest, current rents and geometry", () => {
    const sa2Ids = waikatoCurrentRents.map((area) => area.sa2Id);
    const featureIds = waikatoGeometry.features.map((feature) => feature.id);

    expect(waikatoCurrentRents).toHaveLength(waikato.areaCount);
    expect(featureIds).toEqual(sa2Ids);
  });

  // Greensboro 的源记录已手工核对：ALL / ALL 租金 350，Bonds 171，Geometric Mean Rent 395 / 390。
  it("keeps the Greensboro values from the source records", () => {
    const greensboro = waikatoCurrentRents.find((area) => area.sa2Id === "179900");

    expect(greensboro).toEqual({
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
    });
  });
});
