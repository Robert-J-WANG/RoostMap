import { useQuery } from "@tanstack/react-query";

import type { ManifestPartition } from "@/data/contracts";
import {
  fetchManifest,
  fetchRegionCurrentRents,
  fetchRegionGeometry,
} from "@/data/repository";

// 三个查询都设置 staleTime: Infinity，读取成功后在页面打开期间不再重新请求：
// - 版本目录中的文件发布后不会再修改，重新请求只会得到相同内容；
// - manifest 在页面打开期间保持同一个版本，列表和地图因此不会读到不同版本的文件。

/**
 * 读取当前 manifest。
 *
 * @returns manifest 的查询状态
 */
export function useManifest() {
  return useQuery({
    queryKey: ["manifest"],
    queryFn: ({ signal }) => fetchManifest(signal),
    staleTime: Infinity,
  });
}

/**
 * 读取一个 Region 的当前租金。
 * 查询键使用文件地址，地址中已经包含版本号和 Region 编号。
 *
 * @param partition manifest 中的一个 Region
 * @returns 当前租金的查询状态
 */
export function useRegionCurrentRents(partition: ManifestPartition) {
  return useQuery({
    queryKey: ["region-current-rents", partition.currentRentsUrl],
    queryFn: ({ signal }) => fetchRegionCurrentRents(partition, signal),
    staleTime: Infinity,
  });
}

/**
 * 读取一个 Region 的边界。
 *
 * @param partition manifest 中的一个 Region
 * @returns 边界的查询状态
 */
export function useRegionGeometry(partition: ManifestPartition) {
  return useQuery({
    queryKey: ["region-geometry", partition.geometryUrl],
    queryFn: ({ signal }) => fetchRegionGeometry(partition, signal),
    staleTime: Infinity,
  });
}
