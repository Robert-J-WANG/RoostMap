import { ArrowRightIcon, MousePointerClickIcon } from "lucide-react";
import { Link } from "react-router";

import { ChangeIndicator } from "@/components/ChangeIndicator";
import { buttonVariants } from "@/components/ui/button";
import type { AreaWithCurrentRents, CurrentRent } from "@/data/contracts";
import { formatRent } from "@/lib/format";

type SelectedAreaCardProps = {
  area: AreaWithCurrentRents | undefined;
  currentRent: CurrentRent | null;
  detailsHref: string;
};

// 卡片外观：半透明背景加模糊，浮在地图上时仍能隐约看到下面的地图。
const cardClassName = "rounded-lg border bg-card/75 shadow-sm backdrop-blur-md";

// 选中区域卡片：桌面上浮在地图左上角，点击地图时选中的变化就在视线范围内；
// 手机上放在地图下方。显示所选分类的租金和 12 个月变化，以及详情入口。
export function SelectedAreaCard({ area, currentRent, detailsHref }: SelectedAreaCardProps) {
  if (!area) {
    return (
      <div className={`${cardClassName} flex items-center gap-2.5 px-3 py-2`}>
        <MousePointerClickIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">No area selected</h2>
          <p className="text-xs text-muted-foreground">
            Select an area on the map or in the list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClassName} space-y-2 px-3 py-2.5`}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Selected area</p>
        <h2 className="truncate text-sm font-semibold">{area.name}</h2>
        <p className="truncate text-xs text-muted-foreground">
          {area.territorialAuthorityName}
        </p>
      </div>
      {/* 租金和 12 个月变化在同一行，详情按钮单独一行、占满卡片宽度，不会超出卡片。 */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold tabular-nums">
          {formatRent(currentRent?.medianRent ?? null)}
        </p>
        <p className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
          12-month{" "}
          <ChangeIndicator change={currentRent?.yearOverYearChange ?? null} />
        </p>
      </div>
      <Link className={buttonVariants({ className: "w-full", size: "sm" })} to={detailsHref}>
        View details
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </Link>
    </div>
  );
}
