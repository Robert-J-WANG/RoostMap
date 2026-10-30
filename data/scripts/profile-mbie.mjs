import { createReadStream } from "node:fs";

import { parse } from "csv-parse";

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

let inputRecords = 0;
let duplicateObservationKeys = 0;

const periods = new Set();
const locationIds = new Set();
const locationIdCounts = new Map();
const dwellingTypes = new Set();
const bedroomCategories = new Set();
const observationKeys = new Set();

const rentFields = [
  "Median Rent",
  "Geometric Mean Rent",
  "Upper Quartile Rent",
  "Lower Quartile Rent",
  "Log Std Dev Weekly Rent",
];

const missingRentValues = Object.fromEntries(
  rentFields.map((field) => [field, 0]),
);

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  inputRecords += 1;

  const period = sourceValue(record, "TimeFrame");
  const locationId = sourceValue(record, "Location Id");
  const dwellingType = sourceValue(record, "Dwelling Type");
  const bedrooms = sourceValue(record, "Number Of Beds");

  periods.add(period);
  locationIds.add(locationId);
  locationIdCounts.set(
    locationId,
    (locationIdCounts.get(locationId) ?? 0) + 1,
  );
  dwellingTypes.add(dwellingType);
  bedroomCategories.add(bedrooms);

  const observationKey = [
    period,
    locationId,
    dwellingType,
    bedrooms,
  ].join("|");

  if (observationKeys.has(observationKey)) {
    duplicateObservationKeys += 1;
  } else {
    observationKeys.add(observationKey);
  }

  for (const field of rentFields) {
    const value = sourceValue(record, field);

    if (value === "" || value === "NULL") {
      missingRentValues[field] += 1;
    }
  }
}

const sortedPeriods = [...periods].sort();

const sixDigitLocationIds = [...locationIds].filter((locationId) =>
  /^\d{6}$/.test(locationId),
);

const otherNonSixDigitLocationIds = [...locationIds].filter(
  (locationId) =>
    !/^\d{6}$/.test(locationId) &&
    locationId !== "-99" &&
    locationId !== "NULL" &&
    locationId !== "",
);

console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
      locationIdProfile: {
        distinctValues: locationIds.size,
        sixDigitCandidateValues: sixDigitLocationIds.length,
        exactValueRows: {
          "-99": locationIdCounts.get("-99") ?? 0,
          NULL: locationIdCounts.get("NULL") ?? 0,
          blank: locationIdCounts.get("") ?? 0,
        },
        otherNonSixDigitValues: otherNonSixDigitLocationIds,
      },
      dwellingTypes: [...dwellingTypes].sort(),
      bedroomCategories: [...bedroomCategories].sort((left, right) =>
        left.localeCompare(right, "en-NZ", { numeric: true }),
      ),
      duplicateObservationKeys,
      missingRentValues,
    },
    null,
    2,
  ),
);