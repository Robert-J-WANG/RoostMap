import type { Bedrooms, DwellingType, QuarterlyRent } from "@/data/contracts";

// 图表中的一个季度：这个季度没有记录或没有租金时，geometricMeanRent 为 null，折线在这里断开。
export type RentHistoryPoint = {
  period: string;
  geometricMeanRent: number | null;
  reportedBonds: number | null;
};

// 季度使用季度首日表示（1、4、7、10 月）；下一个季度是三个月之后，10 月之后是下一年的 1 月。
function nextQuarter(period: string): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));

  if (month === 10) {
    return `${year + 1}-01-01`;
  }

  return `${year}-${String(month + 3).padStart(2, "0")}-01`;
}

/**
 * 把一个 SA2 的租金历史整理成一个分类的连续季度序列。
 * 源数据中缺失的季度通常没有记录，直接画图会跨过这些季度连线；
 * 这里为每个季度都生成一个位置，没有记录的季度填 null。
 *
 * @param records 这个 SA2 在全部分类下的季度租金记录
 * @param dwellingType 住宅类型
 * @param bedrooms 卧室数
 * @param latestPeriod 数据集最新季度，序列一直延伸到这个季度
 * @returns 从这个分类第一条记录的季度到 latestPeriod 的每个季度；这个分类没有记录时返回空数组
 */
export function buildRentHistorySeries(
  records: QuarterlyRent[],
  dwellingType: DwellingType,
  bedrooms: Bedrooms,
  latestPeriod: string,
): RentHistoryPoint[] {
  const categoryRecords = records.filter(
    (record) => record.dwellingType === dwellingType && record.bedrooms === bedrooms,
  );

  if (categoryRecords.length === 0) {
    return [];
  }

  // 按季度查找记录；季度文本是 YYYY-MM-DD，按文本排序就是按时间排序。
  const recordByPeriod = new Map(categoryRecords.map((record) => [record.period, record]));
  const firstPeriod = categoryRecords.map((record) => record.period).sort()[0];

  const series: RentHistoryPoint[] = [];

  for (let period = firstPeriod; period <= latestPeriod; period = nextQuarter(period)) {
    const record = recordByPeriod.get(period);

    series.push({
      period,
      geometricMeanRent: record?.geometricMeanRent ?? null,
      reportedBonds: record?.reportedBonds ?? null,
    });
  }

  return series;
}

// 序列中有租金的季度数量，决定图表的显示方式。
export function countObservedQuarters(series: RentHistoryPoint[]): number {
  return series.filter((point) => point.geometricMeanRent !== null).length;
}

// 季度标签，例如 "2020-01-01" 显示为 "2020 Q1"。
export function formatQuarter(period: string): string {
  const year = period.slice(0, 4);
  const quarter = Math.ceil(Number(period.slice(5, 7)) / 3);

  return `${year} Q${quarter}`;
}
