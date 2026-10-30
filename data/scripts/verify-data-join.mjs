import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse";

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

let inputRecords = 0;
let candidateLocationRecords = 0;

const mbieCandidateIds = new Set();
const mbieCandidateIdCounts = new Map();

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  inputRecords += 1;

  const locationId = sourceValue(record, "Location Id");

  if (/^\d{6}$/.test(locationId)) {
    candidateLocationRecords += 1;
    mbieCandidateIds.add(locationId);
    mbieCandidateIdCounts.set(
      locationId,
      (mbieCandidateIdCounts.get(locationId) ?? 0) + 1,
    );
  }
}

const statsNzQuery = `
  SELECT
    SA22019_V1_00 AS sa2Id,
    SA22019_V1_00_NAME AS sa2Name,
    TA2019_V1_00_NAME AS territorialAuthority,
    REGC2019_V1_00_NAME AS region,
    LAND_AREA_SQ_KM AS landAreaSqKm,
    CASE
      WHEN geom IS NULL OR length(geom) = 0 THEN 0
      ELSE 1
    END AS hasGeometry
  FROM statistical_area_2_higher_geographies_2019_generalised;
`;

const statsNzRows = JSON.parse(
  execFileSync(
    "sqlite3",
    ["-json", fileURLToPath(statsNzFileUrl), statsNzQuery],
    { encoding: "utf8" },
  ),
);

const statsNzDetails = new Map(
  statsNzRows.map((row) => {
    const sa2Id = String(row.sa2Id).trim();

    return [
      sa2Id,
      {
        sa2Id,
        name: row.sa2Name,
        territorialAuthority: row.territorialAuthority,
        region: row.region,
        landAreaSqKm: Number(row.landAreaSqKm),
        hasGeometry: Boolean(row.hasGeometry),
      },
    ];
  }),
);

const statsNzAreas = new Map(
  [...statsNzDetails].map(([sa2Id, area]) => [sa2Id, area.hasGeometry]),
);

const matchedIds = [...mbieCandidateIds]
  .filter((sa2Id) => statsNzAreas.has(sa2Id))
  .sort();

const unmatchedIds = [...mbieCandidateIds]
  .filter((sa2Id) => !statsNzAreas.has(sa2Id))
  .sort();

const matchedIdsWithoutGeometry = matchedIds.filter(
  (sa2Id) => !statsNzAreas.get(sa2Id),
);

const statsNzAreasWithoutGeometry = [...statsNzAreas.values()].filter(
  (hasGeometry) => !hasGeometry,
).length;

let joinedRecords = 0;
let unmatchedLocationRecords = 0;
let missingGeometryRecords = 0;

for (const [sa2Id, recordCount] of mbieCandidateIdCounts) {
  if (!statsNzAreas.has(sa2Id)) {
    unmatchedLocationRecords += recordCount;
  } else if (!statsNzAreas.get(sa2Id)) {
    missingGeometryRecords += recordCount;
  } else {
    joinedRecords += recordCount;
  }
}

const nonCandidateLocationRecords = inputRecords - candidateLocationRecords;
const accountedRecords =
  nonCandidateLocationRecords +
  joinedRecords +
  unmatchedLocationRecords +
  missingGeometryRecords;

const joinedAreaDetails = matchedIds.map((sa2Id) => ({
  ...statsNzDetails.get(sa2Id),
  recordCount: mbieCandidateIdCounts.get(sa2Id),
}));

const highestRecordCountSample = [...joinedAreaDetails].sort(
  (left, right) =>
    right.recordCount - left.recordCount ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];

const lowestRecordCountSample = [...joinedAreaDetails].sort(
  (left, right) =>
    left.recordCount - right.recordCount ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];

const largestLandAreaSample = [...joinedAreaDetails].sort(
  (left, right) =>
    right.landAreaSqKm - left.landAreaSqKm ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];

const chathamIslandsSample = [...statsNzDetails.values()]
  .filter(
    (area) =>
      area.territorialAuthority === "Chatham Islands Territory" &&
      !mbieCandidateIds.has(area.sa2Id) &&
      area.hasGeometry,
  )
  .sort(
    (left, right) =>
      right.landAreaSqKm - left.landAreaSqKm ||
      left.sa2Id.localeCompare(right.sa2Id),
  )[0];

const representativeSamples = [
  {
    selection: "highestRecordCount",
    ...highestRecordCountSample,
  },
  {
    selection: "lowestRecordCount",
    ...lowestRecordCountSample,
  },
  {
    selection: "largestLandArea",
    ...largestLandAreaSample,
  },
  {
    selection: "statsOnlyChathamIslands",
    ...chathamIslandsSample,
    recordCount: 0,
  },
];

const checks = {
  allCandidateIdsMatched: unmatchedIds.length === 0,
  allMatchedIdsHaveGeometry: matchedIdsWithoutGeometry.length === 0,
  allInputRecordsAccountedFor: accountedRecords === inputRecords,
};

const status = Object.values(checks).every(Boolean) ? "passed" : "failed";

console.log(
  JSON.stringify(
    {
      status,
      checks,
      mbieCandidateIds: mbieCandidateIds.size,
      statsNzSa2Ids: statsNzAreas.size,
      statsNzAreasWithoutGeometry,
      matchedIds: matchedIds.length,
      unmatchedIds: {
        count: unmatchedIds.length,
        values: unmatchedIds,
      },
      matchedIdsWithoutGeometry: {
        count: matchedIdsWithoutGeometry.length,
        values: matchedIdsWithoutGeometry,
      },
      records: {
        input: inputRecords,
        candidateLocation: candidateLocationRecords,
        nonCandidateLocation: nonCandidateLocationRecords,
        joined: joinedRecords,
        unmatchedLocation: unmatchedLocationRecords,
        missingGeometry: missingGeometryRecords,
        accounted: accountedRecords,
      },
      representativeSamples,
    },
    null,
    2,
  ),
);

if (status === "failed") {
  process.exitCode = 1;
}
