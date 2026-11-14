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

export type MapData = FeatureCollection<
  Polygon | MultiPolygon,
  AreaProperties
>;

export type RegionEntry = {
  regionCode: string;
  name: string;
  areaCount: number;
  mapFile: string;
  historyFile: string;
};

type RegionIndexData = {
  period: string;
  dwellingType: string;
  bedroomCategory: string;
  regions: RegionEntry[];
};

export type HistoryObservation = {
  period: string;
  geometricMeanRent: number | null;
  reportedBonds: number | null;
};

type HistoryData = {
  region: string;
  dwellingType: string;
  bedroomCategory: string;
  metric: "geometricMeanRent";
  periods: string[];
  histories: Record<string, HistoryObservation[]>;
};

// Region 目录只描述可选范围及其数据文件，不读取具体地图内容。
export async function loadRegionIndex(
  signal: AbortSignal,
): Promise<RegionIndexData> {
  const response = await fetch(
    "/data/spike/map-chart/comparison/regions/index.json",
    { signal },
  );

  if (!response.ok) {
    throw new Error("Could not load the Region index.");
  }

  return response.json() as Promise<RegionIndexData>;
}

// 一次加载同一 Region 的边界和历史，避免页面组合不匹配的数据文件。
export async function loadRegionData(
  region: RegionEntry,
  signal: AbortSignal,
) {
  const [mapResponse, historyResponse] = await Promise.all([
    fetch(region.mapFile, { signal }),
    fetch(region.historyFile, { signal }),
  ]);

  if (!mapResponse.ok || !historyResponse.ok) {
    throw new Error(`Could not load the ${region.name} data files.`);
  }

  const map: MapData = await mapResponse.json();
  const history: HistoryData = await historyResponse.json();

  return { map, history };
}
