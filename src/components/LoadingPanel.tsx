import { LoaderCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingPanelProps = {
  label: string;
  className?: string;
};

// 数据读取期间的占位区域：占住内容将要出现的位置，并说明正在读取什么。
// 高度由使用的位置通过 className 指定，与随后出现的内容高度一致。
export function LoadingPanel({ label, className }: LoadingPanelProps) {
  return (
    <div
      className={cn(
        "flex animate-pulse items-center justify-center gap-2 rounded-xl border bg-muted/60 text-sm text-muted-foreground",
        className,
      )}
    >
      <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
      {label}
    </div>
  );
}
