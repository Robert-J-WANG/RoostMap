import Map, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import { useState } from "react";
import type { LayerProps, MapLayerMouseEvent } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import { useQuery } from "@tanstack/react-query";

import {
  loadRegionData,
  loadRegionIndex,
  type MapData,
} from "@/features/explore/sample-data";
import { RentHistoryChart } from "@/features/explore/RentHistoryChart";

// 地图运行环境：在创建地图前指定 Worker 地址。
setWorkerUrl(workerUrl);

// SA2 图层：当前季度的租金填色与公共边界。
const sa2FillLayer: LayerProps = {
  id: "sa2-fill",
  type: "fill",
  paint: {
    "fill-color": [
      "case",
      ["==", ["get", "medianRent"], null],
      "#94a3b8",
      [
        "step",
        ["number", ["get", "medianRent"]],
        "#57c8b8",
        400,
        "#e6ad5c",
        600,
        "#c45d55",
      ],
    ],
    "fill-opacity": 0.55,
  },
};

const sa2BoundaryLayer: LayerProps = {
  id: "sa2-boundaries",
  type: "line",
  paint: {
    "line-color": "#536a6b",
    "line-width": 1,
  },
};

type MapBounds = [[number, number], [number, number]];

// GeoJSON 可能是 Polygon 或 MultiPolygon；递归访问坐标可用同一逻辑得到边界。
function getMapBounds(map: MapData): MapBounds {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  function visitCoordinates(value: unknown) {
    if (!Array.isArray(value)) {
      return;
    }

    if (typeof value[0] === "number" && typeof value[1] === "number") {
      const [longitude, latitude] = value;
      west = Math.min(west, longitude);
      south = Math.min(south, latitude);
      east = Math.max(east, longitude);
      north = Math.max(north, latitude);
      return;
    }

    for (const child of value) {
      visitCoordinates(child);
    }
  }

  for (const feature of map.features) {
    visitCoordinates(feature.geometry.coordinates);
  }

  return [[west, south], [east, north]];
}

export function MapChartPage() {
  // 页面状态分为两个层级：Region 决定数据文件，SA2 决定当前地区。
  const [selectedRegionCode, setSelectedRegionCode] = useState("03");
  const [hoveredSa2Id, setHoveredSa2Id] = useState<string | null>(null);
  const [selectedSa2Id, setSelectedSa2Id] = useState<string | null>(
    "179900",
  );

  // 第一层查询读取 Region 目录；第二层查询只读取当前 Region 的文件。
  const regionIndexQuery = useQuery({
    queryKey: ["map-chart-region-index"],
    queryFn: ({ signal }) => loadRegionIndex(signal),
    staleTime: Infinity,
    retry: false,
  });

  const selectedRegion = regionIndexQuery.data?.regions.find(
    (region) => region.regionCode === selectedRegionCode,
  );

  const regionDataQuery = useQuery({
    queryKey: ["map-chart-region", selectedRegionCode],
    queryFn: ({ signal }) => {
      if (!selectedRegion) {
        throw new Error("The selected Region was not found.");
      }

      return loadRegionData(selectedRegion, signal);
    },
    enabled: selectedRegion !== undefined,
    staleTime: Infinity,
    retry: false,
  });

  // 显示前置条件：地图配置、目录状态和当前 Region 数据状态。
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  if (regionIndexQuery.isError) {
    return (
      <div className="space-y-3">
        <p>{regionIndexQuery.error.message}</p>
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => void regionIndexQuery.refetch()}
          type="button"
        >
          Retry loading Regions
        </button>
      </div>
    );
  }

  if (regionIndexQuery.isPending || !regionIndexQuery.data) {
    return <p>Loading the Region index…</p>;
  }

  if (!selectedRegion) {
    return <p>The selected Region is not available.</p>;
  }

  if (regionDataQuery.isError) {
    return (
      <div className="space-y-3">
        <p>{regionDataQuery.error.message}</p>
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => void regionDataQuery.refetch()}
          type="button"
        >
          Retry loading Region data
        </button>
      </div>
    );
  }

  if (regionDataQuery.isPending || !regionDataQuery.data) {
    return <p>Loading {selectedRegion.name} data…</p>;
  }

  const data = regionDataQuery.data;
  const firstArea = data.map.features[0];

  if (!firstArea) {
    return <p>No map boundaries are available for {selectedRegion.name}.</p>;
  }

  // 地图事件：更新命中的编号，点击空白处保留原选择。
  function handleMapMove(event: MapLayerMouseEvent) {
    const id = event.features?.[0]?.id;
    setHoveredSa2Id(typeof id === "string" ? id : null);
  }

  function handleMapClick(event: MapLayerMouseEvent) {
    const id = event.features?.[0]?.id;

    if (typeof id === "string") {
      setSelectedSa2Id(id);
    }
  }

  // 地区记录：根据编号从同一份 GeoJSON 读取名称和指标。
  const hoveredArea = data.map.features.find(
    (feature) => feature.properties.sa2Id === hoveredSa2Id,
  );

  const selectedArea = data.map.features.find(
    (feature) => feature.properties.sa2Id === selectedSa2Id,
  ) ?? firstArea;
  const activeSa2Id = selectedArea.properties.sa2Id;
  const mapBounds = getMapBounds(data.map);

  // 历史选择：从已加载的大区文件按编号取出数组，无需再次请求。
  const selectedHistory = data.history.histories[activeSa2Id] ?? [];

  return (
    <section className="space-y-6">
      <title>Map and chart sample | RoostMap</title>

      <div className="space-y-4">
        <label className="grid gap-2 text-sm" htmlFor="region-select">
          <span>Region</span>
          <select
            id="region-select"
            className="w-full rounded-md border bg-background px-3 py-2 sm:w-72"
            value={selectedRegionCode}
            onChange={(event) => {
              setSelectedRegionCode(event.target.value);
              setHoveredSa2Id(null);
              setSelectedSa2Id(null);
            }}
          >
            {regionIndexQuery.data.regions.map((region) => (
              <option key={region.regionCode} value={region.regionCode}>
                {region.name}
              </option>
            ))}
          </select>
        </label>

        <h1 className="text-3xl font-semibold">
          {selectedRegion.name} rental data sample
        </h1>
        <p className="mt-2 text-muted-foreground">
          {regionIndexQuery.data.period} ·{" "}
          {data.history.dwellingType === "ALL"
            ? "All dwelling types"
            : data.history.dwellingType}
          {" · "}
          {data.history.bedroomCategory === "ALL"
            ? "All bedroom categories"
            : `${data.history.bedroomCategory} bedrooms`}
        </p>
      </div>
      {/* 地图：底图、SA2 图层与鼠标交互。 */}
      <div className="h-[420px] overflow-hidden rounded-xl border sm:h-[560px]">
        <Map
          key={selectedRegionCode}
          initialViewState={{
            bounds: mapBounds,
            fitBoundsOptions: { padding: 40 },
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${mapTilerKey}`}
          attributionControl={{ compact: false }}
          interactiveLayerIds={["sa2-fill"]}
          onMouseMove={handleMapMove}
          onMouseLeave={() => setHoveredSa2Id(null)}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" />
          <Source
            id="sa2-areas"
            type="geojson"
            data={data.map}
            promoteId="sa2Id"
          >
            <Layer {...sa2FillLayer} />
            <Layer {...sa2BoundaryLayer} />
            {/* 交互轮廓：悬停在下，点击选择在上。 */}
            <Layer
              id="sa2-hover"
              type="line"
              filter={["==", ["id"], hoveredSa2Id ?? ""]}
              paint={{ "line-color": "#2f6f9f", "line-width": 3 }}
            />
            <Layer
              id="sa2-selected"
              type="line"
              filter={["==", ["id"], activeSa2Id]}
              paint={{ "line-color": "#102a2d", "line-width": 4 }}
            />
          </Source>
        </Map>
      </div>
      {/* 图例与来源：说明租金分段、缺失值及统计口径。 */}
      <div className="space-y-2 text-sm">
        <p>
          Median weekly rent · NZD · {regionIndexQuery.data.period} ·{" "}
          {data.history.dwellingType} / {data.history.bedroomCategory}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <span className="mr-2 inline-block h-3 w-3 bg-[#57c8b8]" />
            Under $400
          </li>
          <li>
            <span className="mr-2 inline-block h-3 w-3 bg-[#e6ad5c]" />
            $400–under $600
          </li>
          <li>
            <span className="mr-2 inline-block h-3 w-3 bg-[#c45d55]" />
            $600 and over
          </li>
          <li>
            <span className="mr-2 inline-block h-3 w-3 bg-[#94a3b8]" />
            No observation
          </li>
        </ul>
        <p className="text-muted-foreground">
          Sources: MBIE rental bond data; Stats NZ SA2 2019 boundaries.
        </p>
      </div>

      {/* 地区信息：悬停提示和点击后保留的租金记录。 */}
      <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
        <p>
          Hovered SA2:{" "}
          {hoveredArea
            ? `${hoveredArea.properties.sa2Id} · ${hoveredArea.properties.name}`
            : "Move the pointer over an area"}
        </p>
        <h2 className="text-lg font-semibold">Selected SA2</h2>
        <p>
          {activeSa2Id} · {selectedArea.properties.name}
        </p>
        <p>
          Median weekly rent:{" "}
          {selectedArea.properties.medianRent === null
            ? "No observation"
            : `NZ$${selectedArea.properties.medianRent}`}
        </p>
        <p>
          Reported Bonds:{" "}
          {selectedArea.properties.reportedBonds ?? "No observation"}
        </p>
      </div>
      {/* 历史视图：名称、编号、图表和表格都来自当前点击选择。 */}
      <RentHistoryChart
        sa2Id={activeSa2Id}
        areaName={selectedArea.properties.name}
        dwellingType={data.history.dwellingType}
        bedroomCategory={data.history.bedroomCategory}
        observations={selectedHistory}
      />
    </section>
  );
}
