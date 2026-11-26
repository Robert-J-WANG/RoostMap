import type { DataManifest } from "@/data/contracts";

type DataStatusBadgeProps = {
  status: DataManifest["rentalDataStatus"];
};

// 紧挨着数据季度显示的状态标记；数据为 final 时不显示。
// 鼠标停留时说明含义，完整说明在 Methodology 的 "Current data release" 中。
export function DataStatusBadge({ status }: DataStatusBadgeProps) {
  if (status !== "provisional") {
    return null;
  }

  return (
    <span
      className="rounded-md border border-highlight/40 bg-highlight-soft px-1.5 py-0.5 text-xs font-medium text-highlight"
      title="MBIE marks recent quarters as provisional; they may be revised in later data."
    >
      Provisional
    </span>
  );
}
