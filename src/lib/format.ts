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

// 租金所在季度早于数据集最新季度时返回 true；这时的租金不能称为当前价格。
export function isOlderObservation(
  observationPeriod: string | null,
  datasetLatestPeriod: string,
): boolean {
  return observationPeriod !== null && observationPeriod !== datasetLatestPeriod;
}
