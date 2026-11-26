import MapView, { Layer, Source } from "react-map-gl/maplibre";

import { useDocumentTheme } from "@/app/theme/useDocumentTheme";
import type { RegionGeometry } from "@/data/contracts";
import { getBasemapStyleUrl, getMapBounds } from "@/lib/map";

type AreaBoundaryMapProps = {
  geometry: RegionGeometry;
  sa2Id: string;
};

// 区域详情中的边界小地图：显示这个 SA2 的边界和周围的区域，只用于确认位置，不能拖动或点击。
// 边界来自与 Explore 相同的 Region 边界文件，从 Explore 进入时直接使用已经下载的数据。
export function AreaBoundaryMap({ geometry, sa2Id }: AreaBoundaryMapProps) {
  const theme = useDocumentTheme();
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;
  const feature = geometry.features.find((item) => item.id === sa2Id);

  // 地图的 paint 属性不能读取 CSS 变量，这里使用与主题主色相同的颜色值。
  const areaColour = theme === "dark" ? "#7aa7f5" : "#1f4e9c";

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  if (!feature) {
    return <p className="text-sm text-muted-foreground">No boundary is available for this area.</p>;
  }

  return (
    <div className="h-64 overflow-hidden rounded-xl border lg:h-full lg:min-h-64">
      <MapView
        attributionControl={{ compact: false }}
        initialViewState={{
          bounds: getMapBounds([feature]),
          fitBoundsOptions: { padding: 48, maxZoom: 13 },
        }}
        interactive={false}
        mapStyle={getBasemapStyleUrl(theme, mapTilerKey)}
        style={{ width: "100%", height: "100%" }}
      >
        <Source data={geometry} id="region-areas" type="geojson">
          {/* 周围区域只画淡色边界；这个区域用主题色填充并加粗边界。 */}
          <Layer
            id="neighbour-boundaries"
            paint={{ "line-color": "#64748b", "line-opacity": 0.5, "line-width": 0.6 }}
            type="line"
          />
          <Layer
            filter={["==", ["get", "sa2Id"], sa2Id]}
            id="area-fill"
            paint={{ "fill-color": areaColour, "fill-opacity": 0.35 }}
            type="fill"
          />
          <Layer
            filter={["==", ["get", "sa2Id"], sa2Id]}
            id="area-outline"
            paint={{ "line-color": areaColour, "line-width": 2.5 }}
            type="line"
          />
        </Source>
      </MapView>
    </div>
  );
}
