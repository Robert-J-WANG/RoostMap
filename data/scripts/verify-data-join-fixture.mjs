import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";

import { parse } from "csv-parse";

const mbieFixtureUrl = new URL(
  "../fixtures/data-join/mbie-records.csv",
  import.meta.url,
);

const statsNzFixtureUrl = new URL(
  "../fixtures/data-join/sa2-areas.json",
  import.meta.url,
);

const expectedFixtureUrl = new URL(
  "../fixtures/data-join/expected-associations.json",
  import.meta.url,
);

async function readJson(fileUrl) {
  return JSON.parse(await readFile(fileUrl, "utf8"));
}

const mbieRecords = [];
const parser = createReadStream(mbieFixtureUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  mbieRecords.push(record);
}

const [statsNzFixture, expectedAssociations] = await Promise.all([
  readJson(statsNzFixtureUrl),
  readJson(expectedFixtureUrl),
]);

const statsNzAreas = new Map(
  statsNzFixture.records.map((record) => [
    String(record.SA22019_V1_00).trim(),
    Boolean(record.hasGeometry),
  ]),
);

function associateRecord(record) {
  const locationId = String(record["Location Id"] ?? "").trim();

  if (!/^\d{6}$/.test(locationId)) {
    return {
      locationId,
      status: "nonCandidateLocation",
      sa2Id: null,
    };
  }

  if (!statsNzAreas.has(locationId)) {
    return {
      locationId,
      status: "unmatchedLocation",
      sa2Id: null,
    };
  }

  if (!statsNzAreas.get(locationId)) {
    return {
      locationId,
      status: "missingGeometry",
      sa2Id: locationId,
    };
  }

  return {
    locationId,
    status: "joined",
    sa2Id: locationId,
  };
}

const records = mbieRecords.map(associateRecord);

const mbieCandidateIds = new Set(
  mbieRecords
    .map((record) => String(record["Location Id"] ?? "").trim())
    .filter((locationId) => /^\d{6}$/.test(locationId)),
);

const statsOnlySa2Ids = [...statsNzAreas.keys()]
  .filter((sa2Id) => !mbieCandidateIds.has(sa2Id))
  .sort();

const counts = {
  input: records.length,
  joined: 0,
  nonCandidateLocation: 0,
  unmatchedLocation: 0,
  missingGeometry: 0,
};

for (const record of records) {
  counts[record.status] += 1;
}

const actualAssociations = {
  records,
  statsOnlySa2Ids,
  counts,
};

assert.deepStrictEqual(actualAssociations, expectedAssociations);

console.log(
  JSON.stringify(
    {
      status: "passed",
      ...actualAssociations,
    },
    null,
    2,
  ),
);
