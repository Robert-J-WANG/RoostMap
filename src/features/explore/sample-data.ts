import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

type AreaProperties = {
  sa2Id: string;
  name: string;
  territorialAuthority: string;
  regionCode: string;
  region: string;
  landAreaSqKm: number;
  medianRent: number | null;
  reportedBonds: number | null;
};

type MapData = FeatureCollection<Polygon | MultiPolygon, AreaProperties>;

type HistoryData = {
  sa2Id: string;
  dwellingType: string;
  bedroomCategory: string;
  metric: "geometricMeanRent";
  observations: {
    period: string;
    geometricMeanRent: number | null;
    reportedBonds: number | null;
  }[];
};

export async function loadSampleData(signal: AbortSignal) {
  const [mapResponse, historyResponse] = await Promise.all([
    fetch("/data/spike/map-chart/waikato.geo.json", { signal }),
    fetch("/data/spike/map-chart/179900-history.json", { signal }),
  ]);

  if (!mapResponse.ok || !historyResponse.ok) {
    throw new Error("Could not load the map and history data files.");
  }

  const map: MapData = await mapResponse.json();
  const history: HistoryData = await historyResponse.json();

  return { map, history };
}
