import type {
  AreaWithCurrentRents,
  CurrentRent,
  DataManifest,
  ManifestPartition,
} from "@/data/contracts";

// Region 切换和分类筛选完成前，页面显示 Waikato 的全部住宅类型、全部卧室数。
export const defaultRegionCode = "03";
export const defaultDwellingType: CurrentRent["dwellingType"] = "ALL";
export const defaultBedrooms: CurrentRent["bedrooms"] = "ALL";

/**
 * 在 manifest 中找到一个 Region；找不到时使用第一个 Region。
 *
 * @param manifest 当前 manifest
 * @param regionCode Region 编号，例如 "03"
 * @returns manifest 中的一个 Region
 */
export function findPartition(manifest: DataManifest, regionCode: string): ManifestPartition {
  return (
    manifest.partitions.find((partition) => partition.id === regionCode) ??
    manifest.partitions[0]
  );
}

/**
 * 找到一个区域在指定住宅类型和卧室数下的当前租金。
 *
 * @param area 带有各分类当前租金的区域
 * @param dwellingType 住宅类型
 * @param bedrooms 卧室数
 * @returns 这个分类的当前租金；这个分类没有记录时返回 null，页面显示为缺失
 */
export function findCurrentRent(
  area: AreaWithCurrentRents,
  dwellingType: CurrentRent["dwellingType"],
  bedrooms: CurrentRent["bedrooms"],
): CurrentRent | null {
  return (
    area.currentRents.find(
      (currentRent) =>
        currentRent.dwellingType === dwellingType && currentRent.bedrooms === bedrooms,
    ) ?? null
  );
}
