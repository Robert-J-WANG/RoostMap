import wkx from "wkx";

/**
 * 把一条 Stats NZ（区域） SA2 记录的边界转换成 GeoJSON feature。
 * feature 的 id 和 properties.sa2Id 都是 SA2 编号，地图用它与当前租金连接。
 *
 * @param {{ SA22019_V1_00: string, geom: Uint8Array }} record GeoPackage 中的一条 SA2 记录
 * @returns {object} GeoJSON feature，geometry 为 Polygon 或 MultiPolygon
 */
export function convertToGeometryFeature(record) {
  const sa2Id = record.SA22019_V1_00;
  const geometry = wkx.Geometry.parse(extractGeoPackageWkb(record.geom)).toGeoJSON();

  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    throw new Error(`SA2 ${sa2Id} has unsupported geometry type ${geometry.type}`);
  }

  return {
    type: "Feature",
    id: sa2Id,
    geometry,
    properties: { sa2Id },
  };
}

/**
 * 从 GeoPackage geometry 中取出 WKB。
 * GeoPackage geometry 由 8 字节头部、可选 envelope 和 WKB 组成；
 * 头部 flags 的第 1–3 位决定 envelope 有几个坐标，每个坐标 8 字节。
 *
 * @param {Uint8Array} geometryBytes geom 字段的字节
 * @returns {Buffer} 去掉头部和 envelope 之后的 WKB
 */
function extractGeoPackageWkb(geometryBytes) {
  const geometryBuffer = Buffer.from(geometryBytes);

  if (geometryBuffer.length < 8 || geometryBuffer.toString("ascii", 0, 2) !== "GP") {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const envelopeType = (geometryBuffer.readUInt8(3) >> 1) & 0b111;
  // 下标是 envelope 类型：0 无、1 XY、2 XYZ、3 XYM、4 XYZM。
  const envelopeCoordinateCount = [0, 4, 6, 6, 8][envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  return geometryBuffer.subarray(8 + envelopeCoordinateCount * 8);
}
