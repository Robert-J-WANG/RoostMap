import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse";
import wkx from "wkx";

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

const regionName = "Waikato Region";
const latestPeriod = "2026-04-01";
const initialSa2Id = "179900";
const dwellingType = "ALL";
const bedroomCategory = "ALL";

function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

function sourceNumber(record, field) {
  const value = sourceValue(record, field);

  if (value === "" || value === "NULL") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return number;
}

function geoPackageWkb(geometryHex) {
  const geometryBuffer = Buffer.from(geometryHex, "hex");

  if (
    geometryBuffer.length < 8 ||
    geometryBuffer.toString("ascii", 0, 2) !== "GP"
  ) {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const flags = geometryBuffer.readUInt8(3);
  const envelopeType = (flags >> 1) & 0b111;
  const envelopeCoordinateCounts = [0, 4, 6, 6, 8];
  const envelopeCoordinateCount = envelopeCoordinateCounts[envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  const headerLength = 8 + envelopeCoordinateCount * 8;
  return geometryBuffer.subarray(headerLength);
}

const statsNzQuery = `
  SELECT
    SA22019_V1_00 AS sa2Id,
    SA22019_V1_00_NAME AS name,
    TA2019_V1_00_NAME AS territorialAuthority,
    REGC2019_V1_00 AS regionCode,
    REGC2019_V1_00_NAME AS region,
    LAND_AREA_SQ_KM AS landAreaSqKm,
    CASE
      WHEN geom IS NULL OR length(geom) = 0 THEN NULL
      ELSE hex(geom)
    END AS geometryHex
  FROM statistical_area_2_higher_geographies_2019_generalised
  WHERE REGC2019_V1_00_NAME = 'Waikato Region'
  ORDER BY SA22019_V1_00;
`;

const statsNzRows = JSON.parse(
  execFileSync(
    "sqlite3",
    ["-json", fileURLToPath(statsNzFileUrl), statsNzQuery],
    {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  ),
);

const geometryFeatures = statsNzRows.map((row) => {
  const sa2Id = String(row.sa2Id).trim();

  return {
    type: "Feature",
    id: sa2Id,
    geometry: row.geometryHex
      ? wkx.Geometry.parse(geoPackageWkb(row.geometryHex)).toGeoJSON()
      : null,
    properties: {
      sa2Id,
      name: row.name,
      territorialAuthority: row.territorialAuthority,
      regionCode: String(row.regionCode).trim(),
      region: row.region,
      landAreaSqKm: Number(row.landAreaSqKm),
    },
  };
});

const missingGeometryFeatures = geometryFeatures.filter(
  (feature) => feature.geometry === null,
);

const waikatoSa2Ids = new Set(
  geometryFeatures.map((feature) => feature.id),
);

const mbieWaikatoSa2Ids = new Set();
const currentMetrics = new Map();
const historyObservations = [];

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  const period = sourceValue(record, "TimeFrame");
  const sa2Id = sourceValue(record, "Location Id");
  const recordDwellingType = sourceValue(record, "Dwelling Type");
  const recordBedroomCategory = sourceValue(record, "Number Of Beds");

  if (/^\d{6}$/.test(sa2Id) && waikatoSa2Ids.has(sa2Id)) {
    mbieWaikatoSa2Ids.add(sa2Id);
  }

  if (
    recordDwellingType !== dwellingType ||
    recordBedroomCategory !== bedroomCategory
  ) {
    continue;
  }

  const reportedBonds = sourceNumber(record, "Total Bonds");

  if (period === latestPeriod && waikatoSa2Ids.has(sa2Id)) {
    currentMetrics.set(sa2Id, {
      medianRent: sourceNumber(record, "Median Rent"),
      reportedBonds,
    });
  }

  if (sa2Id === initialSa2Id) {
    historyObservations.push({
      period,
      geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
      reportedBonds,
    });
  }
}

historyObservations.sort((left, right) =>
  left.period.localeCompare(right.period),
);

const publishableFeatures = geometryFeatures.filter(
  (feature) =>
    feature.geometry !== null && mbieWaikatoSa2Ids.has(feature.id),
);

const mapFeatures = publishableFeatures.map((feature) => {
  const metric = currentMetrics.get(feature.id);

  return {
    ...feature,
    properties: {
      ...feature.properties,
      medianRent: metric?.medianRent ?? null,
      reportedBonds: metric?.reportedBonds ?? null,
    },
  };
});

const initialMapFeature = mapFeatures.find(
  (feature) => feature.id === initialSa2Id,
);

console.log(
  JSON.stringify(
    {
      region: regionName,
      sourceAreaCount: geometryFeatures.length,
      associatedAreaCount: mbieWaikatoSa2Ids.size,
      publishableAreaCount: mapFeatures.length,
      missingGeometry: missingGeometryFeatures.length,
      mapSlice: {
        period: latestPeriod,
        dwellingType,
        bedroomCategory,
        metricRecords: currentMetrics.size,
        missingMetricRecords: mapFeatures.length - currentMetrics.size,
        initialFeature: initialMapFeature
          ? {
              id: initialMapFeature.id,
              name: initialMapFeature.properties.name,
              medianRent: initialMapFeature.properties.medianRent,
              reportedBonds: initialMapFeature.properties.reportedBonds,
            }
          : null,
      },
      history: {
        sa2Id: initialSa2Id,
        observations: historyObservations.length,
        start: historyObservations.at(0)?.period ?? null,
        end: historyObservations.at(-1)?.period ?? null,
      },
    },
    null,
    2,
  ),
);
