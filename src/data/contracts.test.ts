import { describe, expect, it } from "vitest";

import {
  areaMetricSliceSchema,
  bedroomCategorySchema,
  periodSchema,
  rentalObservationSchema,
  sa2IdSchema,
} from "@/data/contracts";

const validObservation = {
  period: "2026-04-01",
  sa2Id: "179900",
  dwellingType: "ALL",
  bedrooms: "ALL",
  reportedBonds: 12,
  medianRent: 520,
  geometricMeanRent: 510,
};

describe("data contracts", () => {
  it("accepts a valid observation", () => {
    expect(rentalObservationSchema.parse(validObservation)).toEqual(
      validObservation,
    );
  });

  it("rejects unsupported id and period formats", () => {
    expect(sa2IdSchema.safeParse("unknown").success).toBe(false);
    expect(periodSchema.safeParse("2026-02-01").success).toBe(false);
  });

  it("accepts only published bedroom categories", () => {
    expect(bedroomCategorySchema.safeParse("5+").success).toBe(true);
    expect(bedroomCategorySchema.safeParse("5").success).toBe(false);
    expect(bedroomCategorySchema.safeParse("NA").success).toBe(false);
  });

  it("keeps missing metrics as null", () => {
    const slice = areaMetricSliceSchema.parse({
      dwellingType: "ALL",
      bedrooms: "ALL",
      datasetLatestPeriod: "2026-04-01",
      observationPeriod: null,
      medianRent: null,
      geometricMeanRent: null,
      reportedBonds: null,
      yearOverYearChange: null,
    });

    expect(slice.medianRent).toBeNull();
    expect(slice.observationPeriod).toBeNull();
  });

  it("rejects a rent stored as a string", () => {
    const result = rentalObservationSchema.safeParse({
      ...validObservation,
      medianRent: "520",
    });

    expect(result.success).toBe(false);
  });
});
