import { useEffect, useRef } from "react";

import type { AreaWithCurrentRent } from "@/data/contracts";
import { cn } from "@/lib/utils";

// 12 个月变化以比例保存（0.0128），显示为带正负号的百分比（+1.3%）。
const changeFormatter = new Intl.NumberFormat("en-NZ", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

type AreaListProps = {
  areas: AreaWithCurrentRent[];
  selectedSa2Id: string | null;
  onSelect: (sa2Id: string) => void;
};

export function AreaList({ areas, selectedSa2Id, onSelect }: AreaListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // 选中的行不在列表可见范围内时，把它滚到列表中间。
  // 只改变列表自己的 scrollTop，不滚动整个页面。
  useEffect(() => {
    const list = listRef.current;
    const index = areas.findIndex((area) => area.sa2Id === selectedSa2Id);

    if (!list || index === -1) {
      return;
    }

    const row = list.children[index] as HTMLElement;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const isVisible =
      rowTop >= list.scrollTop && rowBottom <= list.scrollTop + list.clientHeight;

    if (!isVisible) {
      list.scrollTop = rowTop - (list.clientHeight - row.offsetHeight) / 2;
    }
  }, [areas, selectedSa2Id]);

  // <ul> 设置 relative，使每行的 offsetTop 以列表为参照，上面的滚动计算依赖这一点。
  return (
    <ul
      className="relative max-h-[28rem] divide-y overflow-y-auto rounded-xl border bg-card lg:max-h-[560px]"
      ref={listRef}
    >
      {areas.map((area) => {
        const {
          datasetLatestPeriod,
          observationPeriod,
          medianRent,
          reportedBonds,
          yearOverYearChange,
        } = area.currentRent;

        // 缺失值显示为缺失，不当作 0；旧季度的租金标出季度，不称为当前价格。
        const isOlderObservation =
          observationPeriod !== null && observationPeriod !== datasetLatestPeriod;

        return (
          <li key={area.sa2Id}>
            <button
              className={cn(
                "w-full space-y-1 px-4 py-3 text-left transition-colors hover:bg-muted",
                area.sa2Id === selectedSa2Id && "bg-accent text-accent-foreground",
              )}
              onClick={() => onSelect(area.sa2Id)}
              type="button"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{area.name}</span>
                <span className="shrink-0 font-semibold">
                  {medianRent === null ? "No data" : `NZ$${medianRent}/week`}
                </span>
              </span>
              <span className="flex justify-between gap-4 text-sm text-muted-foreground">
                <span>{area.territorialAuthorityName}</span>
                <span className="shrink-0">
                  {reportedBonds === null ? "No data" : `${reportedBonds} bonds`}
                  {" · 12-month change "}
                  {yearOverYearChange === null
                    ? "N/A"
                    : changeFormatter.format(yearOverYearChange)}
                </span>
              </span>
              {isOlderObservation && (
                <span className="block text-xs text-muted-foreground">
                  Last observed {observationPeriod}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
