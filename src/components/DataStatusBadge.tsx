import type { DataManifest } from "@/data/contracts";

type DataStatusBadgeProps = {
  status: DataManifest["rentalDataStatus"];
};

// 紧挨着数据季度显示的状态标记；数据为 final 时不显示。
export function DataStatusBadge({ status }: DataStatusBadgeProps) {
  if (status !== "provisional") {
    return null;
  }

  return (
    <span className="rounded-md border px-1.5 py-0.5 text-xs font-medium">
      Provisional
    </span>
  );
}
