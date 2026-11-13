import Map, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import { useState } from "react";
import type { LayerProps, MapLayerMouseEvent } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import { useQuery } from "@tanstack/react-query";

import { loadSampleData } from "@/features/explore/sample-data";
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

export function MapChartPage() {
  // 交互状态：分别保存悬停和点击选中的地区编号。
  const [hoveredSa2Id, setHoveredSa2Id] = useState<string | null>(null);
  const [selectedSa2Id, setSelectedSa2Id] = useState("179900");

  // 样例数据：由应用级查询客户端管理请求状态与缓存。
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["map-chart-sample"],
    queryFn: ({ signal }) => loadSampleData(signal),
    retry: false,
  });

  // 显示前置条件：地图配置、加载状态、请求错误和空数据。
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  if (isPending) {
    return <p>Loading the Waikato sample data…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p>{error.message}</p>
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => void refetch()}
          type="button"
        >
          Retry loading data
        </button>
      </div>
    );
  }

  if (data.map.features.length === 0) {
    return <p>No map boundaries are available for this sample.</p>;
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
    (feature) => feature.id === hoveredSa2Id,
  );

  const selectedArea = data.map.features.find(
    (feature) => feature.id === selectedSa2Id,
  );

  // 历史选择：从已加载的大区文件按编号取出数组，无需再次请求。
  const selectedHistory = data.history.histories[selectedSa2Id] ?? [];

  return (
    <section className="space-y-6">
      <title>Map and chart sample | RoostMap</title>

      <div>
        <h1 className="text-3xl font-semibold">Waikato rental data sample</h1>
        <p className="mt-2 text-muted-foreground">
          2026-04-01 · All dwelling types · All bedroom categories
        </p>
      </div>
      {/* 地图：底图、SA2 图层与鼠标交互。 */}
      <div className="h-[420px] overflow-hidden rounded-xl border sm:h-[560px]">
        <Map
          initialViewState={{
            longitude: 175.3,
            latitude: -37.8,
            zoom: 7,
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
              filter={["==", ["id"], selectedSa2Id]}
              paint={{ "line-color": "#102a2d", "line-width": 4 }}
            />
          </Source>
        </Map>
      </div>
      {/* 图例与来源：说明租金分段、缺失值及统计口径。 */}
      <div className="space-y-2 text-sm">
        <p>Median weekly rent · NZD · 2026-04-01 · ALL / ALL</p>
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
            ? `${hoveredArea.id} · ${hoveredArea.properties.name}`
            : "Move the pointer over an area"}
        </p>
        {selectedArea && (
          <>
            <h2 className="text-lg font-semibold">Selected SA2</h2>
            <p>
              {selectedArea.id} · {selectedArea.properties.name}
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
          </>
        )}
      </div>
      {/* 历史视图：名称、编号、图表和表格都来自当前点击选择。 */}
      {selectedArea && (
        <RentHistoryChart
          sa2Id={selectedSa2Id}
          areaName={selectedArea.properties.name}
          dwellingType={data.history.dwellingType}
          bedroomCategory={data.history.bedroomCategory}
          observations={selectedHistory}
        />
      )}
    </section>
  );
}
