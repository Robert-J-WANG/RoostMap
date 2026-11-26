import {
  bedroomCategories,
  dwellingTypes,
  type AreaWithCurrentRents,
  type Bedrooms,
  type CurrentRent,
  type DataManifest,
  type DwellingType,
  type ManifestPartition,
} from "@/data/contracts";

// 地址中没有选择时，页面显示 Waikato 的全部住宅类型、全部卧室数。
export const defaultRegionCode = "03";
export const defaultDwellingType: DwellingType = "ALL";
export const defaultBedrooms: Bedrooms = "ALL";

// 页面的公开选择：Region、住宅类型、卧室数和选中的 SA2，全部保存在 URL 中。
export type Selection = {
  regionCode: string;
  dwellingType: DwellingType;
  bedrooms: Bedrooms;
  sa2Id: string | null;
};

/**
 * 从 URL 读取选择，例如 ?region=09&dwelling=House&bedrooms=3&sa2=251400。
 * 缺少的参数和不是发布分类的值使用默认值；Region 是否存在由 findPartition 判断。
 *
 * @param searchParams 当前地址的查询参数
 * @returns 页面使用的选择
 */
export function readSelection(searchParams: URLSearchParams): Selection {
  const dwellingType = searchParams.get("dwelling");
  const bedrooms = searchParams.get("bedrooms");

  return {
    regionCode: searchParams.get("region") ?? defaultRegionCode,
    dwellingType: dwellingTypes.find((item) => item === dwellingType) ?? defaultDwellingType,
    bedrooms: bedroomCategories.find((item) => item === bedrooms) ?? defaultBedrooms,
    sa2Id: searchParams.get("sa2"),
  };
}

/**
 * 把选择写成地址的查询部分；等于默认值的参数不写入，默认选择得到空字符串。
 *
 * @param selection 要保存的选择
 * @returns 例如 "?region=09&bedrooms=3"，或者 ""
 */
export function toSearch(selection: Selection): string {
  const params = new URLSearchParams();

  if (selection.regionCode !== defaultRegionCode) {
    params.set("region", selection.regionCode);
  }
  if (selection.dwellingType !== defaultDwellingType) {
    params.set("dwelling", selection.dwellingType);
  }
  if (selection.bedrooms !== defaultBedrooms) {
    params.set("bedrooms", selection.bedrooms);
  }
  if (selection.sa2Id) {
    params.set("sa2", selection.sa2Id);
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

/**
 * 在 manifest 中找到一个 Region；找不到时使用默认 Region，再找不到时使用第一个 Region。
 *
 * @param manifest 当前 manifest
 * @param regionCode Region 编号，例如 "03"
 * @returns manifest 中的一个 Region
 */
export function findPartition(manifest: DataManifest, regionCode: string): ManifestPartition {
  return (
    manifest.partitions.find((partition) => partition.id === regionCode) ??
    manifest.partitions.find((partition) => partition.id === defaultRegionCode) ??
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
  dwellingType: DwellingType,
  bedrooms: Bedrooms,
): CurrentRent | null {
  return (
    area.currentRents.find(
      (currentRent) =>
        currentRent.dwellingType === dwellingType && currentRent.bedrooms === bedrooms,
    ) ?? null
  );
}
