import type { Bedrooms, DwellingType } from "@/data/contracts";

// 当前租金的显示规则，Explore 列表和 Area Detail 共用。
// 缺失值显示为缺失，不当作 0。

// 12 个月变化以比例保存（0.0128），显示为带正负号的百分比（+1.3%）。
const changeFormatter = new Intl.NumberFormat("en-NZ", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function formatRent(medianRent: number | null): string {
  return medianRent === null ? "No data" : `NZ$${medianRent}/week`;
}

export function formatBonds(reportedBonds: number | null): string {
  return reportedBonds === null ? "No data" : `${reportedBonds} bonds`;
}

export function formatChange(yearOverYearChange: number | null): string {
  return yearOverYearChange === null
    ? "N/A"
    : changeFormatter.format(yearOverYearChange);
}

// release 的覆盖范围：只有一个 Region 时显示它的名称，否则显示 Region 数量，再加上区域总数。
// 例如 "Waikato Region · 222 areas" 或 "16 Regions · 2,009 areas"。
export function formatCoverage(partitions: { name: string; areaCount: number }[]): string {
  const areaCount = partitions.reduce((total, partition) => total + partition.areaCount, 0);
  const regions = partitions.length === 1 ? partitions[0].name : `${partitions.length} Regions`;

  return `${regions} · ${areaCount.toLocaleString("en-NZ")} areas`;
}

// 租金所在季度早于数据集最新季度时返回 true；这时的租金不能称为当前价格。
export function isOlderObservation(
  observationPeriod: string | null,
  datasetLatestPeriod: string,
): boolean {
  return observationPeriod !== null && observationPeriod !== datasetLatestPeriod;
}

// 分类在页面上的名称：ALL 显示为 "All …"，卧室数加上单位，例如 "1 bedroom"、"5+ bedrooms"。
export function formatDwellingType(dwellingType: DwellingType): string {
  return dwellingType === "ALL" ? "All dwelling types" : dwellingType;
}

export function formatBedrooms(bedrooms: Bedrooms): string {
  if (bedrooms === "ALL") {
    return "All bedroom categories";
  }

  return bedrooms === "1" ? "1 bedroom" : `${bedrooms} bedrooms`;
}
