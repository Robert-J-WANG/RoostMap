// 地图组件命名为 MapView，避免与 JavaScript 内置的 Map 重名（下面用 Map 建立查找表）。
import MapView, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerProps, MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";

import { useDocumentTheme } from "@/app/theme/useDocumentTheme";
import type {
  AreaWithCurrentRents,
  Bedrooms,
  DwellingType,
  RegionGeometry,
} from "@/data/contracts";
import { findCurrentRent } from "@/data/selection";
import { getBasemapStyleUrl, getMapBounds } from "@/lib/map";
import { missingRentColour, rentBands } from "@/lib/rentBands";

// 填色：没有租金的区域使用灰色，其余区域按 400 和 600 两个阈值分成三段。
const sa2FillLayer: LayerProps = {
  id: "sa2-fill",
  type: "fill",
  paint: {
    "fill-color": [
      "case",
      ["==", ["get", "medianRent"], null],
      missingRentColour,
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
    "fill-opacity": 0.65,
  },
};

const sa2BoundaryLayer: LayerProps = {
  id: "sa2-boundaries",
  type: "line",
  paint: {
    "line-color": "#ffffff",
    "line-opacity": 0.7,
    "line-width": 0.6,
  },
};

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
  const theme = useDocumentTheme();

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

  // 地图创建时显示整个 Region，URL 中已有的选择用边框标出，不自动放大。
  // 切换 Region 时，页面用 key 重新创建地图，这里会按新 Region 重新计算。
  const [initialViewState] = useState(() => ({
    bounds: getMapBounds(geometry.features),
    fitBoundsOptions: { padding: 40 },
  }));

  // 选中区域变化时不改变缩放级别。在列表中选中一个不在当前视野内的区域时，
  // 地图平移到它的中心，否则选中的边框看不到；在地图上点击的区域本来就在视野内，地图不动。
  useEffect(() => {
    const map = mapRef.current;
    const selectedFeature = geometry.features.find(
      (feature) => feature.id === selectedSa2Id,
    );

    if (!map || !selectedFeature) {
      return;
    }

    const [[west, south], [east, north]] = getMapBounds([selectedFeature]);
    const centre: [number, number] = [(west + east) / 2, (south + north) / 2];

    if (!map.getBounds().contains(centre)) {
      map.easeTo({ center: centre });
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

  // 手机上图例放在地图下方，不遮挡地图；桌面上叠放在地图左下角。
  return (
    <div className="flex flex-col gap-3 lg:relative lg:h-full">
      <div className="h-[360px] overflow-hidden rounded-xl border shadow-xs lg:h-full">
        <MapView
          attributionControl={{ compact: false }}
          initialViewState={initialViewState}
          interactiveLayerIds={["sa2-fill"]}
          mapStyle={getBasemapStyleUrl(theme, mapTilerKey)}
          onClick={handleMapClick}
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {/* promoteId 把属性中的 SA2 编号作为点击事件中的 feature id。 */}
          <Source data={mapData} id="sa2-areas" promoteId="sa2Id" type="geojson">
            <Layer {...sa2FillLayer} />
            <Layer {...sa2BoundaryLayer} />
            {/* 选中区域：白色宽线在下、深色线在上，在任何填色上都能看清。
                图层筛选中的 ["id"] 是被转成数字的原始 id，与字符串编号不相等，
                因此按属性 sa2Id 筛选。 */}
            <Layer
              filter={["==", ["get", "sa2Id"], selectedSa2Id ?? ""]}
              id="sa2-selected-casing"
              paint={{ "line-color": "#ffffff", "line-width": 5 }}
              type="line"
            />
            <Layer
              filter={["==", ["get", "sa2Id"], selectedSa2Id ?? ""]}
              id="sa2-selected"
              paint={{ "line-color": "#14213d", "line-width": 2 }}
              type="line"
            />
          </Source>
        </MapView>
      </div>

      {/* 图例与填色使用同一组分段和颜色。 */}
      <div className="rounded-lg border bg-card/85 px-3 py-2 text-xs shadow-xs backdrop-blur lg:absolute lg:bottom-3 lg:left-3">
        <p className="mb-1.5 font-medium">Median weekly rent</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-1">
          {rentBands.map((band) => (
            <li className="flex items-center gap-2" key={band.label}>
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: band.colour }}
              />
              {band.label}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: missingRentColour }}
            />
            No data
          </li>
        </ul>
      </div>
    </div>
  );
}
