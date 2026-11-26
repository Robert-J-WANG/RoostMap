import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { formatChange } from "@/lib/format";
import { cn } from "@/lib/utils";

type ChangeIndicatorProps = {
  change: number | null;
  className?: string;
};

// 12 个月变化：箭头和颜色表示方向，文字仍然是带正负号的百分比。
// 上涨使用暖色，下降使用主题色，没有变化或无法计算时使用中性色。
export function ChangeIndicator({ change, className }: ChangeIndicatorProps) {
  let Icon = MinusIcon;
  let colour = "text-muted-foreground";

  if (change !== null && change > 0) {
    Icon = TrendingUpIcon;
    colour = "text-highlight";
  } else if (change !== null && change < 0) {
    Icon = TrendingDownIcon;
    colour = "text-primary";
  }

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", colour, className)}>
      <Icon aria-hidden="true" className="size-[1em]" />
      {formatChange(change)}
    </span>
  );
}
