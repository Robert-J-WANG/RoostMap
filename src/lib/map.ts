import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Theme } from "@/app/theme/theme";
import type { RegionGeometry } from "@/data/contracts";

// Explore 和 Area Detail 的地图共用的设置。

// 地图运行环境：在创建地图前指定 Worker 地址。
setWorkerUrl(workerUrl);

// MapTiler 的 dataviz 底图颜色较淡，适合在上面叠加租金填色；深色模式使用对应的深色版本。
export function getBasemapStyleUrl(theme: Theme, mapTilerKey: string): string {
  const style = theme === "dark" ? "dataviz-v4-dark" : "dataviz-v4";

  return `https://api.maptiler.com/maps/${style}/style.json?key=${mapTilerKey}`;
}

export type MapBounds = [[number, number], [number, number]];

// 遍历全部坐标，得到能容纳这些区域的经纬度范围。
export function getMapBounds(features: RegionGeometry["features"]): MapBounds {
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
