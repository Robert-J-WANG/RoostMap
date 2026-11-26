// 地图组件命名为 MapView，避免与 JavaScript 内置的 Map 重名（下面用 Map 建立查找表）。
import MapView, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerProps, MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import type {
  AreaWithCurrentRents,
  Bedrooms,
  DwellingType,
  RegionGeometry,
} from "@/data/contracts";
import { findCurrentRent } from "@/data/selection";

// 地图运行环境：在创建地图前指定 Worker 地址。
setWorkerUrl(workerUrl);

// 租金分段与图例使用同一组阈值和颜色。
const missingColour = "#94a3b8";
const rentBands = [
  { label: "Under $400", colour: "#57c8b8" },
  { label: "$400–under $600", colour: "#e6ad5c" },
  { label: "$600 and over", colour: "#c45d55" },
];

// 填色：没有租金的区域使用灰色，其余区域按 400 和 600 两个阈值分成三段。
const sa2FillLayer: LayerProps = {
  id: "sa2-fill",
  type: "fill",
  paint: {
    "fill-color": [
      "case",
      ["==", ["get", "medianRent"], null],
      missingColour,
      [
        "step",
        ["number", ["get", "medianRent"]],
        rentBands[0].colour,
        400,
        rentBands[1].colour,
        600,
        rentBands[2].colour,
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

// 地图移动到一个选中区域时使用的边距和最大缩放级别，避免小区域被放得过大。
const selectedAreaFitOptions = { padding: 80, maxZoom: 12 };

// 遍历全部坐标，得到能容纳这些区域的经纬度范围。
function getMapBounds(features: RegionGeometry["features"]): MapBounds {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const feature of features) {
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [longitude, latitude] of ring) {
          west = Math.min(west, longitude);
          south = Math.min(south, latitude);
          east = Math.max(east, longitude);
          north = Math.max(north, latitude);
        }
      }
    }
  }

  return [[west, south], [east, north]];
}

type AreaMapProps = {
  geometry: RegionGeometry;
  areas: AreaWithCurrentRents[];
  dwellingType: DwellingType;
  bedrooms: Bedrooms;
  selectedSa2Id: string | null;
  onSelect: (sa2Id: string) => void;
};

export function AreaMap({
  geometry,
  areas,
  dwellingType,
  bedrooms,
  selectedSa2Id,
  onSelect,
}: AreaMapProps) {
  // 边界文件只有 SA2 编号；按编号把列表所用分类的同一份租金放进 feature 属性。
  // Source 收到新的 data 对象就会重新处理全部边界，因此只在数据或分类变化时重新连接。
  const mapData = useMemo(() => {
    const medianRentBySa2Id = new Map(
      areas.map((area) => [
        area.sa2Id,
        findCurrentRent(area, dwellingType, bedrooms)?.medianRent ?? null,
      ]),
    );

    return {
      ...geometry,
      features: geometry.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          medianRent: medianRentBySa2Id.get(feature.id) ?? null,
        },
      })),
    };
  }, [geometry, areas, dwellingType, bedrooms]);

  const mapRef = useRef<MapRef>(null);

  // 地图创建时的范围：URL 中已有选择时显示这个区域，否则显示整个 Region。
  // 切换 Region 时，页面用 key 重新创建地图，这里会按新 Region 重新计算。
  const [initialViewState] = useState(() => {
    const selectedFeature = geometry.features.find(
      (feature) => feature.id === selectedSa2Id,
    );

    if (selectedFeature) {
      return {
        bounds: getMapBounds([selectedFeature]),
        fitBoundsOptions: selectedAreaFitOptions,
      };
    }

    return {
      bounds: getMapBounds(geometry.features),
      fitBoundsOptions: { padding: 40 },
    };
  });

  // 选中区域变化时，地图移动到这个区域，让地图视野与 URL 中的选择保持一致。
  // 地图刚创建时 mapRef 还是 null，这时由上面的 initialViewState 显示选中区域。
  useEffect(() => {
    const selectedFeature = geometry.features.find(
      (feature) => feature.id === selectedSa2Id,
    );

    if (selectedFeature) {
      mapRef.current?.fitBounds(getMapBounds([selectedFeature]), selectedAreaFitOptions);
    }
  }, [geometry, selectedSa2Id]);

  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  // 点击区域时选中它；点击空白处保留原选择。
  function handleMapClick(event: MapLayerMouseEvent) {
    const id = event.features?.[0]?.id;

    if (typeof id === "string") {
      onSelect(id);
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[360px] overflow-hidden rounded-xl border lg:h-[560px]">
        <MapView
          initialViewState={initialViewState}
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${mapTilerKey}`}
          attributionControl={{ compact: false }}
          interactiveLayerIds={["sa2-fill"]}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-right" />
          {/* promoteId 把属性中的 SA2 编号作为点击事件中的 feature id。 */}
          <Source id="sa2-areas" type="geojson" data={mapData} promoteId="sa2Id">
            <Layer {...sa2FillLayer} />
            <Layer {...sa2BoundaryLayer} />
            {/* 选中区域：白色宽线在下、深色线在上，在任何填色上都能看清。
                图层筛选中的 ["id"] 是被转成数字的原始 id，与字符串编号不相等，
                因此按属性 sa2Id 筛选。 */}
            <Layer
              id="sa2-selected-casing"
              type="line"
              filter={["==", ["get", "sa2Id"], selectedSa2Id ?? ""]}
              paint={{ "line-color": "#ffffff", "line-width": 5 }}
            />
            <Layer
              id="sa2-selected"
              type="line"
              filter={["==", ["get", "sa2Id"], selectedSa2Id ?? ""]}
              paint={{ "line-color": "#102a2d", "line-width": 2 }}
            />
          </Source>
        </MapView>
      </div>

      {/* 图例：与填色使用同一组分段和颜色。 */}
      <div className="space-y-2 text-sm">
        <p>Latest observed median weekly rent</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {rentBands.map((band) => (
            <li key={band.label}>
              <span
                className="mr-2 inline-block h-3 w-3"
                style={{ backgroundColor: band.colour }}
              />
              {band.label}
            </li>
          ))}
          <li>
            <span
              className="mr-2 inline-block h-3 w-3"
              style={{ backgroundColor: missingColour }}
            />
            No data
          </li>
        </ul>
      </div>
    </div>
  );
}
