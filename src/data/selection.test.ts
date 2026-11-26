import { describe, expect, it } from "vitest";

import { readSelection, toSearch } from "@/data/selection";

describe("URL selection", () => {
  it("reads the Region, categories and selected SA2 from the URL", () => {
    const selection = readSelection(
      new URLSearchParams("region=09&dwelling=Boarding+House&bedrooms=5%2B&sa2=250100"),
    );

    expect(selection).toEqual({
      regionCode: "09",
      dwellingType: "Boarding House",
      bedrooms: "5+",
      sa2Id: "250100",
    });
  });

  it("uses the default categories for missing or unpublished values", () => {
    const selection = readSelection(new URLSearchParams("dwelling=Castle&bedrooms=9"));

    expect(selection).toEqual({
      regionCode: "03",
      dwellingType: "ALL",
      bedrooms: "ALL",
      sa2Id: null,
    });
  });

  it("writes only the values that differ from the defaults", () => {
    expect(
      toSearch({ regionCode: "03", dwellingType: "ALL", bedrooms: "ALL", sa2Id: null }),
    ).toBe("");
    expect(
      toSearch({ regionCode: "03", dwellingType: "House", bedrooms: "3", sa2Id: "179900" }),
    ).toBe("?dwelling=House&bedrooms=3&sa2=179900");
  });
});
