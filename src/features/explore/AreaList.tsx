import { useEffect, useMemo, useRef } from "react";

import { ChangeIndicator } from "@/components/ChangeIndicator";
import type { AreaWithCurrentRents, Bedrooms, DwellingType } from "@/data/contracts";
import { findCurrentRent } from "@/data/selection";
import { formatBonds, formatRent, isOlderObservation } from "@/lib/format";
import { getRentColour } from "@/lib/rentBands";
import { cn } from "@/lib/utils";

type AreaListProps = {
  areas: AreaWithCurrentRents[];
  dwellingType: DwellingType;
  bedrooms: Bedrooms;
  selectedSa2Id: string | null;
  onSelect: (sa2Id: string) => void;
};

export function AreaList({
  areas,
  dwellingType,
  bedrooms,
  selectedSa2Id,
  onSelect,
}: AreaListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // 文件中的区域按 SA2 编号排列，列表改为按名称排列，便于查找。
  // 排序生成新数组，不改变查询缓存中的数据。
  const sortedAreas = useMemo(
    () => [...areas].sort((a, b) => a.name.localeCompare(b.name)),
    [areas],
  );

  // 选中的行不在列表可见范围内时，把它滚到列表中间。
  // 只改变列表自己的 scrollTop，不滚动整个页面。
  useEffect(() => {
    const list = listRef.current;
    const index = sortedAreas.findIndex((area) => area.sa2Id === selectedSa2Id);

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
  }, [sortedAreas, selectedSa2Id]);

  // <ul> 设置 relative，使每行的 offsetTop 以列表为参照，上面的滚动计算依赖这一点。
  // 手机上列表跟随页面滚动；桌面上列表填满右栏的高度，在自己的区域内滚动。
  return (
    <ul
      className="relative min-h-0 divide-y overflow-y-auto rounded-xl border bg-card"
      ref={listRef}
    >
      {sortedAreas.map((area) => {
        // 所选分类没有记录时 currentRent 为 null，各项都显示为缺失，不使用其他分类的值。
        const currentRent = findCurrentRent(area, dwellingType, bedrooms);
        const medianRent = currentRent?.medianRent ?? null;

        return (
          <li key={area.sa2Id}>
            <button
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                area.sa2Id === selectedSa2Id && "bg-accent text-accent-foreground hover:bg-accent",
              )}
              onClick={() => onSelect(area.sa2Id)}
              type="button"
            >
              {/* 颜色标记与地图上这个区域的填色相同。 */}
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getRentColour(medianRent) }}
              />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{area.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatRent(medianRent)}
                  </span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {area.territorialAuthorityName}
                </span>
                {/* 各部分之间保留空格，复制或读取文字时是一句完整的话。 */}
                <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatBonds(currentRent?.reportedBonds ?? null)}
                  </span>{" "}
                  <span aria-hidden="true">·</span>{" "}
                  <span>12-month change</span>{" "}
                  <ChangeIndicator change={currentRent?.yearOverYearChange ?? null} />
                </span>
                {/* 旧季度的租金标出季度，不称为当前价格。 */}
                {currentRent &&
                  isOlderObservation(currentRent.observationPeriod, currentRent.datasetLatestPeriod) && (
                    <span className="block text-xs text-highlight">
                      Last observed {currentRent.observationPeriod}
                    </span>
                  )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
