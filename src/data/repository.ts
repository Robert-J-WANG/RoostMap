import { z } from "zod";

import {
  areaWithCurrentRentSchema,
  manifestSchema,
  regionGeometrySchema,
  type AreaWithCurrentRent,
  type DataManifest,
  type ManifestPartition,
  type RegionGeometry,
} from "@/data/contracts";

// 页面读取数据的固定入口，其余文件的地址都从 manifest 中取得。
const manifestUrl = "/data/manifest.json";

/**
 * 读取当前 manifest。
 *
 * @param signal 用于取消不再需要的请求
 * @returns 通过 contract 检查的 manifest
 * @throws 请求失败或内容不符合 contract 时，抛出带文件地址的错误
 */
export function fetchManifest(signal?: AbortSignal): Promise<DataManifest> {
  return fetchJson(manifestUrl, manifestSchema, signal);
}

/**
 * 读取一个 Region 的当前租金，地址取自 manifest。
 *
 * @param partition manifest 中的一个 Region
 * @param signal 用于取消不再需要的请求
 * @returns 这个 Region 全部可发布区域的列表，每一行通过 contract 检查
 * @throws 请求失败或内容不符合 contract 时，抛出带文件地址的错误
 */
export function fetchRegionCurrentRents(
  partition: ManifestPartition,
  signal?: AbortSignal,
): Promise<AreaWithCurrentRent[]> {
  return fetchJson(
    partition.currentRentsUrl,
    z.array(areaWithCurrentRentSchema),
    signal,
  );
}

/**
 * 读取一个 Region 的边界，地址取自 manifest。
 *
 * @param partition manifest 中的一个 Region
 * @param signal 用于取消不再需要的请求
 * @returns 通过 contract 检查的 GeoJSON FeatureCollection，feature id 为 SA2 编号
 * @throws 请求失败或内容不符合 contract 时，抛出带文件地址的错误
 */
export function fetchRegionGeometry(
  partition: ManifestPartition,
  signal?: AbortSignal,
): Promise<RegionGeometry> {
  return fetchJson(partition.geometryUrl, regionGeometrySchema, signal);
}

/**
 * 读取一个 JSON 文件，用 schema 检查后再返回。
 *
 * @typeParam T 这次读取的数据类型，由传入的 schema 决定
 * @param url 文件地址
 * @param schema 检查文件内容的 schema
 * @param signal 用于取消不再需要的请求
 * @returns 通过检查的数据
 * @throws 请求失败或内容不符合 contract 时，抛出带文件地址的错误
 */
async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  }

  const result = schema.safeParse(await response.json());

  if (!result.success) {
    throw new Error(
      `${url} does not match the data contract:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
